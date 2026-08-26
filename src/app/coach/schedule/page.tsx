import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { coachCancelSession } from "@/app/coach/actions";
import { ScheduleGrid, type RequestChip } from "./ScheduleGrid";
import { Badge, Button, Card, EmptyState, Heart } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type {
  ClientSchedule,
  CoachAvailability,
  CoachBlockedDate,
  SessionOccurrence,
  SessionRequest,
} from "@/lib/types";

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEK_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  late_cancelled: "Late cancelled",
  rescheduled: "Rescheduled",
};

const MONTH_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type ScheduleRow = ClientSchedule & { clients: { id: string; name: string } | null };

interface DaySession {
  clientId: string;
  clientName: string;
  timeOfDay: string | null;
  label: string | null;
}

export default async function CoachSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string; week?: string }>;
}) {
  const supabase = await createClient();
  const { month: monthParam, date: dateParam, week: weekParam } = await searchParams;

  const now = nowInBusinessTz();
  const todayStr = toDateString(now);

  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();
  const firstDateStr = toDateString(firstOfMonth);
  const lastDateStr = toDateString(new Date(Date.UTC(year, month, daysInMonth)));

  let weekStart: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    weekStart = new Date(`${weekParam}T00:00:00Z`);
  } else {
    weekStart = new Date(`${todayStr}T00:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  }
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = toDateString(d);
    return {
      date: dateStr,
      dayOfWeek: d.getUTCDay(),
      label: `${WEEKDAY_SHORT[d.getUTCDay()]} ${WEEK_LABEL_FMT.format(d)}`,
    };
  });
  const weekStartStr = weekDays[0].date;
  const weekEndStr = weekDays[6].date;
  const prevWeekDate = new Date(weekStart);
  prevWeekDate.setUTCDate(prevWeekDate.getUTCDate() - 7);
  const nextWeekDate = new Date(weekStart);
  nextWeekDate.setUTCDate(nextWeekDate.getUTCDate() + 7);
  const weekLabel = `${WEEK_LABEL_FMT.format(weekStart)} – ${WEEK_LABEL_FMT.format(
    new Date(`${weekEndStr}T00:00:00Z`)
  )}`;

  const [
    { data: schedules },
    { data: monthOccurrences },
    { data: allClients },
    { data: availability },
    { data: weekBlocks },
    { data: weekOccurrences },
    { data: openRequests },
  ] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("*, clients(id, name)")
      .eq("active", true) as unknown as Promise<{ data: ScheduleRow[] | null }>,
    supabase
      .from("session_occurrences")
      .select("*")
      .gte("occurrence_date", firstDateStr)
      .lte("occurrence_date", lastDateStr) as unknown as Promise<{
      data: SessionOccurrence[] | null;
    }>,
    supabase.from("clients").select("id, name") as unknown as Promise<{
      data: { id: string; name: string }[] | null;
    }>,
    supabase.from("coach_availability").select("*") as unknown as Promise<{
      data: CoachAvailability[] | null;
    }>,
    supabase
      .from("coach_blocked_dates")
      .select("*")
      .gte("blocked_date", weekStartStr)
      .lte("blocked_date", weekEndStr) as unknown as Promise<{
      data: CoachBlockedDate[] | null;
    }>,
    supabase
      .from("session_occurrences")
      .select("client_id, occurrence_date, notes, duration_minutes, status")
      .gte("occurrence_date", weekStartStr)
      .lte("occurrence_date", weekEndStr) as unknown as Promise<{
      data:
        | {
            client_id: string;
            occurrence_date: string;
            notes: string | null;
            duration_minutes: number;
            status: string;
          }[]
        | null;
    }>,
    supabase
      .from("requests")
      .select("*, clients(id, name)")
      .in("status", ["pending", "countered"]) as unknown as Promise<{
      data: (SessionRequest & { clients: { id: string; name: string } | null })[] | null;
    }>,
  ]);

  const clientNameById = new Map((allClients ?? []).map((c) => [c.id, c.name]));

  const activeSchedules = (schedules ?? []).filter((s) => s.clients);
  const scheduleByDayOfWeek = new Map<number, ScheduleRow[]>();
  for (const s of activeSchedules) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

  const weekOccByClientDate = new Map(
    (weekOccurrences ?? []).map((o) => [`${o.client_id}:${o.occurrence_date}`, o])
  );

  const weekBookings: {
    clientId: string;
    date: string;
    timeOfDay: string;
    clientName: string;
    durationMinutes: number;
  }[] = [];
  for (const day of weekDays) {
    for (const s of scheduleByDayOfWeek.get(day.dayOfWeek) ?? []) {
      // A recurring day only shows as booked if nothing's overridden that
      // specific date away from it -- any occurrence override for this
      // date (cancelled, rescheduled, or a "scheduled" one-off time from
      // a same-day reschedule) supersedes the recurring default, or it'd
      // render pink at both its old and new time. "Completed" doesn't
      // supersede it -- that's just a marker that the recurring slot as
      // scheduled actually happened.
      const override = weekOccByClientDate.get(`${s.client_id}:${day.date}`);
      if (override && override.status !== "completed") {
        continue;
      }
      weekBookings.push({
        clientId: s.client_id,
        date: day.date,
        timeOfDay: s.time_of_day,
        clientName: s.clients!.name,
        durationMinutes: s.duration_minutes,
      });
    }
  }
  for (const o of weekOccurrences ?? []) {
    if (o.status !== "scheduled") continue;
    const timeMatch = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    if (!timeMatch) continue;
    weekBookings.push({
      clientId: o.client_id,
      date: o.occurrence_date,
      timeOfDay: timeMatch[1],
      clientName: clientNameById.get(o.client_id) ?? "Client",
      durationMinutes: o.duration_minutes,
    });
  }

  const requestChips: RequestChip[] = (openRequests ?? []).map((r) => ({
    id: r.id,
    clientId: r.client_id,
    clientName: r.clients?.name ?? clientNameById.get(r.client_id) ?? "Client",
    date: r.status === "countered" ? r.countered_date : r.preferred_date,
    time: r.status === "countered" ? r.countered_time : r.preferred_time,
    durationMinutes: r.duration_minutes,
    status: r.status as "pending" | "countered",
  }));

  const occurrencesByDate = new Map<string, SessionOccurrence[]>();
  const occurrenceByClientDate = new Map<string, SessionOccurrence>();
  for (const o of monthOccurrences ?? []) {
    const list = occurrencesByDate.get(o.occurrence_date) ?? [];
    list.push(o);
    occurrencesByDate.set(o.occurrence_date, list);
    occurrenceByClientDate.set(`${o.client_id}:${o.occurrence_date}`, o);
  }

  // A date's sessions = whoever has a recurring weekly time matching that
  // weekday, plus anyone with a one-off session_occurrences row for that
  // exact date (e.g. a confirmed time request) who isn't already covered
  // by a recurring match.
  function sessionsForDate(dateStr: string, dayOfWeek: number): DaySession[] {
    const fromSchedule: DaySession[] = (scheduleByDayOfWeek.get(dayOfWeek) ?? []).map(
      (s) => ({
        clientId: s.client_id,
        clientName: s.clients?.name ?? clientNameById.get(s.client_id) ?? "Client",
        timeOfDay: s.time_of_day,
        label: s.label,
      })
    );
    const covered = new Set(fromSchedule.map((s) => s.clientId));
    const fromOccurrenceOnly: DaySession[] = (occurrencesByDate.get(dateStr) ?? [])
      .filter((o) => !covered.has(o.client_id) && o.status !== "rescheduled")
      .map((o) => ({
        clientId: o.client_id,
        clientName: clientNameById.get(o.client_id) ?? "Client",
        timeOfDay: null,
        label: o.notes,
      }));
    return [...fromSchedule, ...fromOccurrenceOnly];
  }

  const cells: { day: number; date: string; count: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = toDateString(date);
    cells.push({
      day,
      date: dateStr,
      count: sessionsForDate(dateStr, date.getUTCDay()).length,
    });
  }

  const selectedDate = dateParam ?? (monthKey === todayStr.slice(0, 7) ? todayStr : null);
  const selectedCell = cells.find((c) => c.date === selectedDate) ?? null;
  const selectedSessions = selectedCell
    ? sessionsForDate(
        selectedCell.date,
        new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()
      ).sort((a, b) => (a.timeOfDay ?? "99:99").localeCompare(b.timeOfDay ?? "99:99"))
    : [];

  const prevMonthDate = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const prevMonthKey = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonthKey = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Your schedule
      </h1>
      <p className="text-sm text-gray">
        Teal is available time, light pink is booked (with client initials),
        dark pink is blocked, and purple is a time request waiting on you.
      </p>

      {/* Breaks out of the page's centered max-w-3xl column -- that width
          cap is meant for comfortable text reading, but on a wide-enough
          screen (a phone in landscape, a tablet, a desktop) it leaves the
          calendar with unused margins on both sides instead of using the
          space it actually benefits from. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-2">
        <Card className="mx-auto max-w-5xl space-y-3">
          <p className="font-medium text-ink">This week</p>
          <ScheduleGrid
            weekDays={weekDays}
            availability={(availability ?? []).map((a) => ({
              dayOfWeek: a.day_of_week,
              startTime: a.start_time,
              endTime: a.end_time,
            }))}
            blocks={(weekBlocks ?? []).map((b) => ({
              date: b.blocked_date,
              startTime: b.start_time,
              endTime: b.end_time,
              reason: b.reason,
            }))}
            bookings={weekBookings}
            requests={requestChips}
            clients={[...(allClients ?? [])].sort((a, b) => a.name.localeCompare(b.name))}
            prevWeekHref={`/coach/schedule?week=${toDateString(prevWeekDate)}`}
            nextWeekHref={`/coach/schedule?week=${toDateString(nextWeekDate)}`}
            weekLabel={weekLabel}
            todayStr={todayStr}
          />
        </Card>
      </div>

      <p className="text-sm font-medium text-gray">Full month</p>

      <Card>
        <div className="flex items-center justify-between">
          <Link
            href={`/coach/schedule?month=${prevMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            ← Prev
          </Link>
          <p className="font-medium text-ink">
            {MONTH_LABEL_FMT.format(firstOfMonth)}
          </p>
          <Link
            href={`/coach/schedule?month=${nextMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            Next →
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-gray">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {cells.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === todayStr;
            return (
              <Link
                key={cell.date}
                href={`/coach/schedule?month=${monthKey}&date=${cell.date}`}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm ${
                  isSelected
                    ? "bg-rose text-white"
                    : isToday
                      ? "border border-rose text-ink"
                      : "text-ink hover:bg-bg"
                }`}
              >
                {cell.day}
                {cell.count > 0 ? (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-medium ${
                      isSelected ? "bg-white/25 text-white" : "bg-teal/15 text-teal"
                    }`}
                  >
                    {cell.count}
                  </span>
                ) : (
                  <span className="h-3.5" />
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      {!selectedCell || selectedSessions.length === 0 ? (
        <EmptyState
          title="No sessions that day"
          body="Tap a highlighted date on the calendar to see who's scheduled."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray">
            {DAY_NAMES[new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()]},{" "}
            {selectedCell.date}
          </p>
          {selectedSessions.map((s) => {
            const occurrence = occurrenceByClientDate.get(
              `${s.clientId}:${selectedCell.date}`
            );
            const status = occurrence?.status ?? "scheduled";
            const cancellable = status === "scheduled" && selectedCell.date >= todayStr;
            return (
              <Card key={s.clientId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/coach/clients/${s.clientId}`}
                      className="font-medium text-ink hover:text-rose"
                    >
                      {s.clientName}
                    </Link>
                    <p className="text-sm text-gray">
                      {s.timeOfDay ? formatTimeOfDay(s.timeOfDay) : s.label}
                      {s.timeOfDay && s.label ? ` · ${s.label}` : ""}
                    </p>
                  </div>
                  <Badge tone={status === "completed" ? "green" : status === "scheduled" ? "teal" : "pink"}>
                    {STATUS_LABEL[status] ?? "Scheduled"}
                    {(status === "cancelled" || status === "late_cancelled") &&
                    occurrence?.cancelled_by
                      ? occurrence.cancelled_by === "coach"
                        ? " (by you)"
                        : " (by client)"
                      : ""}
                  </Badge>
                </div>
                {cancellable ? (
                  <form
                    action={async () => {
                      "use server";
                      await coachCancelSession(s.clientId, selectedCell.date, null);
                    }}
                  >
                    <Button type="submit" variant="danger">
                      I&apos;m unavailable — cancel &amp; email them
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
