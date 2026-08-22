// A simple, transparent point-based heuristic for flagging clients at
// elevated risk of cancelling/dropping off -- not a predictive model, just
// a handful of signals a coach would naturally weigh, made visible so
// nothing gets missed on a busy roster. Each signal is independently
// explainable (returned in `reasons`) so the flag is never a black box.
// Thresholds are deliberately simple starting points -- adjust the point
// values or the `isHighRisk` cutoff below if they don't match reality.

import type { OccurrenceStatus } from "@/lib/types";

export interface RiskInput {
  recentOccurrenceStatuses: OccurrenceStatus[]; // most recent first, excluding not-yet-happened "scheduled" rows
  daysSinceLastCheckinOrActivity: number | null; // null = never logged one
  hasOverduePayment: boolean;
  consistencyPct: number | null; // trailing-28-day sessions vs. expected, 0-100
  latestServiceCheckinSatisfaction: number | null; // 1-5
}

export interface RiskResult {
  score: number;
  reasons: string[];
  isHighRisk: boolean;
}

const HIGH_RISK_THRESHOLD = 3;
// Also the threshold the inactivity-nudge cron uses to decide a client
// has "gone quiet" -- kept here as the one source of truth for that number.
export const INACTIVITY_DAYS_THRESHOLD = 14;
const LOW_CONSISTENCY_THRESHOLD = 50;
const LOW_SATISFACTION_THRESHOLD = 2;

export function computeCancellationRisk(input: RiskInput): RiskResult {
  let score = 0;
  const reasons: string[] = [];

  const recentFour = input.recentOccurrenceStatuses.slice(0, 4);
  const cancelledOrLate = recentFour.filter(
    (s) => s === "cancelled" || s === "late_cancelled"
  ).length;
  if (cancelledOrLate >= 2) {
    score += 2;
    reasons.push(
      `${cancelledOrLate} of their last ${recentFour.length} sessions were cancelled or late-cancelled`
    );
  }

  if (
    input.daysSinceLastCheckinOrActivity === null ||
    input.daysSinceLastCheckinOrActivity >= INACTIVITY_DAYS_THRESHOLD
  ) {
    score += 1;
    reasons.push(
      input.daysSinceLastCheckinOrActivity === null
        ? "Never logged a check-in or activity"
        : `No check-in or activity logged in ${input.daysSinceLastCheckinOrActivity} days`
    );
  }

  if (input.hasOverduePayment) {
    score += 1;
    reasons.push("Has an overdue payment");
  }

  if (input.consistencyPct !== null && input.consistencyPct < LOW_CONSISTENCY_THRESHOLD) {
    score += 1;
    reasons.push(`Consistency is only ${input.consistencyPct}% over the last 4 weeks`);
  }

  if (
    input.latestServiceCheckinSatisfaction !== null &&
    input.latestServiceCheckinSatisfaction <= LOW_SATISFACTION_THRESHOLD
  ) {
    score += 2;
    reasons.push(
      `Latest service check-in satisfaction was ${input.latestServiceCheckinSatisfaction}/5`
    );
  }

  return { score, reasons, isHighRisk: score >= HIGH_RISK_THRESHOLD };
}
