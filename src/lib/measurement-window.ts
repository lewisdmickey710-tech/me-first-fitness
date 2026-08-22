// Measurements and service check-ins run on a shared calendar cadence — the
// first week of every month, regardless of when a client signed up — not a
// per-client rolling window.

export function isFirstWeekOfMonth(date: Date = new Date()): boolean {
  return date.getDate() <= 7;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function loggedThisMonth(
  dates: string[],
  now: Date = new Date()
): boolean {
  const key = monthKey(now);
  return dates.some((d) => d.startsWith(key));
}

export function nextWindowLabel(now: Date = new Date()): string {
  if (isFirstWeekOfMonth(now)) {
    return `Due now — ${monthLabel(now)} window (through the 7th)`;
  }
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `Next window: ${monthLabel(next)} 1st–7th`;
}
