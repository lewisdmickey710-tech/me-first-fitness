import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart, PhaseBanner } from "@/components/ui";
import { getCurrentPhase, weekInPhase } from "@/lib/phase";
import { isFirstWeekOfMonth, loggedThisMonth } from "@/lib/measurement-window";
import { formatSchedule, nextSessionFromSchedules } from "@/lib/schedule";
import { toDateString } from "@/lib/timezone";
import type {
  CareProfile,
  ClientDocumentAcknowledgment,
  ClientSchedule,
  LegalDocument,
  Payment,
  SessionRequest,
  TrainingSession,
} from "@/lib/types";

export default async function ClientDashboard() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const supabase = await createClient();

  const [
    { data: sessions },
    { data: requests },
    { data: careProfile },
    currentPhase,
    { data: recentServiceCheckins },
    { data: schedules },
    { data: payments },
    { data: documents },
    { data: acks },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(5) as unknown as Promise<{ data: TrainingSession[] | null }>,
    supabase
      .from("requests")
      .select("*")
      .eq("client_id", me.id)
      .eq("status", "pending") as unknown as Promise<{
      data: SessionRequest[] | null;
    }>,
    me.care_profile_id
      ? (supabase
          .from("care_profiles")
          .select("*")
          .eq("id", me.care_profile_id)
          .single() as unknown as Promise<{ data: CareProfile | null }>)
      : Promise.resolve({ data: null }),
    getCurrentPhase(supabase, me.id),
    supabase
      .from("service_checkins")
      .select("date")
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(3) as unknown as Promise<{ data: { date: string }[] | null }>,
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", me.id)
      .is("paid_on", null)
      .order("due_date", { ascending: true }) as unknown as Promise<{
      data: Payment[] | null;
    }>,
    supabase.from("legal_documents").select("*") as unknown as Promise<{
      data: LegalDocument[] | null;
    }>,
    supabase
      .from("client_document_acknowledgments")
      .select("*")
      .eq("client_id", me.id) as unknown as Promise<{
      data: ClientDocumentAcknowledgment[] | null;
    }>,
  ]);

  const needsServiceCheckin =
    isFirstWeekOfMonth() &&
    !loggedThisMonth((recentServiceCheckins ?? []).map((r) => r.date));

  const nextSession = nextSessionFromSchedules(schedules ?? []);
  const nextDue = payments?.[0] ?? null;
  const today = toDateString(new Date());

  const ackedKeys = new Set(
    (acks ?? []).map((a) => `${a.document_id}:${a.document_version}`)
  );
  const unacknowledgedCount = (documents ?? []).filter(
    (d) => !ackedKeys.has(`${d.id}:${d.version}`)
  ).length;

  const { count: sessionsUsed } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", me.id);

  const allotted = me.sessions_allotted;

  return (
    <div className="space-y-6">
      <PhaseBanner
        phase={currentPhase?.phase ?? "n/a"}
        title={`Hey, ${me.name.split(" ")[0]}`}
        subtitle={careProfile?.name ?? undefined}
      />

      {currentPhase ? (
        <p className="-mt-3 text-sm text-gray">
          Week {weekInPhase(currentPhase.started_on)} of this phase · Cycle{" "}
          {currentPhase.cycle_number}
        </p>
      ) : null}

      {nextSession ? (
        <Card>
          <p className="text-sm font-medium text-gray">Next session</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatSchedule(nextSession.dayOfWeek, nextSession.timeOfDay)}
            {nextSession.label ? ` · ${nextSession.label}` : ""}
          </p>
        </Card>
      ) : null}

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
              {sessionsUsed ?? 0} / {allotted}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayLt">
              <div
                className="h-full rounded-full bg-rose"
                style={{
                  width: `${Math.min(
                    100,
                    ((sessionsUsed ?? 0) / allotted) * 100
                  )}%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {sessionsUsed ?? 0} logged
          </p>
        )}
      </Card>

      {needsServiceCheckin ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            Quick monthly check-in
          </p>
          <p className="mt-1 text-sm text-gray">
            It&apos;s that time of the month — how&apos;s it going overall?
          </p>
          <Link
            href="/client/service-checkin"
            className="mt-3 inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Do it now
          </Link>
        </Card>
      ) : null}

      {unacknowledgedCount > 0 ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            {unacknowledgedCount} document
            {unacknowledgedCount > 1 ? "s" : ""} need
            {unacknowledgedCount > 1 ? "" : "s"} your review
          </p>
          <Link
            href="/client/documents"
            className="mt-3 inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Review now
          </Link>
        </Card>
      ) : null}

      {(requests?.length ?? 0) > 0 ? (
        <Card>
          <p className="text-sm font-medium text-gray">
            <Heart className="mr-1" />
            Pending time requests
          </p>
          <div className="mt-2 space-y-2">
            {requests!.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <p className="text-sm text-ink">
                  {r.preferred_date}
                  {r.preferred_time ? ` at ${r.preferred_time}` : ""}
                </p>
                <Badge tone="gold">pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/client/program" label="My program" />
        <QuickAction href="/client/checkin" label="Log check-in" />
        <QuickAction href="/client/activity" label="Log activity" />
        <QuickAction href="/client/request" label="Request time" />
        <QuickAction href="/client/service-checkin" label="Service check-in" />
        <QuickAction href="/client/guide" label="Wellness guide" />
        <QuickAction href="/client/documents" label="Documents" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Recent sessions</p>
        {!sessions || sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            body="Once your coach logs a session, it'll show up here."
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{s.day_label}</p>
                  <p className="text-sm text-gray">{s.date}</p>
                </div>
                {s.rating ? (
                  <p className="mt-1 text-sm text-gray">
                    Rating: {s.rating}/5
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

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-grayLt bg-white px-2 py-4 text-center text-sm font-medium text-ink shadow-sm transition hover:border-rose/40"
    >
      <Heart className="text-base" />
      {label}
    </Link>
  );
}
