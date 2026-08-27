import {
  BUSINESS_TIMEZONE,
  convertWallTime,
  nowInBusinessTz,
  timezoneLabel,
  toDateString,
} from "@/lib/timezone";

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
 * Like formatSchedule, but converts from the business timezone to a
 * client's own timezone (using `dateStr` to resolve DST correctly) and
 * appends a short zone label when it actually differs -- e.g. "Tuesdays
 * at 6:00 PM ET" for a client outside the business timezone, or plain
 * "Tuesdays at 5:00 PM" when they're in it, matching the app's normal
 * convention (their timezone is unambiguous, so no label needed).
 */
export function formatScheduleForClient(
  dateStr: string,
  timeOfDay: string,
  clientTz: string
): string {
  if (clientTz === BUSINESS_TIMEZONE) {
    const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
    return formatSchedule(dayOfWeek, timeOfDay);
  }
  const converted = convertWallTime(dateStr, timeOfDay, BUSINESS_TIMEZONE, clientTz);
  return `${DAY_NAMES[converted.dayOfWeek]}s at ${formatTimeOfDay(converted.time)} ${timezoneLabel(clientTz)}`;
}

/** Like formatTimeOfDay, but converted to a client's own timezone (see
 * formatScheduleForClient). */
export function formatTimeOfDayForClient(
  dateStr: string,
  timeOfDay: string,
  clientTz: string
): string {
  if (clientTz === BUSINESS_TIMEZONE) return formatTimeOfDay(timeOfDay);
  const converted = convertWallTime(dateStr, timeOfDay, BUSINESS_TIMEZONE, clientTz);
  return `${formatTimeOfDay(converted.time)} ${timezoneLabel(clientTz)}`;
}

export interface NextSessionForClient {
  date: string;
  dayOfWeek: number;
  timeOfDay: string | null;
  label: string | null;
  isOneOff: boolean;
  isVideoSession: boolean;
  scheduleId: string | null;
}

/**
 * The single soonest upcoming session across BOTH a client's recurring
 * client_schedules and any one-off confirmed session_occurrences (status
 * "scheduled", created when a coach confirms a time request that isn't
 * tied to a recurring day). A recurring day is skipped for the week its
 * occurrence has been cancelled/late-cancelled/rescheduled away.
 */
export function nextSessionForClient(
  schedules: {
    id: string;
    day_of_week: number;
    time_of_day: string;
    label: string | null;
    active: boolean;
  }[],
  occurrences: {
    occurrence_date: string;
    status: string;
    notes?: string | null;
    is_video_session?: boolean;
  }[],
  from: Date = nowInBusinessTz()
): NextSessionForClient | null {
  const todayStr = toDateString(from);
  const occByDate = new Map(occurrences.map((o) => [o.occurrence_date, o]));
  const activeSchedules = schedules.filter((s) => s.active);
  const candidates: NextSessionForClient[] = [];

  for (const s of activeSchedules) {
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(from);
      d.setUTCDate(d.getUTCDate() + offset);
      if (d.getUTCDay() !== s.day_of_week) continue;
      const dateStr = toDateString(d);
      const status = occByDate.get(dateStr)?.status;
      if (status === "cancelled" || status === "late_cancelled" || status === "rescheduled") {
        continue;
      }
      candidates.push({
        date: dateStr,
        dayOfWeek: s.day_of_week,
        timeOfDay: s.time_of_day,
        label: s.label,
        isOneOff: false,
        isVideoSession: occByDate.get(dateStr)?.is_video_session ?? false,
        scheduleId: s.id,
      });
      break;
    }
  }

  const candidateDates = new Set(candidates.map((c) => c.date));
  for (const o of occurrences) {
    if (o.status !== "scheduled" || o.occurrence_date < todayStr) continue;
    if (candidateDates.has(o.occurrence_date)) continue;
    const dayOfWeek = new Date(`${o.occurrence_date}T00:00:00Z`).getUTCDay();
    const timeMatch = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    candidates.push({
      date: o.occurrence_date,
      dayOfWeek,
      timeOfDay: timeMatch?.[1] ?? null,
      label: null,
      isOneOff: true,
      isVideoSession: o.is_video_session ?? false,
      scheduleId: null,
    });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.date.localeCompare(b.date));
  return candidates[0];
}

export interface UpcomingOccurrence {
  date: string;
  dayOfWeek: number;
  timeOfDay: string;
  label: string | null;
  scheduleId: string;
}

/**
 * Every occurrence (today through `daysAhead` days out) implied by a
 * client's active recurring schedules, excluding dates that already have
 * a session_occurrences row (passed in as `resolvedDates`) -- i.e. the
 * ones still needing a completed/cancelled/rescheduled/late-cancelled
 * status.
 */
export function upcomingOccurrences(
  schedules: {
    id: string;
    day_of_week: number;
    time_of_day: string;
    label: string | null;
    active: boolean;
  }[],
  resolvedDates: Set<string>,
  daysAhead = 14,
  from: Date = nowInBusinessTz()
): UpcomingOccurrence[] {
  const results: UpcomingOccurrence[] = [];
  for (const s of schedules) {
    if (!s.active) continue;
    for (let offset = 0; offset <= daysAhead; offset++) {
      const d = new Date(from);
      d.setUTCDate(d.getUTCDate() + offset);
      if (d.getUTCDay() !== s.day_of_week) continue;
      const dateStr = d.toISOString().slice(0, 10);
      if (resolvedDates.has(dateStr)) continue;
      results.push({
        date: dateStr,
        dayOfWeek: s.day_of_week,
        timeOfDay: s.time_of_day,
        label: s.label,
        scheduleId: s.id,
      });
    }
  }
  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
