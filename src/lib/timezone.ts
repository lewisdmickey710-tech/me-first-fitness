// Single business timezone for the whole app -- this is a solo local
// coaching business, not a multi-timezone product, so one constant is
// simpler and more correct than per-user timezone handling. Mickey is
// based in Texas, which is Central time (not Eastern -- update this if
// the business ever relocates).
export const BUSINESS_TIMEZONE = "America/Chicago";

/**
 * A Date whose UTC fields (getUTCDay, getUTCDate, getUTCHours, ...) reflect
 * the current wall-clock date/time in BUSINESS_TIMEZONE, regardless of what
 * timezone the server actually runs in (Vercel functions run in UTC).
 */
export function nowInBusinessTz(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return new Date(
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") === 24 ? 0 : get("hour"),
      get("minute"),
      get("second")
    )
  );
}

/** YYYY-MM-DD for a business-tz-anchored Date, using its UTC fields. */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}
