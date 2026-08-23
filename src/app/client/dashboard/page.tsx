import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart, PhaseBanner } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { getCurrentPhase, weekInPhase } from "@/lib/phase";
import { formatScheduleForClient, nextSessionFromSchedules } from "@/lib/schedule";
import { toDateString } from "@/lib/timezone";
import type {
  BusinessSettings,
  CareProfile,
  ClientDocumentAcknowledgment,
  ClientDocumentAssignment,
  ClientIntake,
  ClientMilestone,
  ClientMinorConsent,
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

  const { data: businessSettings } = (await supabase
    .from("business_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()) as { data: BusinessSettings | null };

  const [{ data: clientIntake }, { data: docAssignments }, { data: minorConsent }] =
    await Promise.all([
      supabase
        .from("client_intake")
        .select("*")
        .eq("client_id", me.id)
        .maybeSingle() as unknown as Promise<{ data: ClientIntake | null }>,
      supabase
        .from("client_document_assignments")
        .select("*")
        .eq("client_id", me.id) as unknown as Promise<{
        data: ClientDocumentAssignment[] | null;
      }>,
      supabase
        .from("client_minor_consent")
        .select("*")
        .eq("client_id", me.id)
        .maybeSingle() as unknown as Promise<{ data: ClientMinorConsent | null }>,
    ]);

  const nextSession = nextSessionFromSchedules(schedules ?? []);
  const nextDue = payments?.[0] ?? null;
  const hasUnpaidLateFee = (payments ?? []).some(
    (p) => p.kind === "late_cancellation_fee"
  );
  const today = toDateString(new Date());

  const assignedDocIds = new Set((docAssignments ?? []).map((a) => a.document_id));
  const ackedKeys = new Set(
    (acks ?? []).map((a) => `${a.document_id}:${a.document_version}`)
  );
  const visibleDocuments = (documents ?? []).filter(
    (d) =>
      d.key !== "minor_consent" && (d.assigned_to_all || assignedDocIds.has(d.id))
  );
  const minorConsentDoc = (documents ?? []).find((d) => d.key === "minor_consent");
  const minorConsentPending =
    !!minorConsentDoc &&
    assignedDocIds.has(minorConsentDoc.id) &&
    !minorConsent?.signed_at;
  const unacknowledgedCount =
    visibleDocuments.filter((d) => !ackedKeys.has(`${d.id}:${d.version}`)).length +
    (minorConsentPending ? 1 : 0);

  const { count: sessionsUsed } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", me.id);

  const { data: milestones } = (await supabase
    .from("client_milestones")
    .select("*")
    .eq("client_id", me.id)) as { data: ClientMilestone[] | null };

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentlyAchieved = (milestones ?? [])
    .filter((m) => m.achieved_at && new Date(m.achieved_at) >= fourteenDaysAgo)
    .sort((a, b) => (b.achieved_at ?? "").localeCompare(a.achieved_at ?? ""));

  const allotted = me.sessions_allotted;

  return (
    <div className="space-y-6">
      <PhaseBanner
        phase={currentPhase?.phase ?? "n/a"}
        title={`Hey, ${me.name.split(" ")[0]}`}
        subtitle={careProfile?.client_label ?? careProfile?.name ?? undefined}
      />

      <Link
        href="/client/profile"
        className="inline-block text-sm text-gray hover:text-ink"
      >
        Edit profile
      </Link>

      {currentPhase ? (
        <p className="-mt-3 text-sm text-gray">
          Week {weekInPhase(currentPhase.started_on)} of this phase · Cycle{" "}
          {currentPhase.cycle_number}
        </p>
      ) : null}

      {recentlyAchieved.length > 0 ? (
        <Card className="border-gold/40 bg-gold/5">
          <p className="font-medium text-ink">
            🎉 You hit {recentlyAchieved.length > 1 ? "milestones" : "a milestone"}!
          </p>
          <ul className="mt-1 text-sm text-ink">
            {recentlyAchieved.map((m) => (
              <li key={m.id}>{m.title}</li>
            ))}
          </ul>
          <Link
            href="/client/milestones"
            className="mt-2 inline-block text-sm text-rose hover:underline"
          >
            View your milestones →
          </Link>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/client/program" label="My program" />
        <QuickAction href="/client/schedule" label="My schedule" />
        <QuickAction href="/client/checkin" label="Log check-in" />
        <QuickAction href="/client/habits" label="Habits" />
        <QuickAction href="/client/nutrition" label="Nutrition" />
        {me.symptom_tracker_enabled ? (
          <QuickAction href="/client/symptoms" label="Symptom log" />
        ) : null}
        <QuickAction href="/client/progress" label="My progress" />
        <QuickAction href="/client/community" label="Community" />
        <QuickAction href="/client/milestones" label="Milestones" />
        <QuickAction href="/client/guide" label="Wellness guide" />
        <QuickAction href="/client/documents" label="Documents" />
        <QuickAction href="/client/plan" label="Payment plan" />
        <QuickAction href="/client/checkin-call" label="Book a check-in call" />
      </div>

      {me.hold_started_at ? (
        <Card className="space-y-1 border-gold/40 bg-gold/5">
          <p className="font-medium text-ink">Your spot is on hold</p>
          <p className="text-sm text-gray">
            You&apos;re not currently scheduled for sessions — the weekly
            $10 retainer keeps your app access and reserves your spot for
            whenever you&apos;re ready to come back. Reach out to Mickey
            when you want to resume.
          </p>
        </Card>
      ) : null}

      {hasUnpaidLateFee ? (
        <Card className="space-y-1 border-pink/40 bg-pink/5">
          <p className="font-medium text-pink">Sessions paused</p>
          <p className="text-sm text-ink">
            A late cancellation fee is outstanding — your upcoming sessions
            are paused until it&apos;s paid. Send it using one of the
            methods below, then your schedule picks back up right away.
          </p>
          <PaymentMethods settings={businessSettings} />
        </Card>
      ) : me.session_mode === "virtual_async" ? (
        <Card>
          <p className="text-sm font-medium text-gray">Program</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {me.program_last_updated_at
              ? `Last updated ${me.program_last_updated_at.slice(0, 10)}`
              : "Not updated yet"}
          </p>
          <p className="mt-1 text-sm text-gray">
            No standing session calls on this plan — Mickey updates your
            program directly on her own cadence. Need dedicated time to
            talk something through? Book a check-in call above.
          </p>
          <Link
            href="/client/program"
            className="mt-2 inline-block text-sm text-rose hover:underline"
          >
            View your program →
          </Link>
        </Card>
      ) : nextSession ? (
        <Card>
          <p className="text-sm font-medium text-gray">Next session</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatScheduleForClient(nextSession.date, nextSession.timeOfDay, me.timezone)}
            {nextSession.label ? ` · ${nextSession.label}` : ""}
          </p>
          <Link
            href="/client/schedule"
            className="mt-2 inline-block text-sm text-rose hover:underline"
          >
            View your schedule →
          </Link>
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
          <PaymentMethods settings={businessSettings} />
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


      {!clientIntake?.submitted_at ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            A little about you
          </p>
          <p className="mt-1 text-sm text-gray">
            A few things I&apos;d love to know — goals, health history, how
            you like to be coached. Nothing here is a test.
          </p>
          <Link
            href="/client/intake"
            className="mt-3 inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Fill it out
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              Your intake questionnaire
            </p>
            <Badge tone="green">submitted</Badge>
          </div>
          <Link
            href="/client/intake"
            className="mt-2 inline-block text-sm text-gray hover:text-ink"
          >
            Review or update your answers →
          </Link>
        </Card>
      )}

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
            Pending requests
          </p>
          <div className="mt-2 space-y-2">
            {requests!.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <p className="text-sm text-ink">
                  {r.request_type === "checkin_call" ? "Check-in call — " : ""}
                  {r.preferred_date}
                  {r.preferred_time ? ` at ${r.preferred_time}` : ""}
                </p>
                <Badge tone="gold">pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

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
