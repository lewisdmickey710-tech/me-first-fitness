"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  setRequestStatus,
  counterRequest,
  coachRescheduleSession,
  coachBookSession,
} from "@/app/coach/actions";
import { Button, Select } from "@/components/ui";
import { formatTimeOfDay } from "@/lib/schedule";

const BOOKING_TYPES = [
  { id: "session", label: "In-person session" },
  { id: "checkin_call", label: "Check-in call" },
  { id: "video_session", label: "Video session" },
] as const;
type BookingType = (typeof BOOKING_TYPES)[number]["id"];

const HOUR_START = 6; // 6:00 AM
const HOUR_END = 21; // 9:00 PM
const STEP_MIN = 15;
const SLOTS_PER_HOUR = 60 / STEP_MIN;
const SLOT_COUNT = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;

const BOUNDARIES: string[] = Array.from({ length: SLOT_COUNT + 1 }, (_, i) => {
  const totalMin = HOUR_START * 60 + i * STEP_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface DayBooking {
  clientId: string;
  date: string;
  timeOfDay: string;
  clientName: string;
  durationMinutes: number;
}

interface PendingReschedule {
  clientId: string;
  clientName: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  durationMinutes: number;
}

function toMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

interface BlockRow {
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

export interface RequestChip {
  id: string;
  clientId: string;
  clientName: string;
  date: string | null;
  time: string | null;
  durationMinutes: number;
  status: "pending" | "countered";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export function ScheduleGrid({
  weekDays,
  availability,
  blocks,
  bookings,
  requests,
  clients,
  prevWeekHref,
  nextWeekHref,
  weekLabel,
  todayStr,
}: {
  weekDays: WeekDay[];
  availability: AvailabilityWindow[];
  blocks: BlockRow[];
  bookings: DayBooking[];
  requests: RequestChip[];
  clients: { id: string; name: string }[];
  prevWeekHref: string;
  nextWeekHref: string;
  weekLabel: string;
  todayStr: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [dragRequestId, setDragRequestId] = useState<string | null>(null);
  const [dragBooking, setDragBooking] = useState<DayBooking | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(
    null
  );
  const [newBookingSlot, setNewBookingSlot] = useState<{ date: string; time: string } | null>(
    null
  );
  const [newBookingClientId, setNewBookingClientId] = useState("");
  const [newBookingType, setNewBookingType] = useState<BookingType>("session");
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
          (b.startTime === null || (t >= norm(b.startTime) && t < norm(b.endTime!)))
      ) ?? null
    );
  }

  function bookingAt(date: string, slot: number): DayBooking | null {
    const t = toMinutes(BOUNDARIES[slot]);
    return (
      bookings.find((b) => {
        if (b.date !== date) return false;
        const start = toMinutes(b.timeOfDay);
        return t >= start && t < start + b.durationMinutes;
      }) ?? null
    );
  }

  function requestAt(date: string, slot: number): RequestChip | null {
    const t = toMinutes(BOUNDARIES[slot]);
    return (
      requests.find((r) => {
        if (r.date !== date || !r.time) return false;
        const start = toMinutes(r.time);
        return t >= start && t < start + r.durationMinutes;
      }) ?? null
    );
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

  const unscheduledRequests = requests.filter((r) => !r.date || !r.time);
  const selected = requests.find((r) => r.id === selectedRequestId) ?? null;

  function selectRequest(req: RequestChip) {
    if (req.status !== "pending") return;
    setSelectedRequestId(req.id === selectedRequestId ? null : req.id);
    setError(null);
  }

  function accept(req: RequestChip) {
    startTransition(async () => {
      try {
        await setRequestStatus(req.id, req.clientId, "confirmed");
        setSelectedRequestId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't confirm that.");
      }
    });
  }

  function decline(req: RequestChip) {
    startTransition(async () => {
      try {
        await setRequestStatus(req.id, req.clientId, "declined");
        setSelectedRequestId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't decline that.");
      }
    });
  }

  function proposeTime(req: RequestChip, date: string, slot: number) {
    // Check every slot the request's own duration would actually cover
    // from this drop point, not just the one cell dropped on -- a
    // 30-minute request dropped at 9:00 needs 9:00-9:15 both free.
    const spanSlots = Math.max(1, Math.round(req.durationMinutes / STEP_MIN));
    for (let i = 0; i < spanSlots; i++) {
      if (blockAt(date, slot + i) || bookingAt(date, slot + i)) {
        setError("That time is already blocked or booked — pick another slot.");
        return;
      }
    }
    const time = BOUNDARIES[slot];
    startTransition(async () => {
      try {
        await counterRequest(req.id, req.clientId, date, time);
        setSelectedRequestId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't propose that time.");
      }
    });
  }

  function bookingsForDay(date: string): DayBooking[] {
    return bookings.filter((b) => b.date === date);
  }

  // Pixel geometry (in the same 20px-per-15-min-slot units the grid
  // already uses) for a single merged booking block, clamped to the
  // visible HOUR_START-HOUR_END window so a session starting or ending
  // outside it doesn't overflow the day column.
  function bookingGeometry(b: DayBooking): { top: number; height: number } | null {
    const startSlot = Math.round((toMinutes(b.timeOfDay) - HOUR_START * 60) / STEP_MIN);
    const spanSlots = Math.max(1, Math.round(b.durationMinutes / STEP_MIN));
    const start = Math.max(0, Math.min(startSlot, SLOT_COUNT));
    const end = Math.max(0, Math.min(startSlot + spanSlots, SLOT_COUNT));
    if (end <= start) return null;
    return { top: start * 20, height: (end - start) * 20 };
  }

  function proposeReschedule(b: DayBooking, date: string, slot: number) {
    if (date < todayStr) {
      setError("Can't move a session into the past — pick a date from today onward.");
      return;
    }
    const spanSlots = Math.max(1, Math.round(b.durationMinutes / STEP_MIN));
    if (slot + spanSlots > SLOT_COUNT) {
      setError("That session wouldn't fit in the visible hours — pick an earlier start.");
      return;
    }
    for (let i = 0; i < spanSlots; i++) {
      const blocked = blockAt(date, slot + i);
      const existing = bookingAt(date, slot + i);
      const isOwnSlot = existing && existing.clientId === b.clientId && existing.date === b.date;
      if (blocked || (existing && !isOwnSlot)) {
        setError("That time is already blocked or booked — pick another slot.");
        return;
      }
    }
    const toTime = BOUNDARIES[slot];
    if (date === b.date && toTime === norm(b.timeOfDay)) {
      setDragBooking(null);
      return;
    }
    setPendingReschedule({
      clientId: b.clientId,
      clientName: b.clientName,
      fromDate: b.date,
      fromTime: b.timeOfDay,
      toDate: date,
      toTime,
      durationMinutes: b.durationMinutes,
    });
    setDragBooking(null);
  }

  function confirmReschedule() {
    if (!pendingReschedule) return;
    const r = pendingReschedule;
    startTransition(async () => {
      try {
        await coachRescheduleSession(
          r.clientId,
          r.fromDate,
          r.toDate,
          r.toTime,
          r.durationMinutes
        );
        setPendingReschedule(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't move that session.");
      }
    });
  }

  function openNewBooking(date: string, slot: number) {
    setError(null);
    setSelectedRequestId(null);
    setPendingReschedule(null);
    setNewBookingClientId("");
    setNewBookingType("session");
    setNewBookingSlot({ date, time: BOUNDARIES[slot] });
  }

  function confirmNewBooking() {
    if (!newBookingSlot || !newBookingClientId) return;
    const { date, time } = newBookingSlot;
    startTransition(async () => {
      try {
        await coachBookSession(newBookingClientId, date, time, newBookingType);
        setNewBookingSlot(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't book that slot.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link href={prevWeekHref} className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink">
          ← Prev
        </Link>
        <p className="font-medium text-ink">{weekLabel}</p>
        <Link href={nextWeekHref} className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink">
          Next →
        </Link>
      </div>

      <p className="text-xs text-gray">
        Tap an open slot to book someone in right there. Tap a purple
        request to accept or decline it, or drag it to a different slot to
        propose that time instead. Drag a booked (pink) session to a
        different slot to reschedule it — you&apos;ll be asked to confirm
        before it moves. Client emails go out automatically either way.
      </p>

      {unscheduledRequests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unscheduledRequests.map((r) => (
            <div
              key={r.id}
              draggable={r.status === "pending"}
              onDragStart={() => {
                setDragRequestId(r.id);
                setDragBooking(null);
              }}
              onClick={() => selectRequest(r)}
              title={
                r.status === "countered"
                  ? `${r.clientName} — awaiting their response`
                  : `${r.clientName} — no specific time requested`
              }
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium ${
                r.status === "countered"
                  ? "bg-purple/15 text-purple"
                  : "bg-purple/50 text-ink"
              } ${selectedRequestId === r.id ? "ring-2 ring-rose" : ""}`}
            >
              {r.clientName}
              {r.date ? ` · ${r.date}` : ""}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="shrink-0" style={{ width: 44 }}>
          {/* Invisible but real header, sized/spaced exactly like the day
              columns' header pill -- a hardcoded pt-* here previously
              only approximated that height, so the time labels slowly
              drifted out of alignment with the actual colored rows. */}
          <div
            aria-hidden
            className="invisible rounded-t-lg py-1 text-center text-xs font-medium"
          >
            .
          </div>
          {BOUNDARIES.slice(0, SLOT_COUNT).map((t, slot) =>
            slot % SLOTS_PER_HOUR === 0 ? (
              <div key={t} className="text-right text-[10px] text-gray" style={{ height: 20 }}>
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
            <div className="relative">
              {Array.from({ length: SLOT_COUNT }, (_, slot) => {
                const block = blockAt(day.date, slot);
                const booking = bookingAt(day.date, slot);
                const req = requestAt(day.date, slot);
                const available = isAvailable(day.date, day.dayOfWeek, slot);
                const isSelected = req?.id === selectedRequestId;
                const hourLine = slot % SLOTS_PER_HOUR === 0;

                let bg = available ? "bg-teal/45" : "bg-white";
                let text = "text-ink";
                if (req) bg = req.status === "countered" ? "bg-purple/15" : "bg-purple/50";
                if (block) {
                  bg = "bg-pink";
                  text = "text-white";
                }
                if (isSelected) bg = "bg-rose/60";

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isPending}
                    draggable={!!req && req.status === "pending"}
                    onDragStart={() => {
                      if (req) {
                        setDragRequestId(req.id);
                        setDragBooking(null);
                      }
                    }}
                    onDragOver={(e) => {
                      if (dragRequestId || dragBooking) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragRequestId) {
                        const draggedReq = requests.find((r) => r.id === dragRequestId);
                        setDragRequestId(null);
                        if (draggedReq) proposeTime(draggedReq, day.date, slot);
                      } else if (dragBooking) {
                        proposeReschedule(dragBooking, day.date, slot);
                      }
                    }}
                    onClick={() => {
                      if (req) {
                        selectRequest(req);
                        return;
                      }
                      if (block || booking || day.date < todayStr) return;
                      openNewBooking(day.date, slot);
                    }}
                    title={
                      block
                        ? `Blocked${block.reason ? `: ${block.reason}` : ""}`
                        : req
                          ? `${req.clientName} — ${
                              req.status === "countered" ? "awaiting response" : "requested, tap to review"
                            }`
                          : booking
                            ? booking.clientName
                            : formatTimeOfDay(BOUNDARIES[slot])
                    }
                    className={`block w-full border-x border-grayLt text-[9px] leading-none ${text} ${bg} ${
                      hourLine ? "border-t border-t-grayLt" : "border-t border-t-grayLt/30"
                    }`}
                    style={{ height: 20 }}
                  >
                    {block
                      ? ""
                      : req && req.time && norm(req.time) === BOUNDARIES[slot]
                        ? initials(req.clientName)
                        : ""}
                  </button>
                );
              })}

              {bookingsForDay(day.date).map((b) => {
                const geometry = bookingGeometry(b);
                if (!geometry) return null;
                const movable = day.date >= todayStr;
                return (
                  <div
                    key={`${b.clientId}-${b.timeOfDay}`}
                    draggable={movable}
                    onDragStart={() => {
                      setDragBooking(b);
                      setDragRequestId(null);
                    }}
                    title={`${b.clientName} — ${formatTimeOfDay(b.timeOfDay)}${
                      movable ? " · drag to reschedule" : ""
                    }`}
                    className={`absolute inset-x-0 z-10 flex items-center justify-center rounded-md border border-pink/60 bg-pink/40 text-[9px] font-medium leading-none text-ink ${
                      movable ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    style={{ top: geometry.top, height: geometry.height }}
                  >
                    {initials(b.clientName)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-teal/45" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-pink/30" /> Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-pink" /> Blocked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-purple/50" /> Request
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-purple/15" /> Awaiting their reply
        </span>
      </div>

      {selected ? (
        <div className="space-y-2 rounded-xl border border-purple/40 bg-purple/5 p-3">
          <p className="text-sm font-medium text-ink">
            {selected.clientName} requested{" "}
            {selected.date ?? "a time — no date given yet"}
            {selected.time ? ` at ${formatTimeOfDay(selected.time)}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={() => accept(selected)}>
              Accept
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={() => decline(selected)}
            >
              Decline
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => setSelectedRequestId(null)}
            >
              Close
            </Button>
          </div>
          <p className="text-xs text-gray">
            Or drag this request to a different slot on the grid to propose
            that time instead.
          </p>
        </div>
      ) : null}

      {pendingReschedule ? (
        <div className="space-y-2 rounded-xl border border-pink/50 bg-pink/10 p-3">
          <p className="text-sm font-medium text-ink">
            Move {pendingReschedule.clientName}&apos;s session from{" "}
            {pendingReschedule.fromDate} at {formatTimeOfDay(pendingReschedule.fromTime)}{" "}
            to {pendingReschedule.toDate} at {formatTimeOfDay(pendingReschedule.toTime)}?
          </p>
          <p className="text-xs text-gray">
            They&apos;ll get an email letting them know the new time.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={confirmReschedule}>
              Confirm &amp; email them
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => setPendingReschedule(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {newBookingSlot ? (
        <div className="space-y-2 rounded-xl border border-teal/50 bg-teal/10 p-3">
          <p className="text-sm font-medium text-ink">
            Book {newBookingSlot.date} at {formatTimeOfDay(newBookingSlot.time)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={newBookingClientId}
              onChange={(e) => setNewBookingClientId(e.target.value)}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              value={newBookingType}
              onChange={(e) => setNewBookingType(e.target.value as BookingType)}
            >
              {BOOKING_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isPending || !newBookingClientId}
              onClick={confirmNewBooking}
            >
              Book &amp; email them
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => setNewBookingSlot(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-pink">{error}</p> : null}
    </div>
  );
}
