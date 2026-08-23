import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CareProfilePicker } from "@/app/coach/roster/new/CareProfilePicker";
import {
  addClientNote,
  addMilestone,
  advancePhase,
  archiveClient,
  coachCancelSession,
  deleteClientNote,
  deleteMilestone,
  logSessionOccurrence,
  markMilestoneAchieved,
  markPaymentPaid,
  setClientDocumentAssignment,
  setRequestStatus,
  touchClientViewed,
  unmarkMilestoneAchieved,
  updateClientProfile,
} from "@/app/coach/actions";
import { ProgramDayEditor } from "./ProgramDayEditor";
import { BackLink } from "@/components/back-link";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Collapsible,
  DeltaField,
  DocumentBody,
  EmptyState,
  Heart,
  Input,
  PhaseBanner,
  Select,
  Sparkline,
  Textarea,
} from "@/components/ui";
import { BodyMapInput } from "@/components/body-map";
import { phaseInfo } from "@/lib/constants";
import { weekInPhase } from "@/lib/phase";
import { nextWindowLabel } from "@/lib/measurement-window";
import {
  DAY_NAMES,
  formatSchedule,
  nextSessionForClient,
  upcomingOccurrences,
} from "@/lib/schedule";
import { nowInBusinessTz, toDateString, US_TIMEZONES } from "@/lib/timezone";
import { computeCancellationRisk } from "@/lib/risk";
import { payAsYouGoStatus } from "@/lib/payment-status";
import type {
  Activity,
  CareProfile,
  Checkin,
  Client,
  ClientDocumentAcknowledgment,
  ClientDocumentAssignment,
  ClientHabit,
  ClientProgressPhoto,
  ClientHabitLog,
  ClientIntake,
  ClientMilestone,
  ClientMinorConsent,
  ClientNote,
  ClientNutritionLog,
  ClientPhaseHistory,
  ClientProgramOverride,
  ClientSchedule,
  ClientSymptomLog,
  LegalDocument,
  Measurement,
  OccurrenceStatus,
  Payment,
  ServiceCheckin,
  SessionOccurrence,
  SessionRequest,
  SessionType,
  TrainingSession,
} from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "documents", label: "Documents" },
  { id: "program", label: "Program" },
  { id: "sessions", label: "Sessions" },
  { id: "attendance", label: "Attendance" },
  { id: "checkins", label: "Check-ins" },
  { id: "measurements", label: "Measurements" },
  { id: "activity", label: "Activity" },
  { id: "requests", label: "Requests" },
  { id: "payments", label: "Payments" },
  { id: "habits", label: "Habits" },
  { id: "nutrition", label: "Nutrition" },
  { id: "symptoms", label: "Symptoms" },
] as const;

const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  program: "Program day",
  freestyle: "Freestyle",
  conversation: "Conversation",
  recovery: "Recovery",
  assessment: "Assessment",
};

const OCCURRENCE_STATUS_LABEL: Record<OccurrenceStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  late_cancelled: "Late cancel",
};

interface ProgramDayWithExercisesRow {
  id: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    id: string;
    position: number;
    sets: string | null;
    reps: string | null;
    tempo: string | null;
    superset_group: string | null;
    exercise_id: string;
    exercises: { id: string; name: string } | null;
  }[];
}

