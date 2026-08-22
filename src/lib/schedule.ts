import { nowInBusinessTz } from "@/lib/timezone";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** "5:00 PM" from a "17:00:00" (or "17:00") time_of_day string. */
export function formatTimeOfDay(timeOfDay: string): string {
  const [hStr, mStr] = timeOfDay.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** "Tuesdays at 5:00 PM" */
export function formatSchedule(
  dayOfWeek: number,
  timeOfDay: string
): string {
  return `${DAY_NAMES[dayOfWeek]}s at ${formatTimeOfDay(timeOfDay)}`;
}

/**
 * The next date (business-tz "today" counts) on which `dayOfWeek` occurs,
 * as a YYYY-MM-DD string.
 */
export function nextOccurrenceDate(
  dayOfWeek: number,
  from: Date = nowInBusinessTz()
): string {
  const daysUntil = (dayOfWeek - from.getUTCDay() + 7) % 7;
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + daysUntil);
  return next.toISOString().slice(0, 10);
}

export interface NextSession {
  date: string;
  dayOfWeek: number;
  timeOfDay: string;
  label: string | null;
}

/** Picks the single soonest upcoming occurrence across a client's active schedules. */
export function nextSessionFromSchedules(
  schedules: { day_of_week: number; time_of_day: string; label: string | null; active: boolean }[]
): NextSession | null {
  const now = nowInBusinessTz();
  const candidates = schedules
    .filter((s) => s.active)
    .map((s) => ({
      date: nextOccurrenceDate(s.day_of_week, now),
      dayOfWeek: s.day_of_week,
      timeOfDay: s.time_of_day,
      label: s.label,
    }));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.date.localeCompare(b.date));
  return candidates[0];
}
