import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type { ClientSchedule, SessionOccurrence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
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

  const [{ data: schedules }, { data: monthOccurrences }] = await Promise.all([
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
  ]);

  const activeSchedules = (schedules ?? []).filter((s) => s.clients);
  const scheduleByDayOfWeek = new Map<number, ScheduleRow[]>();
  for (const s of activeSchedules) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

  const occurrenceByClientDate = new Map<string, SessionOccurrence>();
  for (const o of monthOccurrences ?? []) {
    occurrenceByClientDate.set(`${o.client_id}:${o.occurrence_date}`, o);
  }

  const cells: { day: number; date: string; count: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = toDateString(date);
    const daySchedules = scheduleByDayOfWeek.get(date.getUTCDay()) ?? [];
    cells.push({ day, date: dateStr, count: daySchedules.length });
  }

  const selectedDate = dateParam ?? (monthKey === todayStr.slice(0, 7) ? todayStr : null);
  const selectedCell = cells.find((c) => c.date === selectedDate) ?? null;
  const selectedSchedules = selectedCell
    ? (scheduleByDayOfWeek.get(new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()) ?? [])
        .slice()
        .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
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
        Every client&apos;s recurring weekly time, in one place. Manage an
        individual client&apos;s times from their own Schedule tab.
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

      {!selectedCell || selectedSchedules.length === 0 ? (
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
          {selectedSchedules.map((s) => {
            const occurrence = occurrenceByClientDate.get(
              `${s.client_id}:${selectedCell.date}`
            );
            return (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/coach/clients/${s.client_id}`}
                      className="font-medium text-ink hover:text-rose"
                    >
                      {s.clients?.name}
                    </Link>
                    <p className="text-sm text-gray">
                      {formatTimeOfDay(s.time_of_day)}
                      {s.label ? ` · ${s.label}` : ""}
                    </p>
                  </div>
                  {occurrence ? (
                    <Badge tone={occurrence.status === "completed" ? "green" : "gold"}>
                      {STATUS_LABEL[occurrence.status]}
                    </Badge>
                  ) : (
                    <Badge tone="teal">Scheduled</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
