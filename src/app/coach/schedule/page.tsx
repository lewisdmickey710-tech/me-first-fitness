import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { coachCancelSession } from "@/app/coach/actions";
import { Badge, Button, Card, EmptyState, Heart } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type { ClientSchedule, SessionOccurrence } from "@/lib/types";

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
const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const supabase = await createClient();
  const { month: monthParam, date: dateParam } = await searchParams;

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

  const [{ data: schedules }, { data: monthOccurrences }, { data: allClients }] =
    await Promise.all([
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
    ]);

  const clientNameById = new Map((allClients ?? []).map((c) => [c.id, c.name]));

  const activeSchedules = (schedules ?? []).filter((s) => s.clients);
  const scheduleByDayOfWeek = new Map<number, ScheduleRow[]>();
  for (const s of activeSchedules) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

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
        Every client&apos;s recurring weekly time, plus any one-off
        confirmed requests, in one place. Manage an individual client&apos;s
        recurring times from their own Schedule tab.
      </p>

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
