import { createClient } from "@/lib/supabase/server";
import {
  addCoachAvailability,
  removeCoachAvailability,
  blockDate,
  unblockDate,
} from "@/app/coach/actions";
import { Button, Card, EmptyState, Heart, Input, Select, Textarea } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type { CoachAvailability, CoachBlockedDate } from "@/lib/types";

export default async function CoachAvailabilityPage() {
  const supabase = await createClient();

  const todayStr = toDateString(nowInBusinessTz());

  const [{ data: availability }, { data: blockedDates }] = await Promise.all([
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
  ]);

  const availabilityByDay = new Map<number, CoachAvailability[]>();
  for (const a of availability ?? []) {
    const list = availabilityByDay.get(a.day_of_week) ?? [];
    list.push(a);
    availabilityByDay.set(a.day_of_week, list);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Availability
      </h1>
      <p className="text-sm text-gray">
        Set the windows you&apos;re open for sessions — clients can only
        request times inside them. Block off a specific day here and then,
        and any client with a session that day gets auto-cancelled with a
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
        <p className="font-medium text-ink">Block a day off</p>
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
        <p className="text-sm font-medium text-gray">Upcoming blocked days</p>
        {!blockedDates || blockedDates.length === 0 ? (
          <EmptyState
            title="Nothing blocked"
            body="Days you block off will show up here."
          />
        ) : (
          blockedDates.map((b) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{b.blocked_date}</p>
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
