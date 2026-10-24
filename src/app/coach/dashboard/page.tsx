import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { NudgeButton } from "@/components/nudge-button";
import { formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { MONTHLY_CHECKIN_INACTIVITY_DAYS_THRESHOLD } from "@/lib/risk";
import type { Client } from "@/lib/types";

const INACTIVE_AFTER_DAYS = 3;
const SELF_LED_CHECKIN_WINDOW_DAYS = 30;
const UNLOGGED_LOOKBACK_DAYS = 14;
const APP_LAUNCH_DATE = "2026-08-24";

function timeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)
  );
}

interface ScheduleRow {
  client_id: string;
  day_of_week: number;
  time_of_day: string;
  duration_minutes: number;
  label: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const nowBiz = nowInBusinessTz();
  const today = toDateString(nowBiz);
  const todayOfWeek = nowBiz.getUTCDay();
  const nowMinutes = timeToMinutes(nowBiz.toISOString().slice(11, 16));
  const lookbackStart = toDateString(
    new Date(nowBiz.getTime() - (UNLOGGED_LOOKBACK_DAYS + 1) * 24 * 60 * 60 * 1000)
  );

  const [
    { data: clients },
    { data: schedules },
    { data: todayOccurrences },
    { data: recentSessions },
    { data: checkins },
    { data: activities },
    { data: overduePayments },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, user_id, session_mode, hold_started_at, self_led, self_led_last_checkin, monthly_checkin, created_at, pro_bono, is_test"
      )
      .is("archived_at", null) as unknown as Promise<{ data: Client[] | null }>,
    supabase
      .from("client_schedules")
      .select("client_id, day_of_week, time_of_day, duration_minutes, label")
      .eq("active", true) as unknown as Promise<{ data: ScheduleRow[] | null }>,
    supabase
      .from("session_occurrences")
      .select("client_id, occurrence_date, status, notes, is_video_session")
      .gte("occurrence_date", lookbackStart) as unknown as Promise<{
      data:
        | {
            client_id: string;
            occurrence_date: string;
            status: string;
            notes: string | null;
            is_video_session: boolean;
          }[]
        | null;
    }>,
    supabase
      .from("sessions")
      .select("client_id, date")
      .gte("date", lookbackStart) as unknown as Promise<{
      data: { client_id: string; date: string }[] | null;
    }>,
    supabase
      .from("checkins")
      .select("client_id, date")
      .gte("date", lookbackStart) as unknown as Promise<{
      data: { client_id: string; date: string }[] | null;
    }>,
    supabase
      .from("activities")
      .select("client_id, date")
      .gte("date", lookbackStart) as unknown as Promise<{
      data: { client_id: string; date: string }[] | null;
    }>,
    supabase
      .from("payments")
      .select("id, client_id, description, amount, due_date")
      .is("paid_on", null)
      .is("waived_on", null)
      .lt("due_date", today)
      .order("due_date") as unknown as Promise<{
      data:
        | { id: string; client_id: string; description: string; amount: number; due_date: string }[]
        | null;
    }>,
  ]);

  const clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  const heldClientIds = new Set(
    (clients ?? []).filter((c) => c.hold_started_at).map((c) => c.id)
  );
  const virtualClientIds = new Set(
    (clients ?? []).filter((c) => c.session_mode === "virtual").map((c) => c.id)
  );

  // ---------------- Payments overdue ----------------
  // Same definition the morning push notification counts -- test profiles
  // excluded so QA activity never shows up here, same as everywhere else
  // overdue/income totals are computed (see finances page).
  const overduePaymentsByClient = new Map<
    string,
    { id: string; description: string; amount: number; due_date: string }[]
  >();
  for (const p of overduePayments ?? []) {
    const client = clientById.get(p.client_id);
    if (!client || client.is_test) continue;
    const list = overduePaymentsByClient.get(p.client_id) ?? [];
    list.push(p);
    overduePaymentsByClient.set(p.client_id, list);
  }

  // Every occurrence override in the lookback window, keyed by client+date.
  const occByClientDate = new Map(
    (todayOccurrences ?? []).map((o) => [`${o.client_id}:${o.occurrence_date}`, o])
  );
  const loggedDates = new Set(
    (recentSessions ?? []).map((s) => `${s.client_id}:${s.date}`)
  );

  // ---------------- Today's sessions ----------------
  type TodaySession = {
    clientId: string;
    clientName: string;
    userId: string | null;
    timeOfDay: string | null;
    label: string | null;
    isHeld: boolean;
    isOneOff: boolean;
    isDone: boolean;
    isCancelled: boolean;
  };
  const todaysSessions: TodaySession[] = [];
  const clientsSeenToday = new Set<string>();

  for (const s of schedules ?? []) {
    if (s.day_of_week !== todayOfWeek) continue;
    if (virtualClientIds.has(s.client_id)) continue;
    const client = clientById.get(s.client_id);
    if (!client) continue;
    const override = occByClientDate.get(`${s.client_id}:${today}`);
    if (
      override &&
      (override.status === "cancelled" ||
        override.status === "late_cancelled" ||
        override.status === "rescheduled")
    ) {
      continue;
    }
    clientsSeenToday.add(s.client_id);
    todaysSessions.push({
      clientId: s.client_id,
      clientName: client.name,
      userId: client.user_id,
      timeOfDay: s.time_of_day,
      label: s.label,
      isHeld: heldClientIds.has(s.client_id),
      isOneOff: false,
      isDone: loggedDates.has(`${s.client_id}:${today}`),
      isCancelled: false,
    });
  }
  for (const o of todayOccurrences ?? []) {
    if (o.occurrence_date !== today || o.status !== "scheduled") continue;
    if (clientsSeenToday.has(o.client_id)) continue;
    const client = clientById.get(o.client_id);
    if (!client || virtualClientIds.has(o.client_id)) continue;
    const timeMatch = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    todaysSessions.push({
      clientId: o.client_id,
      clientName: client.name,
      userId: client.user_id,
      timeOfDay: timeMatch?.[1] ?? null,
      label: o.is_video_session ? "Video session" : null,
      isHeld: heldClientIds.has(o.client_id),
      isOneOff: true,
      isDone: loggedDates.has(`${o.client_id}:${today}`),
      isCancelled: false,
    });
  }
  todaysSessions.sort((a, b) => (a.timeOfDay ?? "99:99").localeCompare(b.timeOfDay ?? "99:99"));

  // ---------------- Sessions not logged (payments not logged) ----------------
  // Pro bono clients are always waived -- there's no payment to have missed
  // recording, so they never belong on this list even if the session
  // itself hasn't been logged yet.
  const proBonoClientIds = new Set(
    (clients ?? []).filter((c) => c.pro_bono).map((c) => c.id)
  );
  const scheduleByDayOfWeek = new Map<number, ScheduleRow[]>();
  for (const s of schedules ?? []) {
    if (
      virtualClientIds.has(s.client_id) ||
      heldClientIds.has(s.client_id) ||
      proBonoClientIds.has(s.client_id)
    ) {
      continue;
    }
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }
  const unloggedByClient = new Map<string, string[]>();
  for (let i = 0; i <= UNLOGGED_LOOKBACK_DAYS; i++) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = toDateString(d);
    if (dateStr < APP_LAUNCH_DATE) break;
    const dow = d.getUTCDay();
    for (const s of scheduleByDayOfWeek.get(dow) ?? []) {
      const override = occByClientDate.get(`${s.client_id}:${dateStr}`);
      if (override && override.status !== "scheduled") continue;
      const endMinutes = timeToMinutes(s.time_of_day) + s.duration_minutes + 60;
      const passed = dateStr < today || endMinutes <= nowMinutes;
      if (!passed) continue;
      if (loggedDates.has(`${s.client_id}:${dateStr}`)) continue;
      const list = unloggedByClient.get(s.client_id) ?? [];
      list.push(dateStr);
      unloggedByClient.set(s.client_id, list);
    }
  }

  // ---------------- Clients not logging (inactive) ----------------
  const lastTrackedByClient = new Map<string, string>();
  for (const rows of [checkins ?? [], activities ?? [], recentSessions ?? []]) {
    for (const r of rows) {
      const prev = lastTrackedByClient.get(r.client_id);
      if (!prev || r.date > prev) lastTrackedByClient.set(r.client_id, r.date);
    }
  }
  const notLoggingClients: { client: Client; daysSince: number; label: string }[] = [];
  for (const c of clients ?? []) {
    if (heldClientIds.has(c.id)) continue;
    const clientEstablished = daysBetween(today, c.created_at.slice(0, 10)) > 3;
    if (!clientEstablished) continue;
    if (c.self_led) {
      const lastCheckin = c.self_led_last_checkin ?? c.created_at.slice(0, 10);
      const daysSince = daysBetween(today, lastCheckin);
      if (daysSince >= SELF_LED_CHECKIN_WINDOW_DAYS) {
        notLoggingClients.push({ client: c, daysSince, label: "No self-led check-in" });
      }
      continue;
    }
    const lastTracked = lastTrackedByClient.get(c.id);
    const daysSince = lastTracked
      ? daysBetween(today, lastTracked)
      : daysBetween(today, c.created_at.slice(0, 10));
    const inactiveAfter = c.monthly_checkin
      ? MONTHLY_CHECKIN_INACTIVITY_DAYS_THRESHOLD
      : INACTIVE_AFTER_DAYS;
    if (daysSince > inactiveAfter) {
      notLoggingClients.push({ client: c, daysSince, label: "No activity logged" });
    }
  }
  notLoggingClients.sort((a, b) => b.daysSince - a.daysSince);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          The Motherboard
        </h1>
        <p className="mt-0.5 text-sm text-gray">
          Today&apos;s sessions and what needs your attention.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Today</p>
        {todaysSessions.length === 0 ? (
          <EmptyState title="Nothing on the books today" body="No sessions scheduled." />
        ) : (
          <div className="space-y-2">
            {todaysSessions.map((s, i) => (
              <Card
                key={`${s.clientId}-${i}`}
                className={`flex items-center justify-between ${
                  s.isHeld ? "opacity-50" : ""
                }`}
              >
                <div>
                  <Link
                    href={`/coach/clients/${s.clientId}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {s.clientName}
                  </Link>
                  <p className="text-sm text-gray">
                    {s.timeOfDay ? formatTimeOfDay(s.timeOfDay) : "Time TBD"}
                    {s.label ? ` · ${s.label}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.isHeld ? (
                    <Badge tone="gray">On hold</Badge>
                  ) : s.isDone ? (
                    <Badge tone="green">Logged</Badge>
                  ) : (
                    <>
                      {s.isOneOff ? <Badge tone="teal">One-off</Badge> : null}
                      <Link
                        href={`/coach/clients/${s.clientId}/log-session?date=${today}`}
                        className="text-sm font-medium text-rose hover:underline"
                      >
                        Log it →
                      </Link>
                    </>
                  )}
                  {s.isHeld ? null : <NudgeButton clientId={s.clientId} userId={s.userId} />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Payments overdue</p>
        {overduePaymentsByClient.size === 0 ? (
          <EmptyState title="Nothing overdue" body="No unpaid invoices past their due date." />
        ) : (
          <div className="space-y-2">
            {[...overduePaymentsByClient.entries()].map(([clientId, clientPayments]) => {
              const client = clientById.get(clientId);
              if (!client) return null;
              const total = clientPayments.reduce((sum, p) => sum + Number(p.amount), 0);
              const oldest = clientPayments.reduce(
                (earliest, p) => (p.due_date < earliest ? p.due_date : earliest),
                clientPayments[0].due_date
              );
              return (
                <Card
                  key={clientId}
                  className="flex items-center justify-between border-pink/40 bg-pink/5"
                >
                  <div>
                    <Link
                      href={`/coach/clients/${clientId}?tab=payments`}
                      className="font-medium text-ink hover:underline"
                    >
                      {client.name}
                    </Link>
                    <p className="text-sm text-gray">
                      {clientPayments.length === 1
                        ? `$${total.toFixed(2)} overdue since ${oldest}`
                        : `${clientPayments.length} payments, $${total.toFixed(2)} overdue — oldest since ${oldest}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/coach/clients/${clientId}?tab=payments`}
                      className="text-sm font-medium text-rose hover:underline"
                    >
                      Review →
                    </Link>
                    <NudgeButton clientId={clientId} userId={client.user_id} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Payments not logged
        </p>
        {unloggedByClient.size === 0 ? (
          <EmptyState title="All caught up" body="No unlogged sessions in the last two weeks." />
        ) : (
          <div className="space-y-2">
            {[...unloggedByClient.entries()].map(([clientId, dates]) => {
              const client = clientById.get(clientId);
              if (!client) return null;
              return (
                <Card key={clientId} className="flex items-center justify-between border-pink/40 bg-pink/5">
                  <div>
                    <Link
                      href={`/coach/clients/${clientId}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {client.name}
                    </Link>
                    <p className="text-sm text-gray">
                      {dates.length === 1
                        ? `${dates[0]} not logged`
                        : `${dates.length} sessions not logged`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/coach/clients/${clientId}/log-session?date=${dates[0]}`}
                      className="text-sm font-medium text-rose hover:underline"
                    >
                      Log it →
                    </Link>
                    <NudgeButton clientId={clientId} userId={client.user_id} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Clients not logging</p>
        {notLoggingClients.length === 0 ? (
          <EmptyState title="Everyone's checking in" body="No clients have gone quiet." />
        ) : (
          <div className="space-y-2">
            {notLoggingClients.map(({ client, daysSince, label }) => (
              <Card key={client.id} className="flex items-center justify-between border-gold/40 bg-gold/5">
                <div>
                  <Link
                    href={`/coach/clients/${client.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {client.name}
                  </Link>
                  <p className="text-sm text-gray">
                    {label} — {daysSince}+ days
                  </p>
                </div>
                <NudgeButton clientId={client.id} userId={client.user_id} />
              </Card>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/coach/roster"
        className="inline-block text-sm text-gray hover:text-ink"
      >
        View all clients →
      </Link>
    </div>
  );
}
