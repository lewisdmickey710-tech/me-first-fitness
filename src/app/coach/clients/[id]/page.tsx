import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  advancePhase,
  logSessionOccurrence,
  markPaymentPaid,
  setClientDocumentAssignment,
  setRequestStatus,
  updateClientProfile,
} from "@/app/coach/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DeltaField,
  EmptyState,
  Heart,
  Input,
  PhaseBanner,
  Select,
  Sparkline,
  Textarea,
} from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { weekInPhase } from "@/lib/phase";
import { nextWindowLabel } from "@/lib/measurement-window";
import {
  formatSchedule,
  nextSessionFromSchedules,
  upcomingOccurrences,
} from "@/lib/schedule";
import { toDateString } from "@/lib/timezone";
import { computeCancellationRisk } from "@/lib/risk";
import type {
  Activity,
  CareProfile,
  Checkin,
  Client,
  ClientDocumentAssignment,
  ClientIntake,
  ClientMinorConsent,
  ClientPhaseHistory,
  ClientSchedule,
  LegalDocument,
  Measurement,
  OccurrenceStatus,
  Payment,
  ServiceCheckin,
  SessionOccurrence,
  SessionRequest,
  TrainingSession,
} from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "sessions", label: "Sessions" },
  { id: "attendance", label: "Attendance" },
  { id: "checkins", label: "Check-ins" },
  { id: "measurements", label: "Measurements" },
  { id: "activity", label: "Activity" },
  { id: "requests", label: "Requests" },
  { id: "payments", label: "Payments" },
] as const;

const OCCURRENCE_STATUS_LABEL: Record<OccurrenceStatus, string> = {
  completed: "Completed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  late_cancelled: "Late cancel",
};

function occurrenceBadgeTone(status: OccurrenceStatus) {
  if (status === "completed") return "green" as const;
  if (status === "rescheduled") return "gold" as const;
  return "pink" as const; // cancelled, late_cancelled
}

type TabId = (typeof TABS)[number]["id"];

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: TabId = (TABS.find((t) => t.id === tabParam)?.id ??
    "overview") as TabId;

  const supabase = await createClient();

  const { data: client } = (await supabase
    .from("clients")
    .select("*, care_profiles(*)")
    .eq("id", id)
    .single()) as {
    data: (Client & { care_profiles: CareProfile | null }) | null;
  };

  if (!client) notFound();

  const [
    { data: sessions },
    { data: checkins },
    { data: activities },
    { data: requests },
    { data: currentPhase },
    { data: measurements },
    { data: serviceCheckins },
    { data: schedules },
    { data: payments },
    { data: occurrences },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: TrainingSession[] | null;
    }>,
    supabase
      .from("checkins")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: Checkin[] | null;
    }>,
    supabase
      .from("activities")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: Activity[] | null;
    }>,
    supabase
      .from("requests")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: SessionRequest[] | null;
    }>,
    supabase
      .from("client_phase_history")
      .select("*")
      .eq("client_id", id)
      .is("ended_on", null)
      .order("started_on", { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: ClientPhaseHistory | null }>,
    supabase
      .from("measurements")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: Measurement[] | null;
    }>,
    supabase
      .from("service_checkins")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: ServiceCheckin[] | null;
    }>,
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", id)
      .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", id)
      .order("due_date", { ascending: true }) as unknown as Promise<{
      data: Payment[] | null;
    }>,
    supabase
      .from("session_occurrences")
      .select("*")
      .eq("client_id", id)
      .order("occurrence_date", { ascending: false }) as unknown as Promise<{
      data: SessionOccurrence[] | null;
    }>,
  ]);

  const { data: clientIntake } = (await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", id)
    .maybeSingle()) as { data: ClientIntake | null };

  const [{ data: optionalDocuments }, { data: assignments }, { data: minorConsent }] =
    await Promise.all([
      supabase
        .from("legal_documents")
        .select("*")
        .eq("assigned_to_all", false)
        .order("key") as unknown as Promise<{ data: LegalDocument[] | null }>,
      supabase
        .from("client_document_assignments")
        .select("*")
        .eq("client_id", id) as unknown as Promise<{
        data: ClientDocumentAssignment[] | null;
      }>,
      supabase
        .from("client_minor_consent")
        .select("*")
        .eq("client_id", id)
        .maybeSingle() as unknown as Promise<{ data: ClientMinorConsent | null }>,
    ]);

  const pendingCount = (requests ?? []).filter(
    (r) => r.status === "pending"
  ).length;
  const sessionsUsed = sessions?.length ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/coach/roster" className="text-sm text-gray hover:text-ink">
        ← Back to roster
      </Link>

      <PhaseBanner
        phase={currentPhase?.phase ?? "n/a"}
        title={client.name}
        subtitle={client.care_profiles?.name ?? "No care profile set"}
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/coach/clients/${id}?tab=${t.id}`}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-rose text-white" : "text-gray hover:text-ink"
            }`}
          >
            {t.label}
            {t.id === "requests" && pendingCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <Overview
          client={client}
          currentPhase={currentPhase}
          sessionsUsed={sessionsUsed}
          allSessions={sessions ?? []}
          recentSessions={sessions?.slice(0, 3) ?? []}
          measurements={measurements ?? []}
          latestServiceCheckin={serviceCheckins?.[0] ?? null}
          schedules={schedules ?? []}
          payments={payments ?? []}
          occurrences={occurrences ?? []}
          checkins={checkins ?? []}
          activities={activities ?? []}
        />
      )}
      {tab === "profile" && (
        <ProfileTab
          client={client}
          intake={clientIntake}
          optionalDocuments={optionalDocuments ?? []}
          assignments={assignments ?? []}
          minorConsent={minorConsent}
        />
      )}
      {tab === "sessions" && (
        <SessionsTab clientId={id} sessions={sessions ?? []} />
      )}
      {tab === "attendance" && (
        <AttendanceTab
          clientId={id}
          schedules={schedules ?? []}
          occurrences={occurrences ?? []}
        />
      )}
      {tab === "checkins" && (
        <CheckinsTab clientId={id} checkins={checkins ?? []} />
      )}
      {tab === "measurements" && (
        <MeasurementsTab
          clientId={id}
          measurements={measurements ?? []}
          serviceCheckins={serviceCheckins ?? []}
        />
      )}
      {tab === "activity" && <ActivityTab activities={activities ?? []} />}
      {tab === "requests" && (
        <RequestsTab clientId={id} requests={requests ?? []} />
      )}
      {tab === "payments" && (
        <PaymentsTab clientId={id} payments={payments ?? []} />
      )}
    </div>
  );
}

