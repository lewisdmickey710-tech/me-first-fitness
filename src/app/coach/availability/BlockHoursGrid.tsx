"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blockDate, unblockDate } from "@/app/coach/actions";
import { Button, Textarea } from "@/components/ui";
import { formatTimeOfDay } from "@/lib/schedule";

const HOUR_START = 6; // 6:00 AM
const HOUR_END = 21; // 9:00 PM
const STEP_MIN = 15;
const SLOTS_PER_HOUR = 60 / STEP_MIN;
const SLOT_COUNT = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;

// boundaries[i] = start time of slot i ("HH:MM"); boundaries[SLOT_COUNT] is
// the end of the last slot -- so a block spanning slots [a, b] runs from
// boundaries[a] to boundaries[b + 1].
const BOUNDARIES: string[] = Array.from({ length: SLOT_COUNT + 1 }, (_, i) => {
  const totalMin = HOUR_START * 60 + i * STEP_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface DayBooking {
  date: string;
  timeOfDay: string;
  clientName: string;
}

interface BlockRow {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface AvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface WeekDay {
  date: string;
  dayOfWeek: number;
  label: string;
}

export function BlockHoursGrid({
  weekDays,
  availability,
  blocks,
  bookings,
  prevWeekHref,
  nextWeekHref,
  weekLabel,
  todayStr,
}: {
  weekDays: WeekDay[];
  availability: AvailabilityWindow[];
  blocks: BlockRow[];
  bookings: DayBooking[];
  prevWeekHref: string;
  nextWeekHref: string;
  weekLabel: string;
  todayStr: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selStart, setSelStart] = useState<{ date: string; slot: number } | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const norm = (t: string) => t.slice(0, 5);

  function availabilityForDay(dayOfWeek: number) {
    return availability.filter((a) => a.dayOfWeek === dayOfWeek);
  }

  function blockAt(date: string, slot: number): BlockRow | null {
    const t = BOUNDARIES[slot];
    return (
      blocks.find(
        (b) =>
          b.date === date &&
          (b.startTime === null ||
            (t >= norm(b.startTime) && t < norm(b.endTime!)))
      ) ?? null
    );
  }

  function bookingAt(date: string, slot: number): DayBooking | null {
    const t = BOUNDARIES[slot];
    return bookings.find((b) => b.date === date && norm(b.timeOfDay) === t) ?? null;
  }

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  function isAvailable(date: string, dayOfWeek: number, slot: number): boolean {
    // Matches submitRequest's actual gating: nothing configured anywhere
    // means every day is wide open, but once any window exists, a day
    // with none of its own is fully closed -- not "open all day".
    if (availability.length === 0) return true;
    const windows = availabilityForDay(dayOfWeek);
    if (windows.length === 0) return false;
    const t = BOUNDARIES[slot];
    return windows.some((w) => t >= norm(w.startTime) && t < norm(w.endTime));
  }

  function clearSelection() {
    setSelStart(null);
    setSelEnd(null);
    setReason("");
    setError(null);
  }

  function handleCellClick(date: string, slot: number) {
    const existingBlock = blockAt(date, slot);
    if (existingBlock) {
      startTransition(async () => {
        try {
          await unblockDate(existingBlock.id);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't unblock that.");
        }
      });
      return;
    }

    if (!selStart || selStart.date !== date) {
      setSelStart({ date, slot });
      setSelEnd(null);
      setError(null);
      return;
    }
    if (selEnd === null) {
      if (slot === selStart.slot) {
        clearSelection();
      } else {
        setSelEnd(slot);
      }
      return;
    }
    // A range is already selected -- start fresh from this click.
    setSelStart({ date, slot });
    setSelEnd(null);
    setError(null);
  }

  const selRange =
    selStart && selEnd !== null
      ? {
          date: selStart.date,
          lo: Math.min(selStart.slot, selEnd),
          hi: Math.max(selStart.slot, selEnd),
        }
      : null;

  function isSelected(date: string, slot: number): boolean {
    if (selRange) return selRange.date === date && slot >= selRange.lo && slot <= selRange.hi;
    if (selStart) return selStart.date === date && slot === selStart.slot;
    return false;
  }

  function confirmBlock() {
    if (!selRange) return;
    const start_time = BOUNDARIES[selRange.lo];
    const end_time = BOUNDARIES[selRange.hi + 1];
    const fd = new FormData();
    fd.set("blocked_date", selRange.date);
    fd.set("start_time", start_time);
    fd.set("end_time", end_time);
    if (reason.trim()) fd.set("reason", reason.trim());

    startTransition(async () => {
      try {
        await blockDate(fd);
        clearSelection();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't block that time.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={prevWeekHref}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          ← Prev
        </Link>
        <p className="font-medium text-ink">{weekLabel}</p>
        <Link
          href={nextWeekHref}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          Next →
        </Link>
      </div>

      <p className="text-xs text-gray">
        Tap a start slot, then an end slot on the same day to select a range
        to block. Tap an already-blocked slot to unblock it.
      </p>

      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="shrink-0 pt-6" style={{ width: 44 }}>
          {BOUNDARIES.slice(0, SLOT_COUNT).map((t, slot) =>
            slot % SLOTS_PER_HOUR === 0 ? (
              <div
                key={t}
                className="text-right text-[10px] text-gray"
                style={{ height: 20 }}
              >
                {formatTimeOfDay(t)}
              </div>
            ) : (
              <div key={t} style={{ height: 20 }} />
            )
          )}
        </div>

        {weekDays.map((day) => (
          <div key={day.date} className="shrink-0" style={{ width: 68 }}>
            <div
              className={`sticky top-0 rounded-t-lg py-1 text-center text-xs font-medium ${
                day.date === todayStr ? "bg-rose text-white" : "bg-bg text-ink"
              }`}
            >
              {day.label}
            </div>
            <div>
              {Array.from({ length: SLOT_COUNT }, (_, slot) => {
                const block = blockAt(day.date, slot);
                const booking = bookingAt(day.date, slot);
                const available = isAvailable(day.date, day.dayOfWeek, slot);
                const selected = isSelected(day.date, slot);
                const hourLine = slot % SLOTS_PER_HOUR === 0;
                let bg = available ? "bg-teal/25" : "bg-bg";
                let text = "text-ink";
                if (booking) bg = "bg-pink/20";
                if (block) {
                  bg = "bg-pink";
                  text = "text-white";
                }
                if (selected) bg = "bg-rose/50";
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleCellClick(day.date, slot)}
                    title={
                      block
                        ? `Blocked${block.reason ? `: ${block.reason}` : ""} — tap to unblock`
                        : booking
                          ? booking.clientName
                          : formatTimeOfDay(BOUNDARIES[slot])
                    }
                    className={`w-full border-x border-grayLt text-[9px] leading-none ${text} ${bg} ${
                      hourLine ? "border-t border-t-grayLt" : "border-t border-t-grayLt/30"
                    }`}
                    style={{ height: 20 }}
                  >
                    {booking && !block ? initials(booking.clientName) : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-teal/25" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-pink/20" /> Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-pink" /> Blocked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-bg" /> Outside hours
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-rose/50" /> Selected
        </span>
      </div>

      {selRange ? (
        <div className="space-y-2 rounded-xl border border-rose/40 bg-rose/5 p-3">
          <p className="text-sm font-medium text-ink">
            Block {selRange.date}, {formatTimeOfDay(BOUNDARIES[selRange.lo])}–
            {formatTimeOfDay(BOUNDARIES[selRange.hi + 1])}?
          </p>
          <Textarea
            rows={1}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="danger" disabled={isPending} onClick={confirmBlock}>
              Block this time
            </Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={clearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-pink">{error}</p> : null}
    </div>
  );
}
