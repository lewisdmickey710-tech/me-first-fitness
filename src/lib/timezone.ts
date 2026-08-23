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

// ---- Cross-timezone conversion, for virtual clients outside the business
// timezone. Everything stored in the database (session times, requests,
// availability) stays anchored to BUSINESS_TIMEZONE wall-clock time, same
// as before -- these only convert at the edges, for display to a client
// in their own timezone or for interpreting a time they typed in.

/** The UTC offset (in minutes) `timeZone` is at, around the given instant. */
function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return (asUtc - instant.getTime()) / 60000;
}

/**
 * The real UTC instant for wall-clock `timeStr` ("HH:MM") on `dateStr`
 * ("YYYY-MM-DD") in `timeZone`. Two-pass offset correction so it's exact
 * except right at a DST transition itself, where the local time is
 * inherently ambiguous or doesn't exist.
 */
export function zonedTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  const naive = new Date(`${dateStr}T${timeStr}:00Z`);
  const offset1 = tzOffsetMinutes(naive, timeZone);
  const pass1 = new Date(naive.getTime() - offset1 * 60000);
  const offset2 = tzOffsetMinutes(pass1, timeZone);
  return new Date(naive.getTime() - offset2 * 60000);
}

export interface ZonedParts {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  dayOfWeek: number; // 0-6, Sunday first
}

/** A UTC instant's wall-clock date/time/weekday in `timeZone`. */
export function utcToZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
    dayOfWeek: WEEKDAYS.indexOf(get("weekday")),
  };
}

/**
 * Converts a wall-clock date+time from one timezone to another --
 * e.g. a 5:00 PM Central session as seen from a client's Eastern
 * timezone. May shift the calendar date near midnight.
 */
export function convertWallTime(
  dateStr: string,
  timeStr: string,
  fromTz: string,
  toTz: string
): ZonedParts {
  const instant = zonedTimeToUtc(dateStr, timeStr, fromTz);
  return utcToZonedParts(instant, toTz);
}

// A curated list rather than the full IANA database -- this is a US-based
// solo coaching business, and a short, recognizable list is easier for a
// client to pick correctly than searching hundreds of city names.
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
] as const;

const TZ_ABBREVIATION: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Phoenix": "MST",
  "America/Los_Angeles": "PT",
  "America/Anchorage": "AKT",
  "Pacific/Honolulu": "HT",
};

/** Short label for a timezone, e.g. "ET" -- falls back to the raw IANA id. */
export function timezoneLabel(timeZone: string): string {
  return TZ_ABBREVIATION[timeZone] ?? timeZone;
}