function Overview({
  client,
  currentPhase,
  sessionsUsed,
  allSessions,
  recentSessions,
  measurements,
  latestServiceCheckin,
  schedules,
  payments,
  occurrences,
  checkins,
  activities,
}: {
  client: Client;
  currentPhase: ClientPhaseHistory | null;
  sessionsUsed: number;
  allSessions: TrainingSession[];
  recentSessions: TrainingSession[];
  measurements: Measurement[];
  latestServiceCheckin: ServiceCheckin | null;
  schedules: ClientSchedule[];
  payments: Payment[];
  occurrences: SessionOccurrence[];
  checkins: Checkin[];
  activities: Activity[];
}) {
  const allotted = client.sessions_allotted;
  const nextSession = nextSessionFromSchedules(schedules);
  const today = toDateString(new Date());
  const unpaid = payments.filter((p) => !p.paid_on);
  const nextDue = unpaid.sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentCount = allSessions.filter(
    (s) => new Date(s.date) >= fourWeeksAgo
  ).length;
  const expectedCount = (client.days_per_week ?? 3) * 4;
  const consistencyPct =
    expectedCount > 0
      ? Math.min(100, Math.round((recentCount / expectedCount) * 100))
      : null;

  const latestMeasurement = measurements[0] ?? null;
  const previousMeasurement = measurements[1] ?? null;

  const lastTrackedDate = [...checkins.map((c) => c.date), ...activities.map((a) => a.date)]
    .sort()
    .at(-1);
  const daysSinceLastCheckinOrActivity = lastTrackedDate
    ? Math.floor(
        (new Date(today).getTime() - new Date(lastTrackedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const risk = computeCancellationRisk({
    recentOccurrenceStatuses: occurrences.map((o) => o.status),
    daysSinceLastCheckinOrActivity,
    hasOverduePayment: unpaid.some((p) => p.due_date < today),
    consistencyPct,
    latestServiceCheckinSatisfaction: latestServiceCheckin?.satisfaction ?? null,
  });

  return (
    <div className="space-y-4">
      {risk.isHighRisk ? (
        <Card className="border-pink/40 bg-pink/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            High cancellation risk
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray">
            {risk.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {currentPhase ? (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray">
                Cycle {currentPhase.cycle_number} · {phaseInfo(currentPhase.phase).name}
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                Week {weekInPhase(currentPhase.started_on)}
                <span className="text-base font-normal text-gray">
                  {" "}
                  (planned {currentPhase.planned_weeks})
                </span>
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await advancePhase(client.id);
              }}
            >
              <Button type="submit" variant="secondary">
                {currentPhase.phase === "4" ? "Start new cycle" : "Advance phase"}
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No active phase"
          body="This client isn't on a care profile with phase tracking yet."
        />
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray">Next session</p>
            {nextSession ? (
              <p className="mt-1 text-lg font-semibold text-ink">
                {formatSchedule(nextSession.dayOfWeek, nextSession.timeOfDay)}
                {nextSession.label ? ` · ${nextSession.label}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray">
                No recurring schedule set.
              </p>
            )}
          </div>
          <Link
            href={`/coach/clients/${client.id}/schedule`}
            className="shrink-0 text-sm text-gray hover:text-ink"
          >
            Manage
          </Link>
        </div>
      </Card>

      {nextDue ? (
        <Card className={nextDue.due_date < today ? "border-pink/40 bg-pink/5" : ""}>
          <p className="text-sm font-medium text-gray">
            {nextDue.due_date < today ? "Payment overdue" : "Payment due"}
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">
            ${Number(nextDue.amount).toFixed(2)}
            <span className="text-base font-normal text-gray">
              {" "}
              — {nextDue.description}, due {nextDue.due_date}
            </span>
          </p>
        </Card>
      ) : null}

      <Card>
        <p className="text-sm font-medium text-gray">Sessions</p>
        {allotted ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {sessionsUsed} / {allotted}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayLt">
              <div
                className="h-full rounded-full bg-rose"
                style={{
                  width: `${Math.min(100, (sessionsUsed / allotted) * 100)}%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {sessionsUsed} logged
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-medium text-gray">
          Consistency (last 4 weeks)
        </p>
        {consistencyPct !== null ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {consistencyPct}%
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayLt">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${consistencyPct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray">
            Set a weekly schedule to track this.
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-medium text-gray">Latest measurement</p>
        {latestMeasurement ? (
          <>
            <p className="mt-1 text-sm text-gray">{latestMeasurement.date}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              <DeltaField
                label="Weight"
                value={latestMeasurement.weight}
                previous={previousMeasurement?.weight ?? null}
                unit="lb"
              />
              <DeltaField
                label="Waist"
                value={latestMeasurement.waist}
                previous={previousMeasurement?.waist ?? null}
                unit="in"
              />
              <DeltaField
                label="Hips"
                value={latestMeasurement.hips}
                previous={previousMeasurement?.hips ?? null}
                unit="in"
              />
            </dl>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray">
            No measurements logged yet.
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-medium text-gray">Service check-in</p>
        {latestServiceCheckin ? (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {latestServiceCheckin.satisfaction ?? "—"}/5{" "}
            <span className="text-base font-normal text-gray">
              on {latestServiceCheckin.date}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-gray">
            No service check-in yet.
          </p>
        )}
        <p className="mt-2 text-xs text-gray">{nextWindowLabel()}</p>
      </Card>

      {client.notes ? (
        <Card>
          <p className="text-sm font-medium text-gray">Coach notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {client.notes}
          </p>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Recent sessions</p>
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions logged yet"
            body="Log the first session to start tracking progress."
          />
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{s.day_label}</p>
                  <p className="text-sm text-gray">{s.date}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({
  client,
  intake,
  optionalDocuments,
  assignments,
  minorConsent,
}: {
  client: Client;
  intake: ClientIntake | null;
  optionalDocuments: LegalDocument[];
  assignments: ClientDocumentAssignment[];
  minorConsent: ClientMinorConsent | null;
}) {
  const assignedDocIds = new Set(assignments.map((a) => a.document_id));
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <p className="font-medium text-rose">Basic information</p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateClientProfile(client.id, formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred name
              </label>
              <Input
                name="preferred_name"
                defaultValue={client.preferred_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Date of birth
              </label>
              <Input
                name="date_of_birth"
                type="date"
                defaultValue={client.date_of_birth ?? ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input name="phone" defaultValue={client.phone ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Email
              </label>
              <Input name="email" defaultValue={client.email ?? ""} />
            </div>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Emergency contact
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="emergency_contact_name"
                defaultValue={client.emergency_contact_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="emergency_contact_phone"
                defaultValue={client.emergency_contact_phone ?? ""}
              />
            </div>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Physician / provider
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="physician_name"
                defaultValue={client.physician_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="physician_phone"
                defaultValue={client.physician_phone ?? ""}
              />
            </div>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Program overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Start date
              </label>
              <Input
                name="start_date"
                type="date"
                defaultValue={client.start_date ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Payment schedule
              </label>
              <Select
                name="payment_schedule"
                defaultValue={client.payment_schedule ?? ""}
              >
                <option value="">— Choose one —</option>
                <option value="pay_as_you_go">Pay-as-you-go</option>
                <option value="monthly">Monthly client</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Primary goal
            </label>
            <Input name="primary_goal" defaultValue={client.primary_goal ?? ""} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Secondary goal
            </label>
            <Input
              name="secondary_goal"
              defaultValue={client.secondary_goal ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Key health notes{" "}
              <span className="font-normal text-gray">
                (flags, limitations, medications)
              </span>
            </label>
            <Textarea
              name="key_health_notes"
              rows={3}
              defaultValue={client.key_health_notes ?? ""}
            />
          </div>

          <Button type="submit">Save</Button>
        </form>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Intake questionnaire
        </p>
        {intake?.submitted_at ? (
          <ClientIntakeSummary intake={intake} />
        ) : (
          <EmptyState
            title="Not submitted yet"
            body="The client hasn't filled out their intake questionnaire yet."
          />
        )}
      </div>

      {optionalDocuments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray">
            Additional documents
          </p>
          <Card className="space-y-4">
            <p className="text-sm text-gray">
              These only go to clients checked below — not everyone.
            </p>
            {optionalDocuments.map((doc) => {
              const isAssigned = assignedDocIds.has(doc.id);
              return (
                <div key={doc.id} className="space-y-2 border-t border-grayLt pt-3 first:border-0 first:pt-0">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await setClientDocumentAssignment(
                        client.id,
                        doc.id,
                        formData.get("assigned") === "on"
                      );
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <Checkbox
                      name="assigned"
                      label={doc.title}
                      defaultChecked={isAssigned}
                    />
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                  {isAssigned && doc.key === "minor_consent" ? (
                    <p className="text-xs text-gray">
                      {minorConsent?.signed_at
                        ? `Filled out and signed by ${minorConsent.guardian_signature_name} on ${minorConsent.signed_at.slice(0, 10)}`
                        : "Assigned — not filled out yet."}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ClientIntakeSummary({ intake }: { intake: ClientIntake }) {
  const balanceFlags = [
    intake.fall_past_year && "fall in the past year",
    intake.near_fall && "near-fall/stumble",
    intake.fear_of_falling && "fear of falling",
  ].filter(Boolean);
  const boneFlags = [
    intake.osteoporosis && "osteoporosis/osteopenia",
    intake.joint_replacement && "joint replacement",
    intake.arthritis && "arthritis",
    intake.hypermobility && "hypermobility",
    intake.pots_dysautonomia && "POTS/dysautonomia",
    intake.mcas && "MCAS",
    intake.autoimmune_condition && "autoimmune condition",
  ].filter(Boolean);
  const dayFlags = [
    intake.lives_alone && "lives alone",
    intake.drives_self && "drives self",
    intake.stairs_daily && "stairs daily",
  ].filter(Boolean);
  const healthHistoryFlags = [
    intake.heart_condition && "heart condition",
    intake.high_blood_pressure && "high blood pressure",
    intake.diabetes && "diabetes",
    intake.thyroid_condition && "thyroid condition",
    intake.joint_issues && "joint issues",
    intake.asthma && "asthma",
    intake.anxiety_depression && "anxiety/depression",
    intake.eating_disorder_history && "eating disorder history",
    intake.pregnancy_postpartum && "pregnancy/postpartum",
  ].filter(Boolean);

  return (
    <Card className="space-y-3 text-sm">
      {intake.why_here ? (
        <Field label="Why they're here" value={intake.why_here} />
      ) : null}
      {intake.why_worthwhile ? (
        <Field
          label="What would make it worthwhile"
          value={intake.why_worthwhile}
        />
      ) : null}
      {balanceFlags.length > 0 ? (
        <Field label="Balance & falls" value={balanceFlags.join(", ")} />
      ) : null}
      {intake.balance_notes ? (
        <Field label="Balance notes" value={intake.balance_notes} />
      ) : null}
      {boneFlags.length > 0 ? (
        <Field
          label="Bones, joints & chronic conditions"
          value={boneFlags.join(", ")}
        />
      ) : null}
      {intake.bones_notes ? (
        <Field label="Bones notes" value={intake.bones_notes} />
      ) : null}
      {intake.fitness_level ? (
        <Field
          label="Fitness level"
          value={intake.fitness_level.replaceAll("_", " ")}
        />
      ) : null}
      {intake.body_satisfaction_scale != null ? (
        <Field
          label="Body satisfaction"
          value={`${intake.body_satisfaction_scale}/10`}
        />
      ) : null}
      {intake.strong_areas ? (
        <Field label="Strong areas" value={intake.strong_areas} />
      ) : null}
      {intake.injuries_limitations ? (
        <Field
          label="Injuries / limitations"
          value={intake.injuries_limitations}
        />
      ) : null}
      {healthHistoryFlags.length > 0 ? (
        <Field
          label="General health history"
          value={healthHistoryFlags.join(", ")}
        />
      ) : null}
      {intake.medications ? (
        <Field label="Medications" value={intake.medications} />
      ) : null}
      {intake.doctor_name ? (
        <Field label="Doctor" value={intake.doctor_name} />
      ) : null}
      {intake.medical_clearance ? (
        <Field
          label="Medical clearance"
          value={intake.medical_clearance.replaceAll("_", " ")}
        />
      ) : null}
      {dayFlags.length > 0 ? (
        <Field label="Day to day" value={dayFlags.join(", ")} />
      ) : null}
      {intake.day_to_day_notes ? (
        <Field label="Day to day notes" value={intake.day_to_day_notes} />
      ) : null}
      {intake.pain_location ? (
        <Field label="Pain location" value={intake.pain_location} />
      ) : null}
      {intake.pain_duration ? (
        <Field label="Pain duration" value={intake.pain_duration} />
      ) : null}
      {intake.pain_better ? (
        <Field label="What helps" value={intake.pain_better} />
      ) : null}
      {intake.pain_worse ? (
        <Field label="What worsens it" value={intake.pain_worse} />
      ) : null}
      {intake.pain_type && intake.pain_type.length > 0 ? (
        <Field label="Pain type" value={intake.pain_type.join(", ")} />
      ) : null}
      <Field
        label="Energy / Sleep / Stress / Confidence"
        value={`${intake.energy_scale ?? "—"} / ${intake.sleep_scale ?? "—"} / ${intake.stress_scale ?? "—"} / ${intake.confidence_scale ?? "—"}`}
      />
      {intake.goal_change_description ? (
        <Field
          label="What they want to change"
          value={intake.goal_change_description}
        />
      ) : null}
      {intake.goal_success_3_months ? (
        <Field
          label="Success in 3 months"
          value={intake.goal_success_3_months}
        />
      ) : null}
      {intake.goal_held_back_before ? (
        <Field
          label="What's held them back before"
          value={intake.goal_held_back_before}
        />
      ) : null}
      {intake.goal_importance_scale != null ||
      intake.confidence_to_change_scale != null ? (
        <Field
          label="Goal importance / Confidence to change"
          value={`${intake.goal_importance_scale ?? "—"} / ${intake.confidence_to_change_scale ?? "—"}`}
        />
      ) : null}
      {intake.nutrition_relationship ? (
        <Field
          label="Nutrition relationship"
          value={intake.nutrition_relationship.replaceAll("_", " ")}
        />
      ) : null}
      {intake.nutrition_notes ? (
        <Field label="Nutrition notes" value={intake.nutrition_notes} />
      ) : null}
      {intake.foods_loved ? (
        <Field label="Foods they love" value={intake.foods_loved} />
      ) : null}
      {intake.foods_scary ? (
        <Field label="Foods that feel scary" value={intake.foods_scary} />
      ) : null}
      {intake.diet_history ? (
        <Field
          label="Diet history"
          value={intake.diet_history.replaceAll("_", " ")}
        />
      ) : null}
      {intake.food_stress_scale != null ? (
        <Field
          label="Food stress impact"
          value={`${intake.food_stress_scale}/10`}
        />
      ) : null}
      {intake.support_system ? (
        <Field label="Support system" value={intake.support_system} />
      ) : null}
      {intake.competing_demands ? (
        <Field
          label="Competing demands"
          value={intake.competing_demands}
        />
      ) : null}
      {intake.average_sleep_hours || intake.sleep_duration_pattern ? (
        <Field
          label="Sleep"
          value={`${intake.average_sleep_hours ?? "—"} per night, for ${intake.sleep_duration_pattern ?? "—"}`}
        />
      ) : null}
      {intake.stress_sources ? (
        <Field label="Stress sources" value={intake.stress_sources} />
      ) : null}
      {intake.stress_coping ? (
        <Field label="How they cope" value={intake.stress_coping} />
      ) : null}
      {intake.coaching_style ? (
        <Field
          label="Coaching style preference"
          value={intake.coaching_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.feedback_style ? (
        <Field
          label="Feedback style preference"
          value={intake.feedback_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.contact_method ? (
        <Field
          label="Preferred contact method"
          value={intake.contact_method.replaceAll("_", " ")}
        />
      ) : null}
      {intake.checkin_frequency ? (
        <Field
          label="Check-in frequency"
          value={intake.checkin_frequency.replaceAll("_", " ")}
        />
      ) : null}
      {intake.accountability_style ? (
        <Field
          label="Accountability style"
          value={intake.accountability_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.past_coach_what_didnt_work ? (
        <Field
          label="What hasn't worked before"
          value={intake.past_coach_what_didnt_work}
        />
      ) : null}
      {intake.anything_else ? (
        <Field label="Anything else" value={intake.anything_else} />
      ) : null}
      {intake.referral_source ? (
        <Field
          label="How they heard about us"
          value={intake.referral_source.replaceAll("_", " ")}
        />
      ) : null}
    </Card>
  );
}

function SessionsTab({
  clientId,
  sessions,
}: {
  clientId: string;
  sessions: TrainingSession[];
}) {
  return (
    <div className="space-y-4">
      <Link
        href={`/coach/clients/${clientId}/log-session`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Log session
      </Link>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Log a session to start building this client's history."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{s.day_label}</p>
                <p className="text-sm text-gray">{s.date}</p>
              </div>
              {s.entries.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-gray">
                  {s.entries.map((e, i) => (
                    <li key={i}>
                      {e.exercise} — {e.sets}x{e.reps}
                      {e.weight ? ` @ ${e.weight}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.rating ? (
                <p className="mt-2 text-sm text-gray">Rating: {s.rating}/5</p>
              ) : null}
              {s.day_notes ? (
                <p className="mt-1 text-sm text-ink">{s.day_notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceTab({
  clientId,
  schedules,
  occurrences,
}: {
  clientId: string;
  schedules: ClientSchedule[];
  occurrences: SessionOccurrence[];
}) {
  const resolvedDates = new Set(occurrences.map((o) => o.occurrence_date));
  const upcoming = upcomingOccurrences(schedules, resolvedDates, 14);

  const counts = occurrences.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OccurrenceStatus, number>
  );
  const total = occurrences.length;
  const cancelledOrLate = (counts.cancelled ?? 0) + (counts.late_cancelled ?? 0);
  const cancellationRatePct =
    total > 0 ? Math.round((cancelledOrLate / total) * 100) : null;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-medium text-gray">
          Cancellation rate (all recorded)
        </p>
        {cancellationRatePct !== null ? (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {cancellationRatePct}%
            <span className="text-base font-normal text-gray">
              {" "}
              — {counts.completed ?? 0} completed · {counts.cancelled ?? 0}{" "}
              cancelled · {counts.late_cancelled ?? 0} late cancel ·{" "}
              {counts.rescheduled ?? 0} rescheduled
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-gray">Nothing recorded yet.</p>
        )}
      </Card>

      {upcoming.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray">Upcoming — mark outcome</p>
          {upcoming.map((occ) => (
            <Card key={`${occ.scheduleId}-${occ.date}`}>
              <p className="font-medium text-ink">
                {occ.date} · {formatSchedule(occ.dayOfWeek, occ.timeOfDay)}
                {occ.label ? ` · ${occ.label}` : ""}
              </p>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  formData.set("occurrence_date", occ.date);
                  formData.set("client_schedule_id", occ.scheduleId);
                  await logSessionOccurrence(clientId, formData);
                }}
                className="mt-2 space-y-2"
              >
                <div className="flex flex-wrap items-end gap-2">
                  <Select name="status" defaultValue="" className="w-40" required>
                    <option value="" disabled>
                      Mark as…
                    </option>
                    <option value="cancelled">Cancelled</option>
                    <option value="late_cancelled">Late cancel (&lt;12h)</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="completed">Completed</option>
                  </Select>
                  <Button type="submit" variant="secondary">
                    Save
                  </Button>
                </div>
                <Textarea
                  name="notes"
                  rows={1}
                  placeholder="Reason, or reschedule details (optional)"
                />
              </form>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray">History</p>
        {occurrences.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            body="Logged sessions are recorded here automatically. Use the upcoming list above to mark cancellations or reschedules."
          />
        ) : (
          occurrences.map((o) => (
            <Card key={o.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{o.occurrence_date}</p>
                {o.rescheduled_to_date ? (
                  <p className="text-sm text-gray">
                    Rescheduled to {o.rescheduled_to_date}
                  </p>
                ) : null}
                {o.notes ? (
                  <p className="text-sm text-gray">{o.notes}</p>
                ) : null}
              </div>
              <Badge tone={occurrenceBadgeTone(o.status)}>
                {OCCURRENCE_STATUS_LABEL[o.status]}
              </Badge>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CheckinsTab({
  clientId,
  checkins,
}: {
  clientId: string;
  checkins: Checkin[];
}) {
  return (
    <div className="space-y-4">
      <Link
        href={`/coach/clients/${clientId}/log-checkin`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Log check-in
      </Link>

      {checkins.length === 0 ? (
        <EmptyState
          title="No check-ins yet"
          body="Check-ins logged by you or your client will show up here."
        />
      ) : (
        <div className="space-y-3">
          {checkins.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{c.date}</p>
                <Badge tone={c.logged_by === "coach" ? "rose" : "teal"}>
                  logged by {c.logged_by}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray sm:grid-cols-3">
                {c.sleep ? <Field label="Sleep" value={c.sleep} /> : null}
                {c.water ? <Field label="Water" value={c.water} /> : null}
                {c.food ? <Field label="Food" value={c.food} /> : null}
                {c.energy ? <Field label="Energy" value={c.energy} /> : null}
                {c.mood ? <Field label="Mood" value={c.mood} /> : null}
              </dl>
              {c.notes ? (
                <p className="mt-2 text-sm text-ink">{c.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MeasurementsTab({
  clientId,
  measurements,
  serviceCheckins,
}: {
  clientId: string;
  measurements: Measurement[];
  serviceCheckins: ServiceCheckin[];
}) {
  const weights = measurements
    .slice()
    .reverse()
    .filter((m) => m.weight != null)
    .map((m) => m.weight as number);

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${clientId}/log-measurement`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Log measurement
      </Link>

      {measurements.length === 0 ? (
        <EmptyState
          title="No measurements yet"
          body="Log the first measurement to start tracking trends."
        />
      ) : (
        <>
          {weights.length >= 2 ? (
            <Card>
              <p className="text-sm font-medium text-gray">Weight trend</p>
              <Sparkline values={weights} />
            </Card>
          ) : null}

          <div className="space-y-3">
            {measurements.map((m, i) => {
              const previous = measurements[i + 1] ?? null;
              return (
                <Card key={m.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink">{m.date}</p>
                    <Badge tone={m.logged_by === "coach" ? "rose" : "teal"}>
                      logged by {m.logged_by}
                    </Badge>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                    <DeltaField label="Weight" value={m.weight} previous={previous?.weight ?? null} unit="lb" />
                    <DeltaField label="Neck" value={m.neck} previous={previous?.neck ?? null} unit="in" />
                    <DeltaField label="Chest" value={m.chest} previous={previous?.chest ?? null} unit="in" />
                    <DeltaField label="Waist" value={m.waist} previous={previous?.waist ?? null} unit="in" />
                    <DeltaField label="Hips" value={m.hips} previous={previous?.hips ?? null} unit="in" />
                    <DeltaField label="Thigh L" value={m.thigh_l} previous={previous?.thigh_l ?? null} unit="in" />
                    <DeltaField label="Thigh R" value={m.thigh_r} previous={previous?.thigh_r ?? null} unit="in" />
                    <DeltaField label="Bicep L" value={m.bicep_l} previous={previous?.bicep_l ?? null} unit="in" />
                    <DeltaField label="Bicep R" value={m.bicep_r} previous={previous?.bicep_r ?? null} unit="in" />
                  </dl>
                  {m.notes ? (
                    <p className="mt-2 text-sm text-ink">{m.notes}</p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Service check-ins
        </p>
        {serviceCheckins.length === 0 ? (
          <EmptyState
            title="No service check-ins yet"
            body="Your client's monthly satisfaction check-ins will show up here."
          />
        ) : (
          <div className="space-y-3">
            {serviceCheckins.map((sc) => (
              <Card key={sc.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{sc.date}</p>
                  {sc.satisfaction != null ? (
                    <Badge tone="gold">{sc.satisfaction}/5</Badge>
                  ) : null}
                </div>
                {sc.what_working ? (
                  <p className="mt-2 text-sm text-ink">
                    <span className="font-medium">Working well:</span>{" "}
                    {sc.what_working}
                  </p>
                ) : null}
                {sc.what_would_help ? (
                  <p className="mt-1 text-sm text-ink">
                    <span className="font-medium">Would help:</span>{" "}
                    {sc.what_would_help}
                  </p>
                ) : null}
                {sc.anything_else ? (
                  <p className="mt-1 text-sm text-ink">
                    <span className="font-medium">Anything else:</span>{" "}
                    {sc.anything_else}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray/70">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function ActivityTab({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity logged yet"
        body="Out-of-session activity your client logs will show up here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <Card key={a.id}>
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">{a.type}</p>
            <p className="text-sm text-gray">{a.date}</p>
          </div>
          {a.duration ? (
            <p className="mt-1 text-sm text-gray">{a.duration}</p>
          ) : null}
          {a.notes ? <p className="mt-1 text-sm text-ink">{a.notes}</p> : null}
        </Card>
      ))}
    </div>
  );
}

function RequestsTab({
  clientId,
  requests,
}: {
  clientId: string;
  requests: SessionRequest[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No time requests"
        body="When this client requests a session time, it'll show up here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">
                {r.preferred_date}
                {r.preferred_time ? ` at ${r.preferred_time}` : ""}
              </p>
              {r.note ? (
                <p className="mt-1 text-sm text-gray">{r.note}</p>
              ) : null}
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await setRequestStatus(r.id, clientId, "confirmed");
                }}
              >
                <Button type="submit">Confirm</Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await setRequestStatus(r.id, clientId, "declined");
                }}
              >
                <Button type="submit" variant="danger">
                  Decline
                </Button>
              </form>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function PaymentsTab({
  clientId,
  payments,
}: {
  clientId: string;
  payments: Payment[];
}) {
  const today = toDateString(new Date());

  return (
    <div className="space-y-4">
      <Link
        href={`/coach/clients/${clientId}/payments/new`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Add payment due
      </Link>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments tracked yet"
          body="Add what this client owes and the app will remind them by email as it comes due."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const overdue = !p.paid_on && p.due_date < today;
            return (
              <Card
                key={p.id}
                className={overdue ? "border-pink/40 bg-pink/5" : ""}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{p.description}</p>
                  {p.paid_on ? (
                    <Badge tone="green">paid {p.paid_on}</Badge>
                  ) : overdue ? (
                    <Badge tone="pink">overdue</Badge>
                  ) : (
                    <Badge tone="gold">due {p.due_date}</Badge>
                  )}
                </div>
                <p className="mt-1 text-lg font-semibold text-ink">
                  ${Number(p.amount).toFixed(2)}
                </p>
                {!p.paid_on ? (
                  <form
                    action={async () => {
                      "use server";
                      await markPaymentPaid(p.id, clientId);
                    }}
                    className="mt-3"
                  >
                    <Button type="submit" variant="secondary">
                      Mark paid
                    </Button>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SessionRequest["status"] }) {
  const tone =
    status === "confirmed" ? "green" : status === "declined" ? "pink" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}
