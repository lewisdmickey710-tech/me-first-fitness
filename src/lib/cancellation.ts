import { nowInBusinessTz } from "@/lib/timezone";

// Real policy, from the signed Client Services Agreement (Section 3): under
// 12 hours' notice is a late cancellation. The 1st within a rolling 16-week
// window (one training cycle) is just noted; every one after that in the
// same window triggers a flat fee, and the count resets 16 weeks after each
// late cancellation.
export const LATE_CANCEL_NOTICE_HOURS = 12;
export const LATE_CANCEL_WINDOW_DAYS = 16 * 7;
export const LATE_CANCELLATION_FEE = 10;

/**
 * Hours between now (business tz) and a scheduled occurrence's date +
 * time_of_day. Negative if the occurrence is already in the past.
 */
export function hoursUntilOccurrence(
  occurrenceDate: string,
  timeOfDay: string,
  from: Date = nowInBusinessTz()
): number {
  const [year, month, day] = occurrenceDate.split("-").map(Number);
  const [hour, minute] = timeOfDay.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute ?? 0);
  return (target - from.getTime()) / (1000 * 60 * 60);
}

export function isLateCancellation(
  occurrenceDate: string,
  timeOfDay: string,
  from: Date = nowInBusinessTz()
): boolean {
  return hoursUntilOccurrence(occurrenceDate, timeOfDay, from) < LATE_CANCEL_NOTICE_HOURS;
}
