import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { cancelMySession } from "@/app/client/actions";
import { Badge, Button, Card, Collapsible, EmptyState, Heart } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { hoursUntilOccurrence, LATE_CANCEL_NOTICE_HOURS } from "@/lib/cancellation";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type { BusinessSettings, ClientSchedule, Payment, SessionOccurrence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  late_cancelled: "Late cancelled",
  rescheduled: "Rescheduled",
};

const DOT_TONE: Record<string, string> = {
  scheduled: "bg-teal",
  completed: "bg-green",
  cancelled: "bg-pink",
  late_cancelled: "bg-pink",
  rescheduled: "bg-gold",
};

const MONTH_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const SCHEDULE_QUOTE =
  "Motivation is what gets you started, habits are what keep you going.";

export default async function ClientSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const supabase = await createClient();

  const [{ data: schedules }, { data: unpaidFees }] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", me.id)
      .eq("kind", "late_cancellation_fee")
      .is("paid_on", null) as unknown as Promise<{ data: Payment[] | null }>,
  ]);

  const frozen = (unpaidFees ?? []).length > 0;

  if (frozen) {
    const fee = unpaidFees![0];
    const { data: businessSettings } = (await supabase
      .from("business_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()) as { data: BusinessSettings | null };
    return (
      <div className="space-y-6">
        <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Your schedule
        </h1>
        <Card className="space-y-2 border-pink/40">
          <p className="font-medium text-pink">Sessions paused</p>
          <p className="text-sm text-ink">
            A ${fee.amount} late cancellation fee is outstanding. Your
            upcoming sessions are paused until it&apos;s paid — send it
            using one of the methods below, and your schedule will pick
            back up right away.
          </p>
          <PaymentMethods settings={businessSettings} />
        </Card>
      </div>
    );
  }

  const { month: monthParam, date: dateParam } = await searchParams;

  const now = nowInBusinessTz();
  const todayStr = toDateString(now);

  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();
  const firstDateStr = toDateString(firstOfMonth);
  const lastDateStr = toDateString(new Date(Date.UTC(year, month, daysInMonth)));

  const activeSchedules = schedules ?? [];
  const scheduleByDayOfWeek = new Map<number, ClientSchedule[]>();
  for (const s of activeSchedules) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

  const { data: monthOccurrences } = await supabase
    .from("session_occurrences")
    .select("*")
    .eq("client_id", me.id)
    .gte("occurrence_date", firstDateStr)
    .lte("occurrence_date", lastDateStr);

  const occurrenceByDate = new Map<string, SessionOccurrence>();
  for (const o of monthOccurrences ?? []) {
    occurrenceByDate.set(o.occurrence_date, o);
  }

  const cells: { day: number; date: string; status: string | null }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = toDateString(date);
    const existing = occurrenceByDate.get(dateStr);
    const isScheduledDay = scheduleByDayOfWeek.has(date.getUTCDay());
    const status = existing ? existing.status : isScheduledDay ? "scheduled" : null;
    cells.push({ day, date: dateStr, status });
  }

  const selectedDate = dateParam ?? (monthKey === toDateString(now).slice(0, 7) ? todayStr : null);
  const selectedCell = cells.find((c) => c.date === selectedDate) ?? null;
  const selectedSchedules = selectedCell
    ? scheduleByDayOfWeek.get(new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()) ?? []
    : [];
  const selectedOccurrence = selectedDate ? occurrenceByDate.get(selectedDate) : undefined;

  const prevMonthDate = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const prevMonthKey = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonthKey = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Your schedule
      </h1>
      <p className="text-sm italic text-gray">
        <Heart className="mr-1" />
        &quot;{SCHEDULE_QUOTE}&quot;
      </p>

      <Collapsible label="Cancellation policy">
        <p className="text-sm text-gray">
          Cancelling with less than {LATE_CANCEL_NOTICE_HOURS} hours notice
          counts as a late cancellation. A first one is just noted — every
          one after that within 16 weeks brings a $10 fee and pauses your
          sessions until it&apos;s paid.
        </p>
      </Collapsible>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            <Heart className="mr-1.5" />
            Want more &quot;me time&quot;?
          </p>
          <p className="mt-1 text-sm text-gray">
            Ask for an extra session or a different time.
          </p>
        </div>
        <Link href="/client/request" className="shrink-0">
          <Button type="button" variant="secondary">
            Request time
          </Button>
        </Link>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Link
            href={`/client/schedule?month=${prevMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            ← Prev
          </Link>
          <p className="font-medium text-ink">
            {MONTH_LABEL_FMT.format(firstOfMonth)}
          </p>
          <Link
            href={`/client/schedule?month=${nextMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            Next →
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-gray">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {cells.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === todayStr;
            return (
              <Link
                key={cell.date}
                href={`/client/schedule?month=${monthKey}&date=${cell.date}`}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm ${
                  isSelected
                    ? "bg-rose text-white"
                    : isToday
                      ? "border border-rose text-ink"
                      : "text-ink hover:bg-bg"
                }`}
              >
                {cell.day}
                {cell.status ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : DOT_TONE[cell.status]
                    }`}
                  />
                ) : (
                  <span className="h-1.5 w-1.5" />
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      {!selectedCell ? (
        <EmptyState
          title="No session that day"
          body="Tap a highlighted date on the calendar to see details."
        />
      ) : (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">
              {DAY_NAMES[new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()]},{" "}
              {selectedCell.date}
            </p>
            {selectedCell.status ? (
              <Badge
                tone={
                  selectedCell.status === "completed"
                    ? "green"
                    : selectedCell.status === "scheduled"
                      ? "teal"
                      : "gold"
                }
              >
                {selectedCell.status === "scheduled"
                  ? "Scheduled"
                  : STATUS_LABEL[selectedCell.status]}
              </Badge>
            ) : null}
          </div>

          {selectedCell.status === null ? (
            <p className="text-sm text-gray">Nothing on the schedule this day.</p>
          ) : null}

          {selectedOccurrence?.status === "rescheduled" &&
          selectedOccurrence.rescheduled_to_date ? (
            <p className="text-sm text-gray">
              Moved to {selectedOccurrence.rescheduled_to_date}
            </p>
          ) : null}

          {selectedOccurrence?.status === "scheduled" &&
          selectedSchedules.length === 0 &&
          selectedOccurrence.notes ? (
            <p className="text-sm text-gray">{selectedOccurrence.notes}</p>
          ) : null}

          {selectedSchedules.map((s) => (
            <p key={s.id} className="text-sm text-gray">
              {formatTimeOfDay(s.time_of_day)}
              {s.label ? ` · ${s.label}` : ""}
            </p>
          ))}

          {selectedCell.status === "scheduled" ? (
            (() => {
              // One-off confirmed requests have no recurring schedule --
              // the time they asked for (if any) is stashed in notes as
              // "Confirmed request — HH:MM" when setRequestStatus created
              // this row, so pull it back out for the late-cancel check.
              const oneOffTimeMatch = selectedOccurrence?.notes?.match(
                /Confirmed request — (\d{2}:\d{2})/
              );
              const timeOfDay =
                selectedSchedules[0]?.time_of_day ?? oneOffTimeMatch?.[1] ?? null;
              const scheduleId = selectedSchedules[0]?.id ?? null;

              const hours = timeOfDay
                ? hoursUntilOccurrence(selectedCell.date, timeOfDay)
                : null;
              const wouldBeLate = hours !== null && hours < LATE_CANCEL_NOTICE_HOURS;
              const isPast =
                hours !== null ? hours < -24 : selectedCell.date < todayStr;
              if (isPast) return null;

              return (
                <div className="flex flex-wrap items-center gap-2 border-t border-grayLt pt-3">
                  {wouldBeLate ? (
                    <p className="w-full text-xs text-pink">
                      Cancelling now is under {LATE_CANCEL_NOTICE_HOURS} hours
                      notice — this will count as a late cancellation.
                    </p>
                  ) : timeOfDay === null ? (
                    <p className="w-full text-xs text-gray">
                      No exact time on file for this one — cancelling won&apos;t
                      be checked against the 12-hour notice window.
                    </p>
                  ) : null}
                  <form
                    action={async () => {
                      "use server";
                      await cancelMySession(scheduleId, selectedCell.date, timeOfDay);
                    }}
                  >
                    <Button type="submit" variant="danger">
                      Cancel
                    </Button>
                  </form>
                  <Link href={`/client/request?reschedule_from=${selectedCell.date}`}>
                    <Button type="button" variant="secondary">
                      Request reschedule
                    </Button>
                  </Link>
                </div>
              );
            })()
          ) : null}
        </Card>
      )}
    </div>
  );
}
