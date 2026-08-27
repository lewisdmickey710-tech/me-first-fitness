import { createClient } from "@/lib/supabase/server";
import {
  addCoachAvailability,
  removeCoachAvailability,
  blockDate,
  unblockDate,
} from "@/app/coach/actions";
import { BlockHoursGrid } from "./BlockHoursGrid";
import { BackLink } from "@/components/back-link";
import { Button, Card, EmptyState, Heart, Input, Select, Textarea } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type { ClientSchedule, CoachAvailability, CoachBlockedDate } from "@/lib/types";

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEK_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

type ScheduleRow = ClientSchedule & { clients: { id: string; name: string } | null };

export default async function CoachAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();

  const now = nowInBusinessTz();
  const todayStr = toDateString(now);

  const { week: weekParam } = await searchParams;
  let weekStart: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    weekStart = new Date(`${weekParam}T00:00:00Z`);
  } else {
    weekStart = new Date(`${todayStr}T00:00:00Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  }
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = toDateString(d);
    return {
      date: dateStr,
      dayOfWeek: d.getUTCDay(),
      label: `${WEEKDAY_SHORT[d.getUTCDay()]} ${WEEK_LABEL_FMT.format(d)}`,
    };
  });
  const weekStartStr = weekDays[0].date;
  const weekEndStr = weekDays[6].date;
  const prevWeekDate = new Date(weekStart);
  prevWeekDate.setUTCDate(prevWeekDate.getUTCDate() - 7);
  const nextWeekDate = new Date(weekStart);
  nextWeekDate.setUTCDate(nextWeekDate.getUTCDate() + 7);
  const weekLabel = `${WEEK_LABEL_FMT.format(weekStart)} – ${WEEK_LABEL_FMT.format(
    new Date(`${weekEndStr}T00:00:00Z`)
  )}`;

  const [
    { data: availability },
    { data: blockedDates },
    { data: weekBlocks },
    { data: schedules },
    { data: weekOccurrences },
    { data: allClients },
  ] = await Promise.all([
    supabase
      .from("coach_availability")
      .select("*")
      .order("day_of_week")
      .order("start_time") as unknown as Promise<{ data: CoachAvailability[] | null }>,
    supabase
      .from("coach_blocked_dates")
      .select("*")
      .gte("blocked_date", todayStr)
      .order("blocked_date") as unknown as Promise<{ data: CoachBlockedDate[] | null }>,
    supabase
      .from("coach_blocked_dates")
      .select("*")
      .gte("blocked_date", weekStartStr)
      .lte("blocked_date", weekEndStr) as unknown as Promise<{ data: CoachBlockedDate[] | null }>,
    supabase
      .from("client_schedules")
      .select("*, clients(id, name)")
      .eq("active", true) as unknown as Promise<{ data: ScheduleRow[] | null }>,
    supabase
      .from("session_occurrences")
      .select("client_id, occurrence_date, notes, duration_minutes")
      .gte("occurrence_date", weekStartStr)
      .lte("occurrence_date", weekEndStr)
      .eq("status", "scheduled") as unknown as Promise<{
      data:
        | {
            client_id: string;
            occurrence_date: string;
            notes: string | null;
            duration_minutes: number;
          }[]
        | null;
    }>,
    supabase.from("clients").select("id, name") as unknown as Promise<{
      data: { id: string; name: string }[] | null;
    }>,
  ]);

  const availabilityByDay = new Map<number, CoachAvailability[]>();
  for (const a of availability ?? []) {
    const list = availabilityByDay.get(a.day_of_week) ?? [];
    list.push(a);
    availabilityByDay.set(a.day_of_week, list);
  }

  const clientNameById = new Map((allClients ?? []).map((c) => [c.id, c.name]));

  const scheduleByDayOfWeek = new Map<number, ScheduleRow[]>();
  for (const s of schedules ?? []) {
    if (!s.clients) continue;
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

  const bookings: {
    date: string;
    timeOfDay: string;
    clientName: string;
    durationMinutes: number;
  }[] = [];
  for (const day of weekDays) {
    for (const s of scheduleByDayOfWeek.get(day.dayOfWeek) ?? []) {
      bookings.push({
        date: day.date,
        timeOfDay: s.time_of_day,
        clientName: s.clients!.name,
        durationMinutes: s.duration_minutes,
      });
    }
  }
  for (const o of weekOccurrences ?? []) {
    const timeMatch = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    if (!timeMatch) continue;
    bookings.push({
      date: o.occurrence_date,
      timeOfDay: timeMatch[1],
      clientName: clientNameById.get(o.client_id) ?? "Client",
      durationMinutes: o.duration_minutes,
    });
  }

  return (
    <div className="space-y-6">
      <BackLink href="/coach/schedule">← Back to schedule</BackLink>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Availability
      </h1>
      <p className="text-sm text-gray">
        Set the windows you&apos;re open for sessions — clients can only
        request times inside them. Block off a day or just part of one, and
        any client with a session in that window gets auto-cancelled with a
        free reschedule and an email letting them know.
      </p>

      <Card className="space-y-3">
        <p className="font-medium text-ink">Weekly working hours</p>
        {availability && availability.length === 0 ? (
          <p className="text-sm text-gray">
            Nothing set yet — clients can currently request any day/time.
            Add a window below to start restricting requests.
          </p>
        ) : (
          <div className="space-y-2">
            {DAY_NAMES.map((name, dayOfWeek) => {
              const rows = availabilityByDay.get(dayOfWeek) ?? [];
              if (rows.length === 0) return null;
              return (
                <div key={dayOfWeek} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 shrink-0 text-sm font-medium text-ink">
                    {name}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {rows.map((a) => (
                      <span
                        key={a.id}
                        className="flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-sm text-ink"
                      >
                        {formatTimeOfDay(a.start_time)} – {formatTimeOfDay(a.end_time)}
                        <form
                          action={async () => {
                            "use server";
                            await removeCoachAvailability(a.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-gray hover:text-pink"
                            aria-label="Remove window"
                          >
                            ×
                          </button>
                        </form>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form action={addCoachAvailability} className="flex flex-wrap items-end gap-2 pt-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Day</label>
            <Select name="day_of_week" defaultValue="1" className="w-32">
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Start</label>
            <Input name="start_time" type="time" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">End</label>
            <Input name="end_time" type="time" required />
          </div>
          <Button type="submit" variant="secondary">
            Add window
          </Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <p className="font-medium text-ink">Block specific hours</p>
        <p className="text-sm text-gray">
          Available time shows teal, bookings show light pink with the
          client&apos;s initials, and blocked time shows dark pink. Select a
          range to block just part of a day — no need to block the whole
          thing.
        </p>
        <BlockHoursGrid
          weekDays={weekDays}
          availability={(availability ?? []).map((a) => ({
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
          }))}
          blocks={(weekBlocks ?? []).map((b) => ({
            id: b.id,
            date: b.blocked_date,
            startTime: b.start_time,
            endTime: b.end_time,
            reason: b.reason,
          }))}
          bookings={bookings}
          prevWeekHref={`/coach/availability?week=${toDateString(prevWeekDate)}`}
          nextWeekHref={`/coach/availability?week=${toDateString(nextWeekDate)}`}
          weekLabel={weekLabel}
          todayStr={todayStr}
        />
      </Card>

      <Card className="space-y-3">
        <p className="font-medium text-ink">Block a whole day off</p>
        <p className="text-sm text-gray">
          Anyone scheduled that day is auto-cancelled — free reschedule, no
          fee, and they&apos;ll get an email right away.
        </p>
        <form action={blockDate} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">Date</label>
            <Input name="blocked_date" type="date" required min={todayStr} />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="mb-1 block text-xs font-medium text-ink">
              Reason <span className="font-normal text-gray">(optional)</span>
            </label>
            <Textarea name="reason" rows={1} />
          </div>
          <Button type="submit" variant="danger">
            Block day
          </Button>
        </form>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray">Upcoming blocks</p>
        {!blockedDates || blockedDates.length === 0 ? (
          <EmptyState
            title="Nothing blocked"
            body="Days or hours you block off will show up here."
          />
        ) : (
          blockedDates.map((b) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">
                  {b.blocked_date}
                  {b.start_time && b.end_time ? (
                    <span className="font-normal text-gray">
                      {" "}
                      · {formatTimeOfDay(b.start_time)} – {formatTimeOfDay(b.end_time)}
                    </span>
                  ) : (
                    <span className="font-normal text-gray"> · Whole day</span>
                  )}
                </p>
                {b.reason ? <p className="text-sm text-gray">{b.reason}</p> : null}
              </div>
              <form
                action={async () => {
                  "use server";
                  await unblockDate(b.id);
                }}
              >
                <Button type="submit" variant="secondary">
                  Unblock
                </Button>
              </form>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
