import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { respondToCounteredRequest, cancelMySession } from "@/app/client/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { hoursUntilOccurrence, LATE_CANCEL_NOTICE_HOURS } from "@/lib/cancellation";
import {
  Badge,
  Button,
  Card,
  Collapsible,
  EmptyState,
  Heart,
  PhaseBanner,
  ProgressRing,
} from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { getCurrentPhase, weekInPhase } from "@/lib/phase";
import { formatScheduleForClient, nextSessionForClient } from "@/lib/schedule";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type {
  BusinessSettings,
  ClientDocumentAcknowledgment,
  ClientDocumentAssignment,
  ClientMilestone,
  ClientMinorConsent,
  ClientSchedule,
  LegalDocument,
  Payment,
  SessionOccurrence,
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

  const today = toDateString(nowInBusinessTz());
  const weekStartDate = new Date(`${today}T00:00:00Z`);
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - weekStartDate.getUTCDay());
  const weekStart = toDateString(weekStartDate);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const weekEnd = toDateString(weekEndDate);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [
    { data: sessions },
    { data: requests },
    currentPhase,
    { data: schedules },
    { data: occurrences },
    { data: payments },
    { data: documents },
    { data: acks },
    { count: weeklySessionsCount },
    { count: coachedSessionsMonthCount },
    { data: todaysNutrition },
  ] = await Promise.all([
    supabase
      .from("sessions")
      // coach_notes is deliberately excluded -- coach's-eyes-only.
      .select(
        "id, client_id, day_label, date, entries, rating, day_notes, logged_by, session_type, body_map, payment_status, coached, created_at"
      )
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(5) as unknown as Promise<{ data: TrainingSession[] | null }>,
    supabase
      .from("requests")
      .select("*")
      .eq("client_id", me.id)
      .in("status", ["pending", "countered"]) as unknown as Promise<{
      data: SessionRequest[] | null;
    }>,
    getCurrentPhase(supabase, me.id),
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
    supabase
      .from("session_occurrences")
      .select("*")
      .eq("client_id", me.id) as unknown as Promise<{ data: SessionOccurrence[] | null }>,
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
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", me.id)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", me.id)
      .eq("coached", true)
      .gte("date", monthStart),
    supabase
      .from("client_nutrition_logs")
      .select("id")
      .eq("client_id", me.id)
      .eq("log_date", today) as unknown as Promise<{ data: { id: string }[] | null }>,
  ]);

  const { data: businessSettings } = (await supabase
    .from("business_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()) as { data: BusinessSettings | null };

  const [{ data: docAssignments }, { data: minorConsent }, { data: programDayRows }] =
    await Promise.all([
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
      me.care_profile_id && currentPhase
        ? (supabase
            .from("program_days")
            .select("day_number")
            .eq("care_profile_id", me.care_profile_id)
            .eq("phase", currentPhase.phase) as unknown as Promise<{
            data: { day_number: number }[] | null;
          }>)
        : Promise.resolve({ data: null }),
    ]);

  const nextSession = nextSessionForClient(schedules ?? [], occurrences ?? []);
  const nextSessionHours =
    nextSession?.timeOfDay
      ? hoursUntilOccurrence(nextSession.date, nextSession.timeOfDay)
      : null;
  const nextSessionWouldBeLate =
    nextSessionHours !== null && nextSessionHours < LATE_CANCEL_NOTICE_HOURS;
  const nextDue = payments?.[0] ?? null;
  const hasUnpaidLateFee = (payments ?? []).some(
    (p) => p.kind === "late_cancellation_fee"
  );
  // Late cancellation fees get their own dedicated "sessions paused" card
  // below regardless of due date, so they're excluded here to avoid
  // saying the same thing twice.
  const overduePayment =
    nextDue && nextDue.kind !== "late_cancellation_fee" && nextDue.due_date < today
      ? nextDue
      : null;

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

  const { data: milestones } = (await supabase
    .from("client_milestones")
    .select("*")
    .eq("client_id", me.id)) as { data: ClientMilestone[] | null };

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentlyAchieved = (milestones ?? [])
    .filter((m) => m.achieved_at && new Date(m.achieved_at) >= fourteenDaysAgo)
    .sort((a, b) => (b.achieved_at ?? "").localeCompare(a.achieved_at ?? ""));

  // Three goal rings, each specific to this client rather than a shared
  // default:
  // - Programmed Days: how many distinct days their actual program (this
  //   phase) calls for per week, filled by any session logged this week.
  //   Falls back to their days-per-week only if they have no program
  //   assigned at all (e.g. a fully custom/virtual client).
  // - Sessions with Mickey: coached sessions specifically (not solo-logged
  //   ones), goal on the same days-per-week x 4 monthly convention the
  //   coach's own consistency scoring already uses.
  // - Nutrition: a flat 3-meals-a-day target regardless of calorie
  //   tracking -- logging more than that (snacks) overflows into a second,
  //   overlapping ring instead of just capping at full.
  const programmedDaysGoal =
    programDayRows && programDayRows.length > 0
      ? new Set(programDayRows.map((d) => d.day_number)).size
      : me.days_per_week ?? 3;
  const programmedDaysLogged = weeklySessionsCount ?? 0;

  const coachedSessionGoal = (me.days_per_week ?? 3) * 4;
  const coachedSessionsLogged = coachedSessionsMonthCount ?? 0;

  const NUTRITION_GOAL = 3;
  const nutritionCount = (todaysNutrition ?? []).length;
  const nutritionOverflow = Math.max(0, nutritionCount - NUTRITION_GOAL);
  const nutritionRing = {
    percent: (Math.min(nutritionCount, NUTRITION_GOAL) / NUTRITION_GOAL) * 100,
    overflowPercent:
      nutritionOverflow > 0
        ? (Math.min(nutritionOverflow, NUTRITION_GOAL) / NUTRITION_GOAL) * 100
        : undefined,
    label: `${nutritionCount}/${NUTRITION_GOAL}`,
    sublabel:
      nutritionOverflow > 0
        ? `+${nutritionOverflow} snack${nutritionOverflow > 1 ? "s" : ""} today`
        : "meals today",
  };

  const weekCycleLine = currentPhase
    ? `Week ${weekInPhase(currentPhase.started_on)} of this phase · Cycle ${currentPhase.cycle_number}`
    : undefined;

  return (
    <div className="space-y-6">
      <Link href="/client/profile">
        <PhaseBanner
          phase={currentPhase?.phase ?? "n/a"}
          title={`Hey, ${me.name.split(" ")[0]}`}
          subtitle={weekCycleLine}
        />
      </Link>

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

      {unacknowledgedCount > 0 || overduePayment ? (
        <Card className="space-y-3 border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            Needs your review
          </p>
          {unacknowledgedCount > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">
                {unacknowledgedCount} document
                {unacknowledgedCount > 1 ? "s" : ""} to review
              </p>
              <Link
                href="/client/documents"
                className="text-sm font-medium text-rose hover:underline"
              >
                Review →
              </Link>
            </div>
          ) : null}
          {overduePayment ? (
            <div
              className={
                unacknowledgedCount > 0 ? "space-y-2 border-t border-gold/30 pt-3" : "space-y-2"
              }
            >
              <p className="text-sm text-ink">
                <strong>${Number(overduePayment.amount).toFixed(2)} overdue</strong>{" "}
                since {overduePayment.due_date} — training is on hold until
                it&apos;s paid.
              </p>
              <PaymentMethods settings={businessSettings} />
            </div>
          ) : null}
        </Card>
      ) : null}

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
      ) : nextSession ? (
        <Card>
          <p className="text-sm font-medium text-gray">Next session</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {nextSession.timeOfDay
              ? formatScheduleForClient(nextSession.date, nextSession.timeOfDay, me.timezone)
              : nextSession.date}
            {nextSession.label ? ` · ${nextSession.label}` : ""}
          </p>
          {nextSession.isVideoSession ? (
            businessSettings?.google_meet_link ? (
              <a
                href={businessSettings.google_meet_link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Join video call →
              </a>
            ) : (
              <p className="mt-1 text-sm text-gray">
                This is a video session — Mickey will share the call link.
              </p>
            )
          ) : null}

          {nextSessionWouldBeLate ? (
            <p className="mt-2 text-xs text-pink">
              Cancelling now is under {LATE_CANCEL_NOTICE_HOURS} hours notice
              — this will count as a late cancellation.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form
              action={async () => {
                "use server";
                await cancelMySession(
                  nextSession.scheduleId,
                  nextSession.date,
                  nextSession.timeOfDay
                );
              }}
            >
              <ConfirmButton
                variant="danger"
                confirmText={
                  nextSessionWouldBeLate
                    ? `Cancelling now is under ${LATE_CANCEL_NOTICE_HOURS} hours notice and will count as a late cancellation. Cancel anyway?`
                    : "Cancel this session? This can't be undone."
                }
              >
                Cancel
              </ConfirmButton>
            </form>
            <Link href={`/client/request?reschedule_from=${nextSession.date}`}>
              <Button type="button" variant="secondary">
                Request reschedule
              </Button>
            </Link>
            <Link
              href="/client/schedule"
              className="text-sm text-rose hover:underline"
            >
              View your schedule →
            </Link>
          </div>
        </Card>
      ) : me.session_mode === "virtual" ? (
        <Card>
          <p className="text-sm font-medium text-gray">Program</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {me.program_last_updated_at
              ? `Last updated ${me.program_last_updated_at.slice(0, 10)}`
              : "Not updated yet"}
          </p>
          <p className="mt-1 text-sm text-gray">
            No session booked right now — Mickey updates your program
            directly on her own cadence.
            {me.video_sessions_enabled
              ? " Want a video session or a check-in call? Book one above."
              : " Need dedicated time to talk something through? Book a check-in call above."}
          </p>
          <Link
            href="/client/program"
            className="mt-2 inline-block text-sm text-rose hover:underline"
          >
            View your program →
          </Link>
        </Card>
      ) : null}

      {nextDue && nextDue.kind !== "late_cancellation_fee" && nextDue.due_date >= today ? (
        <Card>
          <p className="text-sm font-medium text-gray">Payment due</p>
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
        <p className="mb-3 text-sm font-medium text-gray">Your goals</p>
        <div className="flex items-center justify-around">
          <ProgressRing
            percent={(programmedDaysLogged / programmedDaysGoal) * 100}
            label={`${programmedDaysLogged}/${programmedDaysGoal}`}
            sublabel="Programmed Days"
            color="#E75480"
          />
          <ProgressRing
            percent={nutritionRing.percent}
            overflowPercent={nutritionRing.overflowPercent}
            label={nutritionRing.label}
            sublabel={nutritionRing.sublabel}
            color="#2FA6A6"
          />
          <ProgressRing
            percent={(coachedSessionsLogged / coachedSessionGoal) * 100}
            label={`${coachedSessionsLogged}/${coachedSessionGoal}`}
            sublabel="Sessions with Mickey"
            color="#D4A24C"
          />
        </div>
      </Card>

      {(requests?.length ?? 0) > 0 ? (
        <Card>
          <p className="text-sm font-medium text-gray">
            <Heart className="mr-1" />
            Pending requests
          </p>
          <div className="mt-2 space-y-3">
            {requests!.map((r) =>
              r.status === "countered" ? (
                <div key={r.id} className="rounded-xl bg-purple/10 p-3">
                  <p className="text-sm text-ink">
                    Mickey proposed a different time:{" "}
                    <strong>
                      {r.countered_date}
                      {r.countered_time ? ` at ${r.countered_time}` : ""}
                    </strong>{" "}
                    <span className="text-gray">
                      (you asked for {r.preferred_date}
                      {r.preferred_time ? ` at ${r.preferred_time}` : ""})
                    </span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await respondToCounteredRequest(r.id, "accept");
                      }}
                    >
                      <Button type="submit">Works for me</Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await respondToCounteredRequest(r.id, "decline");
                      }}
                    >
                      <Button type="submit" variant="secondary">
                        Doesn&apos;t work
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="flex items-center justify-between">
                  <p className="text-sm text-ink">
                    {r.request_type === "checkin_call" ? "Check-in call — " : ""}
                    {r.preferred_date}
                    {r.preferred_time ? ` at ${r.preferred_time}` : ""}
                  </p>
                  <Badge tone="gold">pending</Badge>
                </div>
              )
            )}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          href="/client/program"
          label="My program"
          description="This week's exercises & cues"
        />
        <ActionTile
          href="/client/schedule"
          label="My schedule"
          description="View & manage your sessions"
        />
        <ActionTile
          href="/client/nutrition"
          label="Nutrition"
          description={
            me.calorie_goal_enabled && me.daily_calorie_goal
              ? `Goal: ${me.daily_calorie_goal} cal/day`
              : "Log meals, hunger & fullness"
          }
        />
        <ActionTile href="/client/habits" label="Habits" description="Track your daily habits" />
        <ActionTile
          href="/client/progress"
          label="My progress"
          description="Photos, measurements & trends"
        />
        <ActionTile
          href="/client/community"
          label="Community"
          description="See what the group's up to"
        />
      </div>

      <Collapsible label="More" labelClassName="text-sm font-medium text-gray">
        <div className="rounded-xl border border-grayLt bg-white px-4">
          <MoreLink href="/client/checkin" label="Log a daily check-in" />
          {me.symptom_tracker_enabled ? (
            <MoreLink href="/client/symptoms" label="Symptom log" />
          ) : null}
          <MoreLink href="/client/milestones" label="Milestones" />
          <MoreLink href="/client/guide" label="Wellness guide" />
          <MoreLink
            href="/client/documents"
            label="Documents"
            badge={unacknowledgedCount > 0 ? `${unacknowledgedCount} new` : undefined}
          />
          <MoreLink href="/client/plan" label="Payment plan" />
          <MoreLink href="/client/checkin-call" label="Book a check-in call" />
          {me.video_sessions_enabled ? (
            <MoreLink href="/client/video-session" label="Book a video session" />
          ) : null}
        </div>
      </Collapsible>

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

      {me.pro_bono ? (
        <p className="pt-2 text-center text-xs text-gray">
          <Link href="/client/tip" className="hover:text-ink hover:underline">
            Want to support the work?
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function ActionTile({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-0.5 rounded-xl border border-grayLt bg-white px-4 py-3 shadow-sm transition hover:border-rose/40"
    >
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="text-xs text-gray">{description}</span>
    </Link>
  );
}

function MoreLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-grayLt/50 py-2.5 text-sm text-ink last:border-0 hover:text-rose"
    >
      <span>{label}</span>
      <span className="flex items-center gap-2 text-gray">
        {badge ? <Badge tone="gold">{badge}</Badge> : null}
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
