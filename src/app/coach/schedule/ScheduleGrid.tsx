"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  setRequestStatus,
  counterRequest,
  coachRescheduleSession,
  coachBookSession,
  coachCancelSession,
  removeClientSchedule,
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
const HOUR_END = 17; // 5:00 PM
// Real sessions here start on the :15 and :45 too, not just the hour and
// half-hour, so the grid needs true 15-minute precision -- rows just run
// a bit shorter than before to keep the total height reasonable, and
// columns are wider for easier tapping.
const STEP_MIN = 15;
const SLOTS_PER_HOUR = 60 / STEP_MIN;
const SLOT_COUNT = (HOUR_END - HOUR_START) * SLOTS_PER_HOUR;
const SLOT_HEIGHT = 18;
const GUTTER_WIDTH = 44;

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
  clientScheduleId: string | null;
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

// A centered popup instead of a panel at the bottom of a long, scrollable
// page -- so a confirmation is visible the moment it appears, not just
// after scrolling all the way down to find it.
function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
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
  overdueClientIds = [],
  autoPickupClientId,
  autoPickupDate,
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
  overdueClientIds?: string[];
  autoPickupClientId?: string;
  autoPickupDate?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [pickedUpRequestId, setPickedUpRequestId] = useState<string | null>(null);
  const [pickedUpBooking, setPickedUpBooking] = useState<DayBooking | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<PendingReschedule | null>(
    null
  );
  const [pendingRescheduleMode, setPendingRescheduleMode] = useState<
    "one_time" | "permanent"
  >("one_time");
  const [newBookingSlot, setNewBookingSlot] = useState<{ date: string; time: string } | null>(
    null
  );
  const [newBookingClientId, setNewBookingClientId] = useState("");
  const [newBookingType, setNewBookingType] = useState<BookingType>("session");
  const [newBookingRecurring, setNewBookingRecurring] = useState(false);
  const [newBookingDuration, setNewBookingDuration] = useState<30 | 60>(60);
  const [error, setError] = useState<string | null>(null);
  const [balanceActionBooking, setBalanceActionBooking] = useState<DayBooking | null>(
    null
  );

  // Coming here from the "Next booked session" widget's Reschedule button
  // should land exactly as if the coach had tapped this session themselves
  // -- pick it up right away instead of making them find and tap it again.
  const autoPickupHandledRef = useRef(false);
  useEffect(() => {
    if (autoPickupHandledRef.current || !autoPickupClientId || !autoPickupDate) return;
    const match = bookings.find(
      (b) => b.clientId === autoPickupClientId && b.date === autoPickupDate
    );
    if (match) {
      autoPickupHandledRef.current = true;
      setPickedUpBooking(match);
    }
  }, [bookings, autoPickupClientId, autoPickupDate]);

  // Press-and-hold on a booked session jumps straight to logging that
  // session for that client -- a plain tap still picks it up to reschedule
  // (below), so this needs its own timer to tell the two gestures apart,
  // and cancels itself if the finger moves (a scroll attempt, not a hold).
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const longPressStartYRef = useRef(0);

  function startLongPress(b: DayBooking, clientY: number) {
    longPressFiredRef.current = false;
    longPressStartYRef.current = clientY;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      router.push(`/coach/clients/${b.clientId}/log-session?date=${b.date}`);
    }, 550);
  }

  function moveLongPress(clientY: number) {
    if (longPressTimerRef.current && Math.abs(clientY - longPressStartYRef.current) > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function endLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  // Tapping a booking or a request to "pick it up" and then tapping a
  // slot to "drop" it there -- native HTML5 drag-and-drop never fires on
  // a touch screen, so this is the only version of this interaction that
  // actually works on a phone.
  function clearPickups() {
    setSelectedRequestId(null);
    setPickedUpRequestId(null);
    setPickedUpBooking(null);
    setPendingReschedule(null);
    setNewBookingSlot(null);
    setBalanceActionBooking(null);
    setError(null);
  }

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
    const next = req.id === selectedRequestId ? null : req.id;
    clearPickups();
    setSelectedRequestId(next);
  }

  function pickUpRequest(req: RequestChip) {
    clearPickups();
    setPickedUpRequestId(req.id);
  }

  function pickUpBooking(b: DayBooking) {
    const same =
      pickedUpBooking?.clientId === b.clientId && pickedUpBooking?.date === b.date;
    clearPickups();
    if (!same) setPickedUpBooking(b);
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
    setPickedUpRequestId(null);
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

  // Pixel geometry (in the same SLOT_HEIGHT-per-slot units the grid
  // already uses) for a single merged booking block, clamped to the
  // visible HOUR_START-HOUR_END window so a session starting or ending
  // outside it doesn't overflow the day column.
  function bookingGeometry(b: DayBooking): { top: number; height: number } | null {
    const startSlot = Math.round((toMinutes(b.timeOfDay) - HOUR_START * 60) / STEP_MIN);
    const spanSlots = Math.max(1, Math.round(b.durationMinutes / STEP_MIN));
    const start = Math.max(0, Math.min(startSlot, SLOT_COUNT));
    const end = Math.max(0, Math.min(startSlot + spanSlots, SLOT_COUNT));
    if (end <= start) return null;
    return { top: start * SLOT_HEIGHT, height: (end - start) * SLOT_HEIGHT };
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
      setPickedUpBooking(null);
      return;
    }
    setPendingRescheduleMode("one_time");
    setPendingReschedule({
      clientId: b.clientId,
      clientName: b.clientName,
      fromDate: b.date,
      fromTime: b.timeOfDay,
      toDate: date,
      toTime,
      durationMinutes: b.durationMinutes,
    });
    setPickedUpBooking(null);
  }

  function confirmReschedule() {
    if (!pendingReschedule) return;
    const r = pendingReschedule;
    const permanent = pendingRescheduleMode === "permanent";
    startTransition(async () => {
      try {
        await coachRescheduleSession(
          r.clientId,
          r.fromDate,
          r.fromTime,
          r.toDate,
          r.toTime,
          r.durationMinutes,
          permanent
        );
        setPendingReschedule(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't move that session.");
      }
    });
  }

  function cancelSingleOccurrence(b: DayBooking, isEmergency: boolean = false) {
    startTransition(async () => {
      try {
        await coachCancelSession(b.clientId, b.date, b.clientScheduleId, isEmergency);
        setBalanceActionBooking(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't cancel that session.");
      }
    });
  }

  function removeRecurringBooking(b: DayBooking) {
    if (!b.clientScheduleId) return;
    startTransition(async () => {
      try {
        await removeClientSchedule(b.clientScheduleId!, b.clientId);
        setBalanceActionBooking(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't remove that recurring time.");
      }
    });
  }

  function openNewBooking(date: string, slot: number) {
    clearPickups();
    setNewBookingClientId("");
    setNewBookingType("session");
    setNewBookingRecurring(false);
    setNewBookingDuration(60);
    setNewBookingSlot({ date, time: BOUNDARIES[slot] });
  }

  function confirmNewBooking() {
    if (!newBookingSlot || !newBookingClientId) return;
    const { date, time } = newBookingSlot;
    const recurring = newBookingType === "session" && newBookingRecurring;
    startTransition(async () => {
      try {
        await coachBookSession(
          newBookingClientId,
          date,
          time,
          newBookingType,
          recurring,
          recurring ? newBookingDuration : undefined
        );
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
        request to accept or decline it. Tap a booked (pink) session, then
        tap a new slot, to reschedule it — you&apos;ll be asked to confirm
        before it moves. Press and hold a booked session to jump straight to
        logging it. Client emails go out automatically either way.
      </p>

      {pickedUpBooking ? (
        <div className="flex items-center justify-between rounded-xl border border-pink/50 bg-pink/10 px-3 py-2 text-sm text-ink">
          <span>
            Moving {pickedUpBooking.clientName}&apos;s session — tap the new
            slot.
          </span>
          <button
            type="button"
            className="text-xs font-medium text-gray hover:text-ink"
            onClick={clearPickups}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {pickedUpRequestId ? (
        <div className="flex items-center justify-between rounded-xl border border-purple/50 bg-purple/10 px-3 py-2 text-sm text-ink">
          <span>Proposing a new time — tap a slot.</span>
          <button
            type="button"
            className="text-xs font-medium text-gray hover:text-ink"
            onClick={clearPickups}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {/* Only relevant when nothing else is open -- when a popup is open,
          the same error shows inside it instead, since this banner would
          otherwise sit hidden behind the popup's backdrop. */}
      {error && !selected && !pendingReschedule && !newBookingSlot ? (
        <p className="rounded-xl border border-pink/50 bg-pink/10 px-3 py-2 text-sm text-pink">
          {error}
        </p>
      ) : null}

      {unscheduledRequests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unscheduledRequests.map((r) => (
            <div
              key={r.id}
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

      <div
        className="grid gap-1 pb-1"
        style={{ gridTemplateColumns: `${GUTTER_WIDTH}px repeat(7, 1fr)` }}
      >
        <div>
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
              <div
                key={t}
                className="text-right text-[10px] text-gray"
                style={{ height: SLOT_HEIGHT }}
              >
                {formatTimeOfDay(t)}
              </div>
            ) : (
              <div key={t} style={{ height: SLOT_HEIGHT }} />
            )
          )}
        </div>

        {weekDays.map((day) => (
          <div key={day.date}>
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
                    onClick={() => {
                      if (req) {
                        selectRequest(req);
                        return;
                      }
                      if (pickedUpBooking) {
                        if (block || booking) {
                          setError("That time is already blocked or booked — pick another slot.");
                          return;
                        }
                        proposeReschedule(pickedUpBooking, day.date, slot);
                        return;
                      }
                      if (pickedUpRequestId) {
                        const pickedReq = requests.find((r) => r.id === pickedUpRequestId);
                        if (!pickedReq) return;
                        if (block || booking) {
                          setError("That time is already blocked or booked — pick another slot.");
                          return;
                        }
                        proposeTime(pickedReq, day.date, slot);
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
                    style={{ height: SLOT_HEIGHT }}
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
                const isPickedUp =
                  pickedUpBooking?.clientId === b.clientId && pickedUpBooking?.date === b.date;
                const isPending = overdueClientIds.includes(b.clientId);
                return (
                  <div
                    key={`${b.clientId}-${b.timeOfDay}`}
                    onClick={() => {
                      if (longPressFiredRef.current) {
                        longPressFiredRef.current = false;
                        return;
                      }
                      if (!movable) return;
                      if (isPending) {
                        clearPickups();
                        setBalanceActionBooking(b);
                        return;
                      }
                      pickUpBooking(b);
                    }}
                    onPointerDown={(e) => startLongPress(b, e.clientY)}
                    onPointerMove={(e) => moveLongPress(e.clientY)}
                    onPointerUp={endLongPress}
                    onPointerLeave={endLongPress}
                    onPointerCancel={endLongPress}
                    title={`${b.clientName} — ${formatTimeOfDay(b.timeOfDay)}${
                      isPending
                        ? " · pending: outstanding balance"
                        : movable
                          ? " · tap to reschedule"
                          : ""
                    } · press and hold to log this session`}
                    className={`absolute inset-x-0 z-10 flex items-center justify-center rounded-md border text-[10px] font-medium leading-none text-ink ${
                      isPickedUp
                        ? "border-rose bg-rose/50 ring-2 ring-rose"
                        : isPending
                          ? "border-gold/70 bg-gold/40"
                          : "border-pink/60 bg-pink/40"
                    } cursor-pointer`}
                    style={{ top: geometry.top, height: geometry.height }}
                  >
                    {initials(b.clientName)}
                    {isPending ? "*" : ""}
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
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gold/40" /> Pending (balance owed)
        </span>
      </div>

      {selected ? (
        <Modal onClose={() => setSelectedRequestId(null)}>
          <div className="space-y-2">
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
                onClick={() => pickUpRequest(selected)}
              >
                Propose a different time
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
            {error ? <p className="text-sm text-pink">{error}</p> : null}
          </div>
        </Modal>
      ) : null}

      {pendingReschedule ? (
        <Modal onClose={() => setPendingReschedule(null)}>
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">
              Move {pendingReschedule.clientName}&apos;s session from{" "}
              {pendingReschedule.fromDate} at {formatTimeOfDay(pendingReschedule.fromTime)}{" "}
              to {pendingReschedule.toDate} at {formatTimeOfDay(pendingReschedule.toTime)}?
            </p>
            <div className="space-y-1.5 rounded-xl border border-grayLt p-2.5">
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="reschedule_mode"
                  className="mt-0.5"
                  checked={pendingRescheduleMode === "one_time"}
                  onChange={() => setPendingRescheduleMode("one_time")}
                />
                Just this once — their standing weekly time stays the same
              </label>
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="reschedule_mode"
                  className="mt-0.5"
                  checked={pendingRescheduleMode === "permanent"}
                  onChange={() => setPendingRescheduleMode("permanent")}
                />
                Permanently — change their standing weekly time to this
              </label>
            </div>
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
            {error ? <p className="text-sm text-pink">{error}</p> : null}
          </div>
        </Modal>
      ) : null}

      {newBookingSlot ? (
        <Modal onClose={() => setNewBookingSlot(null)}>
          <div className="space-y-3">
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
                onChange={(e) => {
                  const type = e.target.value as BookingType;
                  setNewBookingType(type);
                  if (type !== "session") setNewBookingRecurring(false);
                }}
              >
                {BOOKING_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            {newBookingType === "session" ? (
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={newBookingRecurring}
                  onChange={(e) => setNewBookingRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-grayLt text-rose focus:ring-1 focus:ring-rose"
                />
                Make this a weekly recurring session (unchecked = just this one time)
              </label>
            ) : null}
            {newBookingType === "session" && newBookingRecurring ? (
              <Select
                value={newBookingDuration}
                onChange={(e) => setNewBookingDuration(Number(e.target.value) === 30 ? 30 : 60)}
              >
                <option value={60}>60 minutes (standard)</option>
                <option value={30}>30 minutes</option>
              </Select>
            ) : null}
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
            {error ? <p className="text-sm text-pink">{error}</p> : null}
          </div>
        </Modal>
      ) : null}

      {balanceActionBooking ? (
        <Modal onClose={() => setBalanceActionBooking(null)}>
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">
              {balanceActionBooking.clientName} has an outstanding balance —
              this session on {balanceActionBooking.date} at{" "}
              {formatTimeOfDay(balanceActionBooking.timeOfDay)} is pending.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => {
                  const b = balanceActionBooking;
                  setBalanceActionBooking(null);
                  pickUpBooking(b);
                }}
              >
                Reschedule
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={() => cancelSingleOccurrence(balanceActionBooking)}
              >
                Cancel this session
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => cancelSingleOccurrence(balanceActionBooking, true)}
              >
                Client emergency (no charge)
              </Button>
              {balanceActionBooking.clientScheduleId ? (
                <Button
                  type="button"
                  variant="danger"
                  disabled={isPending}
                  onClick={() => removeRecurringBooking(balanceActionBooking)}
                >
                  Remove recurring time (lost cause)
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => setBalanceActionBooking(null)}
              >
                Close
              </Button>
            </div>
            {error ? <p className="text-sm text-pink">{error}</p> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