function occurrenceBadgeTone(status: OccurrenceStatus) {
  if (status === "scheduled") return "teal" as const;
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

  await touchClientViewed(id);

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
    { data: progressPhotos },
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
    supabase
      .from("client_progress_photos")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: ClientProgressPhoto[] | null;
    }>,
  ]);

  const progressPhotoUrlByPath = new Map<string, string>();
  const progressPhotoPaths = [
    ...new Set((progressPhotos ?? []).map((p) => p.photo_path)),
  ];
  if (progressPhotoPaths.length > 0) {
    await Promise.all(
      progressPhotoPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from("form-checks")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) progressPhotoUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  const { data: clientIntake } = (await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", id)
    .maybeSingle()) as { data: ClientIntake | null };

  const [
    { data: allDocuments },
    { data: assignments },
    { data: minorConsent },
    { data: documentAcks },
  ] = await Promise.all([
    supabase.from("legal_documents").select("*").order("key") as unknown as Promise<{
      data: LegalDocument[] | null;
    }>,
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
    supabase
      .from("client_document_acknowledgments")
      .select("*")
      .eq("client_id", id) as unknown as Promise<{
      data: ClientDocumentAcknowledgment[] | null;
    }>,
  ]);

  const optionalDocuments = (allDocuments ?? []).filter((d) => !d.assigned_to_all);

  const { data: careProfiles } = (await supabase
    .from("care_profiles")
    .select("*")
    .order("name")) as { data: CareProfile[] | null };

  const { data: programDays } =
    client.care_profile_id && currentPhase
      ? ((await supabase
          .from("program_days")
          .select(
            "id, day_number, day_label, program_day_exercises(id, position, sets, reps, tempo, superset_group, exercise_id, exercises(id, name))"
          )
          .eq("care_profile_id", client.care_profile_id)
          .eq("phase", currentPhase.phase)
          .order("day_number")) as unknown as {
          data: ProgramDayWithExercisesRow[] | null;
        })
      : { data: null };

  const programPdeIds = (programDays ?? []).flatMap((d) =>
    d.program_day_exercises.map((pde) => pde.id)
  );
  const { data: programOverrides } = programPdeIds.length
    ? ((await supabase
        .from("client_program_overrides")
        .select("*")
        .eq("client_id", id)
        .eq("active", true)
        .in("program_day_exercise_id", programPdeIds)) as unknown as {
        data: ClientProgramOverride[] | null;
      })
    : { data: [] as ClientProgramOverride[] };

  const { data: exerciseOptions } = client.care_profile_id
    ? ((await supabase.from("exercises").select("id, name").order("name")) as unknown as {
        data: { id: string; name: string }[] | null;
      })
    : { data: [] as { id: string; name: string }[] };

  const sevenDaysAgo = toDateString(
    new Date(nowInBusinessTz().getTime() - 6 * 86400000)
  );
  const [{ data: habits }, { data: habitLogs }, { data: symptomLogs }, { data: nutritionLogs }] =
    await Promise.all([
      supabase
        .from("client_habits")
        .select("*")
        .eq("client_id", id)
        .eq("active", true)
        .order("created_at") as unknown as Promise<{ data: ClientHabit[] | null }>,
      supabase
        .from("client_habit_logs")
        .select("*")
        .eq("client_id", id)
        .gte("log_date", sevenDaysAgo) as unknown as Promise<{
        data: ClientHabitLog[] | null;
      }>,
      // RLS scopes the coach's view of this table to shared_with_coach = true
      // rows only -- nothing further to filter here.
      supabase
        .from("client_symptom_logs")
        .select("*")
        .eq("client_id", id)
        .order("log_date", { ascending: false })
        .limit(20) as unknown as Promise<{ data: ClientSymptomLog[] | null }>,
      supabase
        .from("client_nutrition_logs")
        .select("*")
        .eq("client_id", id)
        .order("log_date", { ascending: false })
        .limit(20) as unknown as Promise<{ data: ClientNutritionLog[] | null }>,
    ]);

  const { data: clientNotes } = (await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })) as { data: ClientNote[] | null };

  const { data: milestones } = (await supabase
    .from("client_milestones")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })) as { data: ClientMilestone[] | null };

  const pendingCount = (requests ?? []).filter(
    (r) => r.status === "pending"
  ).length;
  const sessionsUsed = sessions?.length ?? 0;

  return (
    <div className="space-y-6">
      <BackLink href="/coach/roster">← Back to roster</BackLink>

      <PhaseBanner
        phase={currentPhase?.phase ?? "n/a"}
        title={client.name}
        subtitle={client.care_profiles?.name ?? "No care profile set"}
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {TABS.filter(
          (t) => t.id !== "symptoms" || client.symptom_tracker_enabled
        ).map((t) => (
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
          notes={clientNotes ?? []}
        />
      )}
      {tab === "profile" && (
        <ProfileTab
          client={client}
          intake={clientIntake}
          careProfiles={careProfiles ?? []}
          milestones={milestones ?? []}
        />
      )}
      {tab === "documents" && (
        <DocumentsTab
          clientId={id}
          allDocuments={allDocuments ?? []}
          optionalDocuments={optionalDocuments}
          assignments={assignments ?? []}
          acks={documentAcks ?? []}
          minorConsent={minorConsent}
        />
      )}
      {tab === "program" && (
        <ProgramTab
          clientId={id}
          currentPhase={currentPhase}
          programDays={programDays ?? []}
          overrides={programOverrides ?? []}
          exerciseOptions={exerciseOptions ?? []}
          recentSessions={sessions ?? []}
        />
      )}
      {tab === "sessions" && (
        <SessionsTab clientId={id} sessions={sessions ?? []} supabase={supabase} />
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
          progressPhotos={progressPhotos ?? []}
          progressPhotoUrlByPath={progressPhotoUrlByPath}
        />
      )}
      {tab === "activity" && <ActivityTab activities={activities ?? []} />}
      {tab === "requests" && (
        <RequestsTab clientId={id} requests={requests ?? []} />
      )}
      {tab === "payments" && (
        <PaymentsTab clientId={id} payments={payments ?? []} />
      )}
      {tab === "habits" && (
        <HabitsTab habits={habits ?? []} habitLogs={habitLogs ?? []} />
      )}
      {tab === "nutrition" && (
        <NutritionTab nutritionLogs={nutritionLogs ?? []} supabase={supabase} />
      )}
      {tab === "symptoms" && client.symptom_tracker_enabled && (
        <SymptomsTab symptomLogs={symptomLogs ?? []} />
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
  notes,
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
  notes: ClientNote[];
}) {
  const allotted = client.sessions_allotted;
  const nextSession = nextSessionForClient(schedules, occurrences);
  const today = toDateString(new Date());
  const unpaid = payments.filter((p) => !p.paid_on);
  const nextDue = unpaid.sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null;
  const payAsYouGo =
    client.payment_schedule === "pay_as_you_go"
      ? payAsYouGoStatus(allSessions[0]?.payment_status)
      : null;

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
    recentOccurrenceStatuses: occurrences
      .filter((o) => o.status !== "scheduled")
      .map((o) => o.status),
    daysSinceLastCheckinOrActivity,
    hasOverduePayment: unpaid.some((p) => p.due_date < today),
    consistencyPct,
    latestServiceCheckinSatisfaction: latestServiceCheckin?.satisfaction ?? null,
  });

  const boundAddNote = addClientNote.bind(null, client.id);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm font-medium text-gray">
          Notes{" "}
          <span className="font-normal text-gray/70">
            (running log — separate from per-session notes)
          </span>
        </p>
        <form action={boundAddNote} className="flex gap-2">
          <Textarea
            name="note"
            rows={2}
            placeholder="Anything worth remembering — injuries, preferences, progress..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="self-end">
            Add
          </Button>
        </form>
        {notes.length > 0 ? (
          <Collapsible label={`${notes.length} note${notes.length > 1 ? "s" : ""}`}>
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-2 rounded-lg bg-cream px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-ink">{n.note}</p>
                    <p className="mt-0.5 text-xs text-gray">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteClientNote(client.id, n.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray hover:text-pink"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Collapsible>
        ) : null}
      </Card>

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
                {nextSession.timeOfDay
                  ? formatSchedule(nextSession.dayOfWeek, nextSession.timeOfDay)
                  : `${DAY_NAMES[nextSession.dayOfWeek]}, ${nextSession.date}`}
                {nextSession.label ? ` · ${nextSession.label}` : ""}{" "}
                <Badge tone={nextSession.isOneOff ? "teal" : "gray"}>
                  {nextSession.isOneOff ? "One-off" : "Recurring"}
                </Badge>
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

      {payAsYouGo ? (
        <Card className={payAsYouGo.tone === "pink" ? "border-pink/40 bg-pink/5" : ""}>
          <p className="text-sm font-medium text-gray">Payment status</p>
          <p className="mt-1 flex items-center gap-2">
            <Badge tone={payAsYouGo.tone}>{payAsYouGo.label}</Badge>
            <span className="text-sm text-gray">
              Based on the most recent logged session — set it each time from
              Log Session.
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
  careProfiles,
  milestones,
}: {
  client: Client;
  intake: ClientIntake | null;
  careProfiles: CareProfile[];
  milestones: ClientMilestone[];
}) {
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
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Full name
            </label>
            <Input name="name" required defaultValue={client.name} />
          </div>
          <CareProfilePicker
            careProfiles={careProfiles}
            defaultValue={client.care_profile_id ?? undefined}
            required={false}
          />
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
              Timezone
            </label>
            <Select name="timezone" defaultValue={client.timezone ?? "America/Chicago"}>
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray">
              Session times shown to this client (schedule, reminder
              emails) convert to their timezone if it&apos;s not yours.
            </p>
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

          <Checkbox
            name="symptom_tracker_enabled"
            label="Enable the optional symptom tracker for this client"
            defaultChecked={client.symptom_tracker_enabled}
          />

          <Button type="submit">Save</Button>
        </form>
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray">Milestones</p>
        <MilestonesSection clientId={client.id} milestones={milestones} />
      </div>

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

      <Card className="space-y-2">
        <p className="font-medium text-ink">Export their data</p>
        <p className="text-sm text-gray">
          A full text export of everything tracked for {client.name} —
          worth pulling before archiving someone, or any time they ask
          for a copy of their own records.
        </p>
        <a
          href={`/api/coach/clients/${client.id}/export`}
          className="inline-block rounded-xl border border-grayLt bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-bg"
        >
          Download {client.name}&apos;s data
        </a>
      </Card>

      <Card className="space-y-2 border-pink/40">
        <p className="font-medium text-pink">Danger zone</p>
        <p className="text-sm text-gray">
          Archiving removes {client.name} from your active roster. Nothing
          is deleted — all their history stays intact, and you can restore
          them anytime from the archived list.
        </p>
        <form
          action={async () => {
            "use server";
            await archiveClient(client.id);
          }}
        >
          <Button type="submit" variant="danger">
            Archive this client
          </Button>
        </form>
      </Card>
    </div>
  );
}

function DocumentsTab({
  clientId,
  allDocuments,
  optionalDocuments,
  assignments,
  acks,
  minorConsent,
}: {
  clientId: string;
  allDocuments: LegalDocument[];
  optionalDocuments: LegalDocument[];
  assignments: ClientDocumentAssignment[];
  acks: ClientDocumentAcknowledgment[];
  minorConsent: ClientMinorConsent | null;
}) {
  const assignedDocIds = new Set(assignments.map((a) => a.document_id));
  const ackByDocumentAndVersion = new Map<string, ClientDocumentAcknowledgment>();
  for (const a of acks) {
    ackByDocumentAndVersion.set(`${a.document_id}:${a.document_version}`, a);
  }

  const minorConsentDoc = allDocuments.find((d) => d.key === "minor_consent");
  const minorConsentAssigned = minorConsentDoc
    ? assignedDocIds.has(minorConsentDoc.id)
    : false;
  const visibleDocuments = allDocuments.filter(
    (d) => d.key !== "minor_consent" && (d.assigned_to_all || assignedDocIds.has(d.id))
  );

  return (
    <div className="space-y-4">
      {minorConsentAssigned ? (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">Minor Consent &amp; Intake Addendum</p>
            {minorConsent?.signed_at ? (
              <Badge tone="green">signed {minorConsent.signed_at.slice(0, 10)}</Badge>
            ) : (
              <Badge tone="gold">not filled out yet</Badge>
            )}
          </div>
          {minorConsent?.signed_at ? (
            <p className="text-xs text-gray">
              Signed by {minorConsent.guardian_signature_name} on{" "}
              {minorConsent.signed_at.slice(0, 10)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {visibleDocuments.length === 0 ? (
        <EmptyState
          title="No documents yet"
          body="Documents assigned to this client — and whether they've read or signed them — will show up here."
        />
      ) : (
        visibleDocuments.map((doc) => {
          const ack = ackByDocumentAndVersion.get(`${doc.id}:${doc.version}`);
          return (
            <Card key={doc.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{doc.title}</p>
                {ack ? (
                  <Badge tone="green">
                    {ack.signed_name
                      ? `signed ${ack.acknowledged_at.slice(0, 10)}`
                      : `read ${ack.acknowledged_at.slice(0, 10)}`}
                  </Badge>
                ) : (
                  <Badge tone="gold">not reviewed yet</Badge>
                )}
              </div>
              <DocumentBody text={doc.body} />
              {ack?.signed_name ? (
                <p className="text-xs text-gray">
                  Signed by {ack.signed_name} on {ack.acknowledged_at.slice(0, 10)}
                </p>
              ) : null}
            </Card>
          );
        })
      )}

      {optionalDocuments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray">
            Assign additional documents
          </p>
          <Card className="space-y-4">
            <p className="text-sm text-gray">
              These only go to clients checked below — not everyone.
            </p>
            {optionalDocuments.map((doc) => {
              const isAssigned = assignedDocIds.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="space-y-2 border-t border-grayLt pt-3 first:border-0 first:pt-0"
                >
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await setClientDocumentAssignment(
                        clientId,
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

function ProgramTab({
  clientId,
  currentPhase,
  programDays,
  overrides,
  exerciseOptions,
  recentSessions,
}: {
  clientId: string;
  currentPhase: ClientPhaseHistory | null;
  programDays: ProgramDayWithExercisesRow[];
  overrides: ClientProgramOverride[];
  exerciseOptions: { id: string; name: string }[];
  recentSessions: TrainingSession[];
}) {
  const overrideByPdeId = new Map(overrides.map((o) => [o.program_day_exercise_id, o]));

  const sevenDaysAgo = toDateString(
    new Date(nowInBusinessTz().getTime() - 6 * 24 * 60 * 60 * 1000)
  );
  const completedDayLabels = new Set(
    recentSessions.filter((s) => s.date >= sevenDaysAgo).map((s) => s.day_label)
  );

  if (!currentPhase) {
    return (
      <EmptyState
        title="No active phase"
        body="This client isn't on a care profile with phase tracking yet, so there's no program to show here."
      />
    );
  }

  if (programDays.length === 0) {
    return (
      <EmptyState
        title="No program days set up"
        body={`No program has been built for ${phaseInfo(currentPhase.phase).name} on this client's track yet. Build it from Programs in the main nav -- that shared template applies to everyone on this care profile.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray">
        {phaseInfo(currentPhase.phase).name} — this client&apos;s program.
        Drag by the handle to reorder, or swap/change sets-reps/remove a
        movement — all of it only affects this client; the shared template
        everyone else on their track follows is unchanged.
      </p>
      {programDays.map((day) => {
        const ordered = day.program_day_exercises
          .slice()
          .sort(
            (a, b) =>
              (overrideByPdeId.get(a.id)?.position_override ?? a.position) -
              (overrideByPdeId.get(b.id)?.position_override ?? b.position)
          )
          .map((pde) => {
            const override = overrideByPdeId.get(pde.id);
            return {
              pdeId: pde.id,
              name: pde.exercises?.name ?? "(deleted exercise)",
              sets: pde.sets,
              reps: pde.reps,
              tempo: pde.tempo,
              substituteExerciseId: override?.substitute_exercise_id ?? null,
              setsOverride: override?.sets_override ?? null,
              repsOverride: override?.reps_override ?? null,
              tempoOverride: override?.tempo_override ?? null,
              removed: override?.removed ?? false,
            };
          });

        const dayLabel = `Day ${day.day_number}: ${day.day_label}`;
        const isCompleted = completedDayLabels.has(dayLabel);
        return (
          <Card key={day.id}>
            <p className="font-medium text-ink">
              {dayLabel}
              {isCompleted ? (
                <span className="text-teal" aria-label="Completed">
                  {" "}
                  ✓
                </span>
              ) : null}
            </p>
            <div className="mt-3">
              <ProgramDayEditor
                clientId={clientId}
                exercises={ordered}
                exerciseOptions={exerciseOptions}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

async function SessionsTab({
  clientId,
  sessions,
  supabase,
}: {
  clientId: string;
  sessions: TrainingSession[];
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const mediaPaths = [
    ...new Set(
      sessions.flatMap((s) => s.entries.map((e) => e.media_path).filter(Boolean))
    ),
  ] as string[];

  const mediaUrlByPath = new Map<string, string>();
  if (mediaPaths.length > 0) {
    await Promise.all(
      mediaPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from("form-checks")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) mediaUrlByPath.set(path, data.signedUrl);
      })
    );
  }

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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{s.day_label}</p>
                  {s.session_type && s.session_type !== "freestyle" ? (
                    <Badge tone="gray">
                      {SESSION_TYPE_LABEL[s.session_type]}
                    </Badge>
                  ) : null}
                  {s.logged_by === "client" ? (
                    <Badge tone="teal">logged by client</Badge>
                  ) : null}
                  {s.payment_status === "paid" ? (
                    <Badge tone="teal">paid</Badge>
                  ) : s.payment_status === "unpaid" ? (
                    <Badge tone="pink">not paid</Badge>
                  ) : s.payment_status === "waived" ? (
                    <Badge tone="gray">waived</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-gray">{s.date}</p>
              </div>
              {s.entries.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-gray">
                  {s.entries.map((e, i) => (
                    <li key={i}>
                      {e.exercise}
                      {e.sets || e.reps ? ` — ${e.sets}x${e.reps}` : ""}
                      {e.weight ? ` @ ${e.weight}` : ""}
                      {e.substitute_exercise_id ? " (swapped)" : ""}
                      {e.notes ? (
                        <span className="block text-xs text-gray/80">
                          {e.notes}
                        </span>
                      ) : null}
                      {e.media_path && mediaUrlByPath.has(e.media_path) ? (
                        <a
                          href={mediaUrlByPath.get(e.media_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-rose hover:underline"
                        >
                          View photo/video →
                        </a>
                      ) : null}
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
              {s.body_map && s.body_map.length > 0 ? (
                <Collapsible label="View body map" className="mt-2">
                  <BodyMapInput defaultValue={s.body_map} readOnly />
                </Collapsible>
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
              <form
                action={async () => {
                  "use server";
                  await coachCancelSession(clientId, occ.date, occ.scheduleId);
                }}
                className="mt-2"
              >
                <Button type="submit" variant="danger">
                  I&apos;m unavailable — cancel &amp; email them
                </Button>
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
                {(o.status === "cancelled" || o.status === "late_cancelled") &&
                o.cancelled_by
                  ? o.cancelled_by === "coach"
                    ? " (by you)"
                    : " (by client)"
                  : ""}
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

const WELLNESS_LEVEL_CLASS: Record<number, string> = {
  1: "border-teal bg-teal",
  2: "border-gold bg-gold",
  3: "border-pink bg-pink",
};

function HabitsTab({
  habits,
  habitLogs,
}: {
  habits: ClientHabit[];
  habitLogs: ClientHabitLog[];
}) {
  const now = nowInBusinessTz();
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    last7Days.push(toDateString(d));
  }

  const levelByHabitAndDate = new Map(
    habitLogs.map((l) => [`${l.habit_id}:${l.log_date}`, l.level])
  );

  return (
    <div>
      <p className="text-sm font-medium text-gray">Habits (last 7 days)</p>
      <p className="mt-1 text-xs text-gray">
        Client-set colors — <span className="text-teal">teal</span>,{" "}
        <span className="text-gold">gold</span>,{" "}
        <span className="text-pink">pink</span> — whatever level they
        assigned that day for that habit.
      </p>
      {habits.length === 0 ? (
        <EmptyState
          title="No habits tracked"
          body="This client hasn't set up any personal habit tracking yet — entirely optional on their end."
        />
      ) : (
        <Card className="mt-2 space-y-3">
          <div className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-x-1 gap-y-2 text-xs text-gray">
            <div />
            {last7Days.map((d) => (
              <div key={d} className="text-center">
                {d.slice(5)}
              </div>
            ))}
            {habits.map((h) => (
              <Fragment key={h.id}>
                <span className="truncate text-sm text-ink">{h.name}</span>
                {last7Days.map((d) => {
                  const level = levelByHabitAndDate.get(`${h.id}:${d}`);
                  return (
                    <div key={`${h.id}-${d}`} className="flex justify-center">
                      <span
                        className={`inline-block h-4 w-4 rounded-full border ${
                          level ? WELLNESS_LEVEL_CLASS[level] : "border-grayLt bg-white"
                        }`}
                      />
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SymptomsTab({ symptomLogs }: { symptomLogs: ClientSymptomLog[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray">
        Symptom log (shared with you)
      </p>
      <p className="mt-1 text-xs text-gray">
        Clients keep this mainly for their own doctor/PT visits — you only
        see an entry if they choose to share it.
      </p>
      {symptomLogs.length === 0 ? (
        <EmptyState
          title="Nothing shared yet"
          body="No shared symptom entries from this client."
        />
      ) : (
        <div className="mt-2 space-y-2">
          {symptomLogs.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {s.symptom}
                  {s.severity ? (
                    <span className="ml-2 text-sm text-gray">
                      severity {s.severity}/5
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-gray">{s.log_date}</p>
              </div>
              {s.notes ? (
                <p className="mt-1 text-sm text-ink">{s.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

async function NutritionTab({
  nutritionLogs,
  supabase,
}: {
  nutritionLogs: ClientNutritionLog[];
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const photoPaths = [
    ...new Set(nutritionLogs.map((n) => n.photo_path).filter(Boolean)),
  ] as string[];
  const photoUrlByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    await Promise.all(
      photoPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from("form-checks")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) photoUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray">Nutrition log</p>
      {nutritionLogs.length === 0 ? (
        <EmptyState
          title="No nutrition entries yet"
          body="This client hasn't logged any meals in their tracker yet."
        />
      ) : (
        <div className="mt-2 space-y-2">
          {nutritionLogs.map((n) => (
            <Card key={n.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {n.log_date}
                  {n.meal_label ? ` · ${n.meal_label}` : ""}
                </p>
              </div>
              {n.photo_path && photoUrlByPath.has(n.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrlByPath.get(n.photo_path)}
                  alt="Food photo"
                  className="mt-2 max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
              {n.description ? (
                <p className="mt-1 text-sm text-ink">{n.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray">
                {[
                  n.hunger_before ? `hunger ${n.hunger_before}/10` : null,
                  n.fullness_after ? `fullness ${n.fullness_after}/10` : null,
                  n.satisfaction ? `satisfaction ${n.satisfaction}/5` : null,
                  n.calories ? `${n.calories} cal` : null,
                  n.protein_g ? `${n.protein_g}g protein` : null,
                  n.carbs_g ? `${n.carbs_g}g carbs` : null,
                  n.fat_g ? `${n.fat_g}g fat` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {n.notes ? (
                <p className="mt-1 text-sm text-gray">{n.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestonesSection({
  clientId,
  milestones,
}: {
  clientId: string;
  milestones: ClientMilestone[];
}) {
  const boundAddMilestone = addMilestone.bind(null, clientId);
  const upcoming = milestones.filter((m) => !m.achieved_at);
  const achieved = milestones.filter((m) => m.achieved_at);

  return (
    <div className="space-y-6">
      <Card>
        <p className="mb-2 text-sm font-medium text-ink">Add a milestone</p>
        <form action={boundAddMilestone} className="space-y-3">
          <Input name="title" required placeholder="e.g. First pain-free squat" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray">
                Target date (optional)
              </label>
              <Input name="target_date" type="date" />
            </div>
          </div>
          <Textarea name="notes" rows={2} placeholder="Notes (optional)" />
          <Button type="submit" variant="secondary">
            Add milestone
          </Button>
        </form>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          To look forward to
        </p>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No milestones set"
            body="Give them something concrete to look forward to and celebrate hitting."
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{m.title}</p>
                    {m.target_date ? (
                      <p className="text-sm text-gray">Target: {m.target_date}</p>
                    ) : null}
                    {m.notes ? (
                      <p className="mt-1 text-sm text-gray">{m.notes}</p>
                    ) : null}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteMilestone(clientId, m.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray hover:text-pink"
                    >
                      Remove
                    </button>
                  </form>
                </div>
                <form
                  action={markMilestoneAchieved.bind(null, clientId, m.id)}
                  className="mt-3 flex gap-2 border-t border-grayLt pt-3"
                >
                  <Input
                    name="achieved_note"
                    placeholder="A note to send along with it (optional)"
                    className="flex-1"
                  />
                  <Button type="submit">🎉 Mark achieved</Button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>

      {achieved.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray">Celebrated 🎉</p>
          <div className="space-y-2">
            {achieved.map((m) => (
              <Card key={m.id} className="border-gold/40 bg-gold/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{m.title}</p>
                    <p className="text-sm text-gray">
                      Achieved{" "}
                      {m.achieved_at
                        ? new Date(m.achieved_at).toLocaleDateString()
                        : ""}
                    </p>
                    {m.achieved_note ? (
                      <p className="mt-1 text-sm text-ink">{m.achieved_note}</p>
                    ) : null}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await unmarkMilestoneAchieved(clientId, m.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray hover:text-ink"
                    >
                      Undo
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MeasurementsTab({
  clientId,
  measurements,
  serviceCheckins,
  progressPhotos,
  progressPhotoUrlByPath,
}: {
  clientId: string;
  measurements: Measurement[];
  serviceCheckins: ServiceCheckin[];
  progressPhotos: ClientProgressPhoto[];
  progressPhotoUrlByPath: Map<string, string>;
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

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray">Progress photos</p>
        {progressPhotos.length === 0 ? (
          <EmptyState
            title="No progress photos yet"
            body="Client-uploaded — they add these themselves from their own Progress page."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {progressPhotos.map((p) => (
              <div key={p.id} className="space-y-1">
                {progressPhotoUrlByPath.has(p.photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={progressPhotoUrlByPath.get(p.photo_path)}
                    alt={`Progress photo ${p.date}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="text-xs text-gray">
                  {p.date}
                  {p.angle ? ` · ${p.angle}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <div className="flex items-center gap-2">
                    {sc.testimonial_consent ? (
                      <Badge tone="teal">ok to quote</Badge>
                    ) : null}
                    {sc.satisfaction != null ? (
                      <Badge tone="gold">{sc.satisfaction}/5</Badge>
                    ) : null}
                  </div>
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
              {r.reschedule_from_date ? (
                <p className="text-xs font-medium text-rose">
                  Reschedule from {r.reschedule_from_date} →
                </p>
              ) : null}
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
