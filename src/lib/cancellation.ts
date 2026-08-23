import { nowInBusinessTz } from "@/lib/timezone";
import type { PaymentSchedule } from "@/lib/types";

// Real policy, from the signed Client Services Agreement (Section 3): under
// 12 hours' notice is a late cancellation, on a rolling 16-week window (one
// training cycle) that resets 16 weeks after each late cancellation. Where
// the fee kicks in and how much it is depends on payment plan -- monthly
// clients keep one free late cancellation before a $10 fee applies; pay-
// as-you-go clients have no free pass, so their very first late
// cancellation in the window triggers a $20 fee. Because the window count
// is read straight off real session_occurrences rows, it's untouched by a
// plan switch either direction -- switching plans only ever changes which
// threshold/amount apply to the *next* late cancellation, never the count
// itself.
export const LATE_CANCEL_NOTICE_HOURS = 12;
export const LATE_CANCEL_WINDOW_DAYS = 16 * 7;

/** How many late cancellations in the rolling window (inclusive of the one
 * just logged) before a fee applies -- 2 for monthly (1 free), 1 for
 * pay-as-you-go (no free pass). Unset defaults to the more lenient monthly
 * behavior. */
export function lateCancellationFeeThreshold(
  paymentSchedule: PaymentSchedule | null
): number {
  return paymentSchedule === "pay_as_you_go" ? 1 : 2;
}

/** The fee amount for the given plan -- $20 for pay-as-you-go, $10
 * otherwise (including unset). */
export function lateCancellationFeeAmount(
  paymentSchedule: PaymentSchedule | null
): number {
  return paymentSchedule === "pay_as_you_go" ? 20 : 10;
}

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
