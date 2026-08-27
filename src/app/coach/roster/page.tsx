import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { unarchiveClient } from "@/app/coach/actions";
import { Button, Card, Collapsible, EmptyState, Heart } from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { isFirstWeekOfMonth, loggedThisMonth } from "@/lib/measurement-window";
import { computeCancellationRisk, RISK_LEVEL_COLOR, RISK_LEVEL_LABEL } from "@/lib/risk";
import type { RiskLevel } from "@/lib/risk";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import { formatTimeOfDay } from "@/lib/schedule";
import { monthlyPaymentStatus, payAsYouGoStatus } from "@/lib/payment-status";
import type { Client, OccurrenceStatus } from "@/lib/types";

type ClientRow = Client & { care_profiles: { name: string } | null };

const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function shortDate(dateStr: string): string {
  return SHORT_DATE_FMT.format(new Date(`${dateStr}T00:00:00Z`));
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; sort?: string }>;
}) {
  const { archived: archivedParam, sort: sortParam } = await searchParams;
  const showArchived = archivedParam === "1";
  const sort: "name" | "risk_asc" | "risk_desc" =
    sortParam === "risk_asc" || sortParam === "risk_desc" ? sortParam : "name";

  const supabase = await createClient();

  let clientsQuery = supabase
    .from("clients")
    .select("*, care_profiles(name)")
    .order("name");
  clientsQuery = showArchived
    ? clientsQuery.not("archived_at", "is", null)
    : clientsQuery.is("archived_at", null);
  const { data: clients } = (await clientsQuery) as unknown as {
    data: ClientRow[] | null;
  };

  const clientIds = (clients ?? []).map((c) => c.id);

  const [
    { data: pendingRequests },
    { data: clientProfileRows },
    { data: phaseRows },
    { data: measurementRows },
    { data: serviceCheckinRows },
    { data: checkinRows },
    { data: activityRows },
    { data: paymentRows },
    { data: occurrenceRows },
    { data: sessionRows },
    { data: satisfactionRows },
    { data: documentAckRows },
    { data: minorConsentRows },
    { data: allLinkedClientRows },
    { data: upcomingMilestoneRows },
    { data: activeSchedules },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select("client_id, reschedule_from_date, request_type")
      .eq("status", "pending"),
    supabase.from("profiles").select("id").eq("role", "client"),
    clientIds.length > 0
      ? supabase
          .from("client_phase_history")
          .select("client_id, phase")
          .in("client_id", clientIds)
          .is("ended_on", null)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("measurements").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("service_checkins").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("checkins").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("activities").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("payments")
          .select("client_id, due_date, paid_on, kind")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("session_occurrences")
          .select("client_id, status, occurrence_date, created_at, notes")
          .in("client_id", clientIds)
          .order("occurrence_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("sessions")
          .select("client_id, date, payment_status, logged_by")
          .in("client_id", clientIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("service_checkins")
          .select("client_id, date, satisfaction")
          .in("client_id", clientIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("client_document_acknowledgments")
          .select("client_id, acknowledged_at")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("client_minor_consent")
          .select("client_id, signed_at")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    // Unfiltered by archived_at on purpose -- an archived client can still
    // have a linked login, and the "pending signup" count below needs to
    // know that regardless of which roster view (active/archived) is
    // currently showing, or it phantom-counts them as still unlinked.
    supabase.from("clients").select("user_id").not("user_id", "is", null),
    clientIds.length > 0
      ? supabase
          .from("client_milestones")
          .select("client_id, title, target_date")
          .in("client_id", clientIds)
          .is("achieved_at", null)
          .not("target_date", "is", null)
      : Promise.resolve({ data: [] }),
    supabase
      .from("client_schedules")
      .select("client_id, day_of_week, time_of_day")
      .eq("active", true) as unknown as Promise<{
      data: { client_id: string; day_of_week: number; time_of_day: string }[] | null;
    }>,
  ]);

  const pendingRequestsByClient = new Map<
    string,
    { total: number; reschedules: number; checkinCalls: number; videoSessions: number }
  >();
  for (const r of pendingRequests ?? []) {
    const cur = pendingRequestsByClient.get(r.client_id) ?? {
      total: 0,
      reschedules: 0,
      checkinCalls: 0,
      videoSessions: 0,
    };
    cur.total += 1;
    if (r.reschedule_from_date) cur.reschedules += 1;
    if (r.request_type === "checkin_call") cur.checkinCalls += 1;
    if (r.request_type === "video_session") cur.videoSessions += 1;
    pendingRequestsByClient.set(r.client_id, cur);
  }

  const phaseByClient = new Map<string, string>();
  for (const p of phaseRows ?? []) {
    phaseByClient.set(p.client_id, p.phase);
  }

  const datesByClient = (
    rows: { client_id: string; date: string }[] | null
  ) => {
    const map = new Map<string, string[]>();
    for (const row of rows ?? []) {
      map.set(row.client_id, [...(map.get(row.client_id) ?? []), row.date]);
    }
    return map;
  };
  const measurementDatesByClient = datesByClient(measurementRows);
  const serviceCheckinDatesByClient = datesByClient(serviceCheckinRows);

  const today = toDateString(new Date());

  // Upcoming milestones/birthdays -- both are "coming up soon" heads-up
  // flags rather than problems, so they're purely informational (teal).
  const MILESTONE_LOOKAHEAD_DAYS = 14;
  const BIRTHDAY_LOOKAHEAD_DAYS = 7;
  const daysBetween = (a: string, b: string) =>
    Math.round(
      (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const upcomingMilestoneByClient = new Map<
    string,
    { title: string; target_date: string }
  >();
  for (const m of upcomingMilestoneRows ?? []) {
    if (!m.target_date) continue;
    const daysUntil = daysBetween(today, m.target_date);
    if (daysUntil < 0 || daysUntil > MILESTONE_LOOKAHEAD_DAYS) continue;
    const existing = upcomingMilestoneByClient.get(m.client_id);
    if (!existing || m.target_date < existing.target_date) {
      upcomingMilestoneByClient.set(m.client_id, {
        title: m.title,
        target_date: m.target_date,
      });
    }
  }

  // Month/day only -- rolls to next year once this year's date has passed.
  function nextBirthdayDateStr(dob: string, todayStr: string): string {
    const [, month, day] = dob.split("-");
    const todayYear = Number(todayStr.slice(0, 4));
    const thisYear = `${todayYear}-${month}-${day}`;
    return thisYear >= todayStr ? thisYear : `${todayYear + 1}-${month}-${day}`;
  }
  const birthdayByClient = new Map<string, string>();
  for (const c of clients ?? []) {
    if (!c.date_of_birth) continue;
    const nextBirthday = nextBirthdayDateStr(c.date_of_birth, today);
    if (daysBetween(today, nextBirthday) <= BIRTHDAY_LOOKAHEAD_DAYS) {
      birthdayByClient.set(c.id, nextBirthday);
    }
  }

  const clientLoggedSessionDates = (sessionRows ?? []).filter(
    (r) => r.logged_by === "client"
  );
  const lastTrackedByClient = new Map<string, string>();
  for (const row of [
    ...(checkinRows ?? []),
    ...(activityRows ?? []),
    ...clientLoggedSessionDates,
  ]) {
    const prev = lastTrackedByClient.get(row.client_id);
    if (!prev || row.date > prev) lastTrackedByClient.set(row.client_id, row.date);
  }

  const overdueByClient = new Set(
    (paymentRows ?? [])
      .filter((p) => !p.paid_on && p.due_date < today)
      .map((p) => p.client_id)
  );

  const paymentsByClient = new Map<
    string,
    { due_date: string; paid_on: string | null }[]
  >();
  for (const p of paymentRows ?? []) {
    paymentsByClient.set(p.client_id, [
      ...(paymentsByClient.get(p.client_id) ?? []),
      { due_date: p.due_date, paid_on: p.paid_on },
    ]);
  }

  // sessionRows is ordered by date desc, so the first row seen per client
  // is their most recent session.
  const mostRecentPaymentStatusByClient = new Map<
    string,
    "paid" | "unpaid" | "waived" | null
  >();
  for (const row of sessionRows ?? []) {
    if (!mostRecentPaymentStatusByClient.has(row.client_id)) {
      mostRecentPaymentStatusByClient.set(row.client_id, row.payment_status ?? null);
    }
  }

  const occurrencesByClient = new Map<string, OccurrenceStatus[]>();
  for (const row of occurrenceRows ?? []) {
    if (row.status === "scheduled") continue;
    occurrencesByClient.set(row.client_id, [
      ...(occurrencesByClient.get(row.client_id) ?? []),
      row.status as OccurrenceStatus,
    ]);
  }

  // "Recent" flags (a cancellation, a signed document) fade off the board
  // on their own after a week instead of needing to be dismissed by hand.
  const recentWindowStart = toDateString(
    new Date(new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  const recentWindowEnd = toDateString(
    new Date(new Date(today).getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  // Value is {date, at}: `date` is the session's own date (for the flag's
  // text), `at` is when the cancellation was actually recorded (used to
  // tell whether the coach has viewed this client since it happened).
  const recentCancelledByClient = new Map<string, { date: string; at: string }>();
  const recentLateCancelledByClient = new Map<string, { date: string; at: string }>();
  for (const row of occurrenceRows ?? []) {
    if (row.occurrence_date < recentWindowStart || row.occurrence_date > recentWindowEnd) {
      continue;
    }
    if (row.status === "cancelled") {
      recentCancelledByClient.set(row.client_id, {
        date: row.occurrence_date,
        at: row.created_at,
      });
    } else if (row.status === "late_cancelled") {
      recentLateCancelledByClient.set(row.client_id, {
        date: row.occurrence_date,
        at: row.created_at,
      });
    }
  }

  const lateCancelFeeDueByClient = new Set(
    (paymentRows ?? [])
      .filter((p) => p.kind === "late_cancellation_fee" && !p.paid_on)
      .map((p) => p.client_id)
  );

  // Latest acknowledged/signed timestamp per client, within the window.
  const recentDocumentAtByClient = new Map<string, string>();
  for (const r of [
    ...(documentAckRows ?? []).map((r) => ({ client_id: r.client_id, at: r.acknowledged_at })),
    ...(minorConsentRows ?? [])
      .filter((r) => r.signed_at)
      .map((r) => ({ client_id: r.client_id, at: r.signed_at as string })),
  ]) {
    if (r.at.slice(0, 10) < recentWindowStart) continue;
    const prev = recentDocumentAtByClient.get(r.client_id);
    if (!prev || r.at > prev) recentDocumentAtByClient.set(r.client_id, r.at);
  }

  const sessionCountByClient = new Map<string, number>();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  for (const row of sessionRows ?? []) {
    if (new Date(row.date) >= fourWeeksAgo) {
      sessionCountByClient.set(
        row.client_id,
        (sessionCountByClient.get(row.client_id) ?? 0) + 1
      );
    }
  }

  const latestSatisfactionByClient = new Map<string, number | null>();
  for (const row of satisfactionRows ?? []) {
    if (!latestSatisfactionByClient.has(row.client_id)) {
      latestSatisfactionByClient.set(row.client_id, row.satisfaction ?? null);
    }
  }

  const linkedUserIds = new Set(
    (allLinkedClientRows ?? []).map((c) => c.user_id)
  );
  const pendingSignupCount = (clientProfileRows ?? []).filter(
    (p) => !linkedUserIds.has(p.id)
  ).length;

  // Test profiles are still full clients in every other respect -- they
  // just shouldn't skew aggregate numbers the coach uses to make decisions.
  const statsClients = (clients ?? []).filter((c) => !c.is_test);

  const inWindow = isFirstWeekOfMonth();
  const clientsNeedingWindow = statsClients.filter(
    (c) =>
      inWindow &&
      (!loggedThisMonth(measurementDatesByClient.get(c.id) ?? []) ||
        !loggedThisMonth(serviceCheckinDatesByClient.get(c.id) ?? []))
  ).length;

  // "Next booked session" widget -- scans the recurring weekly schedule
  // plus any one-off confirmed-time occurrences forward from right now,
  // using the same override rule the Schedule page itself uses (a
  // same-date occurrence row other than "completed" replaces the
  // recurring default rather than stacking with it).
  const nowBiz = nowInBusinessTz();
  const nowBizDateStr = toDateString(nowBiz);
  const nowBizTimeStr = nowBiz.toISOString().slice(11, 16);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const scheduleByDayOfWeek = new Map<
    number,
    { client_id: string; time_of_day: string }[]
  >();
  for (const s of activeSchedules ?? []) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }
  const occByClientDate = new Map(
    (occurrenceRows ?? []).map((o) => [`${o.client_id}:${o.occurrence_date}`, o])
  );

  type NextSession = { clientId: string; clientName: string; date: string; timeOfDay: string };
  let nextSession: NextSession | null = null;
  const NEXT_SESSION_LOOKAHEAD_DAYS = 21;
  outer: for (let i = 0; i < NEXT_SESSION_LOOKAHEAD_DAYS; i++) {
    const d = new Date(`${nowBizDateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = toDateString(d);
    const dayOfWeek = d.getUTCDay();

    const candidates: NextSession[] = [];
    for (const s of scheduleByDayOfWeek.get(dayOfWeek) ?? []) {
      const override = occByClientDate.get(`${s.client_id}:${dateStr}`);
      if (override && override.status !== "completed") continue;
      candidates.push({
        clientId: s.client_id,
        clientName: clientNameById.get(s.client_id) ?? "Client",
        date: dateStr,
        timeOfDay: s.time_of_day,
      });
    }
    for (const o of occurrenceRows ?? []) {
      if (o.occurrence_date !== dateStr || o.status !== "scheduled") continue;
      const match = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
      if (!match) continue;
      candidates.push({
        clientId: o.client_id,
        clientName: clientNameById.get(o.client_id) ?? "Client",
        date: dateStr,
        timeOfDay: match[1],
      });
    }

    const upcoming = candidates
      .filter((c) => dateStr > nowBizDateStr || c.timeOfDay >= nowBizTimeStr)
      .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
    if (upcoming.length > 0) {
      nextSession = upcoming[0];
      break outer;
    }
  }

  const riskByClient = new Map<string, { score: number; level: RiskLevel }>();
  for (const c of clients ?? []) {
    const lastTracked = lastTrackedByClient.get(c.id);
    const daysSince = lastTracked
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastTracked).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    const expectedCount = (c.days_per_week ?? 3) * 4;
    const consistencyPct =
      expectedCount > 0
        ? Math.min(
            100,
            Math.round(((sessionCountByClient.get(c.id) ?? 0) / expectedCount) * 100)
          )
        : null;
    const { score, level } = computeCancellationRisk({
      recentOccurrenceStatuses: occurrencesByClient.get(c.id) ?? [],
      daysSinceLastCheckinOrActivity: daysSince,
      hasOverduePayment: overdueByClient.has(c.id),
      consistencyPct,
      latestServiceCheckinSatisfaction: latestSatisfactionByClient.get(c.id) ?? null,
    });
    riskByClient.set(c.id, { score, level });
  }

  // Sorting happens after risk is computed, in JS, since the risk score
  // itself only exists once every signal it depends on has been fetched
  // and combined -- it isn't a column the DB query can order by directly.
  const sortedClients = [...(clients ?? [])];
  if (sort !== "name") {
    sortedClients.sort((a, b) => {
      const diff = (riskByClient.get(a.id)?.score ?? 0) - (riskByClient.get(b.id)?.score ?? 0);
      return sort === "risk_asc" ? diff : -diff;
    });
  }
  const inPersonClients = sortedClients.filter((c) => c.session_mode !== "virtual");
  const virtualClients = sortedClients.filter((c) => c.session_mode === "virtual");

  function renderClientCard(client: ClientRow) {
    const phase = phaseInfo(phaseByClient.get(client.id) ?? "n/a");
    const reqs = pendingRequestsByClient.get(client.id);
    const newRequests =
      (reqs?.total ?? 0) -
      (reqs?.reschedules ?? 0) -
      (reqs?.checkinCalls ?? 0) -
      (reqs?.videoSessions ?? 0);
    const measurementsDue =
      inWindow && !loggedThisMonth(measurementDatesByClient.get(client.id) ?? []);
    const checkinDue =
      inWindow && !loggedThisMonth(serviceCheckinDatesByClient.get(client.id) ?? []);
    const risk = riskByClient.get(client.id) ?? { score: 0, level: "low" as RiskLevel };
    const paymentStatus =
      client.payment_schedule === "pay_as_you_go"
        ? payAsYouGoStatus(mostRecentPaymentStatusByClient.get(client.id))
        : client.payment_schedule === "monthly"
          ? monthlyPaymentStatus(paymentsByClient.get(client.id) ?? [], today)
          : null;
    // Only a flag when money's actually owed -- "Paid up"/"Paid last
    // session"/"Waived" (tone teal or gray) aren't something she needs
    // surfaced on the board, just the pink (overdue/unpaid) and gold
    // (due soon) states.
    const owesPayment =
      !!paymentStatus && paymentStatus.tone !== "teal" && paymentStatus.tone !== "gray";

    // Purely informational events (a cancellation, a signed
    // document) only show up while the coach hasn't opened this
    // client's profile since they happened -- opening it counts
    // as "seen." Flags that still need an action from her (a
    // pending request, an unpaid fee, high risk) show regardless.
    const notYetSeen = (at: string) =>
      !client.last_viewed_at || client.last_viewed_at < at;

    type Flag = { label: string; tone: "negative" | "positive" };
    const flags: Flag[] = [];
    if (newRequests > 0) {
      flags.push({
        label: newRequests === 1 ? "Requested time" : `Requested time (${newRequests})`,
        tone: "positive",
      });
    }
    if ((reqs?.reschedules ?? 0) > 0) {
      flags.push({
        label:
          reqs!.reschedules === 1
            ? "Requested reschedule"
            : `Requested reschedule (${reqs!.reschedules})`,
        tone: "positive",
      });
    }
    if ((reqs?.checkinCalls ?? 0) > 0) {
      flags.push({
        label:
          reqs!.checkinCalls === 1
            ? "Check-in call requested"
            : `Check-in call requested (${reqs!.checkinCalls})`,
        tone: "positive",
      });
    }
    if ((reqs?.videoSessions ?? 0) > 0) {
      flags.push({
        label:
          reqs!.videoSessions === 1
            ? "Video session requested"
            : `Video session requested (${reqs!.videoSessions})`,
        tone: "positive",
      });
    }
    if (client.hold_started_at) flags.push({ label: "On hold", tone: "negative" });
    if (risk.level === "high") flags.push({ label: "High risk", tone: "negative" });
    if (owesPayment) flags.push({ label: paymentStatus!.label, tone: "negative" });
    if (lateCancelFeeDueByClient.has(client.id)) {
      flags.push({ label: "Late cancel fee due", tone: "negative" });
    }

    const lastTracked = lastTrackedByClient.get(client.id);
    const daysSinceActivity = lastTracked
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastTracked).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Math.floor(
          (new Date(today).getTime() - new Date(client.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
    const clientEstablished =
      new Date(today).getTime() - new Date(client.created_at).getTime() >
      3 * 24 * 60 * 60 * 1000;
    if (clientEstablished && daysSinceActivity > 3) {
      flags.push({ label: `Inactive ${daysSinceActivity}+ days`, tone: "negative" });
    }

    const lateCancel = recentLateCancelledByClient.get(client.id);
    if (lateCancel && notYetSeen(lateCancel.at)) {
      flags.push({
        label: `Late cancellation (${shortDate(lateCancel.date)})`,
        tone: "negative",
      });
    }
    const cancel = recentCancelledByClient.get(client.id);
    if (cancel && notYetSeen(cancel.at)) {
      flags.push({
        label: `Cancelled ${shortDate(cancel.date)} session`,
        tone: "negative",
      });
    }
    const documentAt = recentDocumentAtByClient.get(client.id);
    if (documentAt && notYetSeen(documentAt)) {
      flags.push({ label: "Completed document", tone: "positive" });
    }
    if (measurementsDue) flags.push({ label: "Measurements due", tone: "positive" });
    if (checkinDue) flags.push({ label: "Check-in due", tone: "positive" });

    const milestone = upcomingMilestoneByClient.get(client.id);
    if (milestone) {
      flags.push({
        label: `Milestone coming up: ${milestone.title} (${shortDate(milestone.target_date)})`,
        tone: "positive",
      });
    }
    const birthday = birthdayByClient.get(client.id);
    if (birthday) {
      flags.push({
        label: birthday === today ? "Birthday today!" : `Birthday ${shortDate(birthday)}`,
        tone: "positive",
      });
    }

    return (
      <Link key={client.id} href={`/coach/clients/${client.id}`}>
        <Card className="transition hover:border-rose/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: RISK_LEVEL_COLOR[risk.level] }}
                title={RISK_LEVEL_LABEL[risk.level]}
              />
              <div>
                <p className="font-medium text-ink">
                  {client.name}
                  {client.is_test ? (
                    <span className="ml-1.5 text-xs font-normal text-gray">
                      (test)
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-gray">
                  {client.care_profiles?.name ?? "No care profile set"}
                </p>
              </div>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: phase.color }}
            >
              {phase.name}
            </span>
          </div>
          {flags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {flags.map((f) => (
                <span
                  key={f.label}
                  className={`text-sm font-medium before:mr-1 before:content-['•'] ${
                    f.tone === "negative" ? "text-pink" : "text-teal"
                  }`}
                >
                  {f.label}
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            <Heart className="mr-1.5" />
            {showArchived ? "Archived clients" : "The Motherboard"}
          </h1>
          {!showArchived ? (
            <p className="mt-0.5 text-sm text-gray">
              Every client, every flag that needs you — one board.
            </p>
          ) : null}
        </div>
        {showArchived ? (
          <Link
            href="/coach/roster"
            className="text-sm text-gray hover:text-ink"
          >
            ← Back to Motherboard
          </Link>
        ) : (
          <Link
            href="/coach/roster/new"
            className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Add client
          </Link>
        )}
      </div>

      {!showArchived ? (
        <Link
          href="/coach/roster?archived=1"
          className="inline-block text-sm text-gray hover:text-ink"
        >
          View archived clients →
        </Link>
      ) : null}

      {!showArchived ? (
        nextSession ? (
          <Link
            href={`/coach/clients/${nextSession.clientId}/log-session?date=${nextSession.date}`}
          >
            <Card className="border-teal/30 bg-teal/5 transition hover:border-teal/60">
              <p className="text-sm font-medium text-gray">
                <Heart className="mr-1" />
                Next booked session
              </p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {nextSession.clientName}
              </p>
              <p className="mt-0.5 text-sm text-gray">
                {nextSession.date === today ? "Today" : shortDate(nextSession.date)} at{" "}
                {formatTimeOfDay(nextSession.timeOfDay)} · tap to log this session
              </p>
            </Card>
          </Link>
        ) : (
          <Card className="border-teal/30 bg-teal/5">
            <p className="text-sm font-medium text-gray">
              <Heart className="mr-1" />
              Next booked session
            </p>
            <p className="mt-1 text-sm text-gray">
              Nothing booked in the next {NEXT_SESSION_LOOKAHEAD_DAYS} days.
            </p>
          </Card>
        )
      ) : null}

      {pendingSignupCount > 0 ? (
        <Card className="border-rose/50 bg-rose/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {pendingSignupCount} new signup
              {pendingSignupCount > 1 ? "s" : ""} waiting to be linked to a
              client
            </p>
            <Link
              href="/coach/sign-ons"
              className="shrink-0 text-sm font-medium text-rose hover:opacity-80"
            >
              Review →
            </Link>
          </div>
        </Card>
      ) : null}

      {clientsNeedingWindow > 0 ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            It&apos;s the first week of the month — {clientsNeedingWindow}{" "}
            client{clientsNeedingWindow > 1 ? "s" : ""} still need
            {clientsNeedingWindow > 1 ? "" : "s"} this month&apos;s
            measurement or service check-in.
          </p>
        </Card>
      ) : null}

      {!showArchived && clients && clients.length > 0 ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray">Sort:</span>
          <Link
            href="/coach/roster"
            className={sort === "name" ? "font-medium text-rose" : "text-gray hover:text-ink"}
          >
            Name
          </Link>
          <Link
            href="/coach/roster?sort=risk_desc"
            className={
              sort === "risk_desc" ? "font-medium text-rose" : "text-gray hover:text-ink"
            }
          >
            Risk (high → low)
          </Link>
          <Link
            href="/coach/roster?sort=risk_asc"
            className={
              sort === "risk_asc" ? "font-medium text-rose" : "text-gray hover:text-ink"
            }
          >
            Risk (low → high)
          </Link>
        </div>
      ) : null}

      {!clients || clients.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived clients" : "No clients yet"}
          body={
            showArchived
              ? "Clients you archive show up here, with all their history intact."
              : "Add your first client to start building their program."
          }
        />
      ) : showArchived ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{client.name}</p>
                <p className="mt-0.5 text-sm text-gray">
                  {client.care_profiles?.name ?? "No care profile set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/coach/clients/${client.id}`}
                  className="text-sm text-gray hover:text-ink"
                >
                  View
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await unarchiveClient(client.id);
                  }}
                >
                  <Button type="submit" variant="secondary">
                    Restore
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Collapsible
            defaultOpen
            labelClassName="text-base font-semibold text-ink"
            label={`In-Person (${inPersonClients.length})`}
          >
            {inPersonClients.length === 0 ? (
              <p className="text-sm text-gray">No in-person clients right now.</p>
            ) : (
              <div className="space-y-3">{inPersonClients.map(renderClientCard)}</div>
            )}
          </Collapsible>
          <Collapsible
            defaultOpen
            labelClassName="text-base font-semibold text-ink"
            label={`Virtual (${virtualClients.length})`}
          >
            {virtualClients.length === 0 ? (
              <p className="text-sm text-gray">No virtual clients right now.</p>
            ) : (
              <div className="space-y-3">{virtualClients.map(renderClientCard)}</div>
            )}
          </Collapsible>
        </div>
      )}
    </div>
  );
}
