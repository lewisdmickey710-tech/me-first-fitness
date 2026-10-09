// Milestones worth a push notification. A streak that isn't exactly one
// of these doesn't trigger anything -- congratulating every single day
// would get old fast.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

// Walks backward day by day from `asOfDateStr`, counting how many
// consecutive days appear in `loggedDates` before the first gap. Used
// for a daily habit-tracking streak, where `loggedDates` is the distinct
// set of dates (YYYY-MM-DD) a client logged at least one habit.
export function computeStreak(loggedDates: Set<string>, asOfDateStr: string): number {
  let streak = 0;
  const cursor = new Date(`${asOfDateStr}T00:00:00Z`);
  // A year is far more than any real streak needs to check, and keeps
  // this bounded regardless of how long someone's been tracking.
  for (let i = 0; i < 366; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!loggedDates.has(dateStr)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

// Given the streak as of today and the longest one already celebrated,
// decides whether today's streak just crossed a fresh milestone -- and
// returns the last-celebrated value to persist either way (reset to 0
// the moment a streak breaks, so hitting the same milestone again on a
// new streak is celebrated again instead of staying silent forever).
export function nextStreakCelebration(
  currentStreak: number,
  lastCelebrated: number
): { celebrate: boolean; newLastCelebrated: number } {
  const resetLastCelebrated = currentStreak <= 1 ? 0 : lastCelebrated;
  const celebrate =
    STREAK_MILESTONES.includes(currentStreak) && currentStreak > resetLastCelebrated;
  return {
    celebrate,
    newLastCelebrated: celebrate ? currentStreak : resetLastCelebrated,
  };
}
