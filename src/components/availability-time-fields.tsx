"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import { formatTimeOfDay } from "@/lib/schedule";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";
import { makeT, type Locale } from "@/lib/i18n";

const STEP_MIN = 15;

interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function slotsForDay(availability: AvailabilityWindow[], dayOfWeek: number): string[] {
  const windows = availability.filter((a) => a.dayOfWeek === dayOfWeek);
  const slots: string[] = [];
  for (const w of windows) {
    const [startH, startM] = w.startTime.slice(0, 5).split(":").map(Number);
    const [endH, endM] = w.endTime.slice(0, 5).split(":").map(Number);
    let mins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    while (mins < endMins) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      mins += STEP_MIN;
    }
  }
  return [...new Set(slots)].sort();
}

// A plain date-then-time pair used to let clients propose a time was
// previously totally unconstrained -- any date, any time of day, with the
// mismatch only caught after submitting. Once any weekly availability is
// configured, this narrows the time field to a dropdown of real slots
// within it, for the common case of a client in the business's own
// timezone (cross-timezone clients keep the free time input, since
// per-slot timezone conversion risks silently producing a wrong slot
// rather than just an unconstrained one -- the server-side check is still
// the real backstop either way).
export function AvailabilityTimeFields({
  availability,
  clientTz,
  locale,
  defaultDate,
  rescheduleLabel,
}: {
  availability: AvailabilityWindow[];
  clientTz: string;
  locale?: Locale;
  defaultDate?: string;
  rescheduleLabel: string;
}) {
  const t = makeT(locale);
  const isOwnTimezone = clientTz === BUSINESS_TIMEZONE;
  const constrained = availability.length > 0 && isOwnTimezone;

  const [date, setDate] = useState(defaultDate ?? "");
  const today = new Date().toISOString().slice(0, 10);

  const dayOfWeek = date ? new Date(`${date}T00:00:00Z`).getUTCDay() : null;
  const slots = constrained && dayOfWeek !== null ? slotsForDay(availability, dayOfWeek) : [];
  const closedDay = constrained && dayOfWeek !== null && slots.length === 0;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {rescheduleLabel}
          </label>
          <Input
            name="preferred_date"
            type="date"
            min={today}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Preferred time")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          {constrained ? (
            <Select name="preferred_time" disabled={!date || closedDay} defaultValue="">
              <option value="">{t("No specific time — Mickey will confirm")}</option>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {formatTimeOfDay(s)}
                </option>
              ))}
            </Select>
          ) : (
            <Input name="preferred_time" type="time" />
          )}
        </div>
      </div>
      {closedDay ? (
        <p className="text-xs text-pink">
          {t("Mickey isn't available on that day of the week — pick a different date.")}
        </p>
      ) : null}
    </div>
  );
}
