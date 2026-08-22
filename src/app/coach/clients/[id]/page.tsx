import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { advancePhase, markPaymentPaid, setRequestStatus } from "@/app/coach/actions";
import {
  Badge,
  Button,
  Card,
  DeltaField,
  EmptyState,
  Heart,
  PhaseBanner,
  Sparkline,
} from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { weekInPhase } from "@/lib/phase";
import { nextWindowLabel } from "@/lib/measurement-window";
import { formatSchedule, nextSessionFromSchedules } from "@/lib/schedule";
import { toDateString } from "@/lib/timezone";
import type {
  Activity,
  CareProfile,
  Checkin,
  Client,
  ClientPhaseHistory,
  ClientSchedule,
  Measurement,
  Payment,
  ServiceCheckin,
  SessionRequest,
  TrainingSession,
} from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "checkins", label: "Check-ins" },
  { id: "measurements", label: "Measurements" },
  { id: "activity", label: "Activity" },
  { id: "requests", label: "Requests" },
  { id: "payments", label: "Payments" },
] as const;

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
        />
      )}
      {tab === "sessions" && (
        <SessionsTab clientId={id} sessions={sessions ?? []} />
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

  return (
    <div className="space-y-4">
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
