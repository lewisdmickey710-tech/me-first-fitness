import { nowInBusinessTz } from "@/lib/timezone";
import type { PaymentSchedule } from "@/lib/types";

// Real policy, from the signed Client Services Agreement (Section 3): under
// 12 hours' notice is a late cancellation, on a rolling 16-week window (one
// training cycle). Each plan gets its own free-cancellation allotment for
// the *current* cycle -- monthly clients get 2 free before a $10 fee
// applies, pay-as-you-go clients get 1 free before a $20 fee applies. Free
// cancellations don't roll over between cycles: once 16 weeks pass with no
// late cancellation, the next one starts a fresh cycle at the client's
// current plan's full allotment.
//
// clients.late_cancel_free_remaining tracks how many free cancellations are
// left in the *active* cycle. It's intentionally not just re-derived from
// the plan + a rolling count, because switching plans mid-cycle is
// asymmetric (see adjustFreeRemainingForSwitch below): downgrading forfeits
// whatever the new plan doesn't cover, but upgrading never hands back free
// cancellations already spent under the stricter plan.
export const LATE_CANCEL_NOTICE_HOURS = 12;
export const LATE_CANCEL_WINDOW_DAYS = 16 * 7;

/** Free late cancellations per cycle for a plan -- 2 for monthly, 1 for
 * pay-as-you-go. Unset defaults to the more lenient monthly behavior. */
export function lateCancellationFreeAllotment(
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
 * The free-cancellations-remaining a client actually has right now, before
 * applying this cancellation or a plan switch. If there's been no late
 * cancellation in the current rolling window, any stored value is stale
 * leftover from a finished cycle -- treat it as a fresh cycle at the
 * given plan's full allotment instead of trusting it.
 */
export function effectiveFreeRemaining(
  storedRemaining: number | null,
  hasPriorLateCancellationInWindow: boolean,
  paymentSchedule: PaymentSchedule | null
): number {
  if (!hasPriorLateCancellationInWindow) {
    return lateCancellationFreeAllotment(paymentSchedule);
  }
  return storedRemaining ?? lateCancellationFreeAllotment(paymentSchedule);
}

/**
 * How a plan switch affects free-cancellations-remaining for the *current*
 * cycle. Downgrading (a smaller allotment) forfeits whatever the new plan
 * doesn't cover -- e.g. a monthly client who hasn't cancelled yet keeps 1
 * of their 2 free cancellations moving to pay-as-you-go; one who's already
 * used their first loses the second entirely. Upgrading (a larger or equal
 * allotment) never increases what's already been spent this cycle -- a
 * pay-as-you-go client who's used their 1 free cancellation doesn't get
 * monthly's 2 restored just by switching.
 */
export function adjustFreeRemainingForSwitch(
  currentRemaining: number,
  oldSchedule: PaymentSchedule | null,
  newSchedule: PaymentSchedule | null
): number {
  const oldAllotment = lateCancellationFreeAllotment(oldSchedule);
  const newAllotment = lateCancellationFreeAllotment(newSchedule);
  if (newAllotment >= oldAllotment) return currentRemaining;
  return Math.max(0, currentRemaining - (oldAllotment - newAllotment));
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
