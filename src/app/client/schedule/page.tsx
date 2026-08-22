import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { cancelMySession } from "@/app/client/actions";
import { Badge, Button, Card, EmptyState, Heart } from "@/components/ui";
import { DAY_NAMES, formatTimeOfDay, upcomingOccurrences } from "@/lib/schedule";
import { hoursUntilOccurrence, LATE_CANCEL_NOTICE_HOURS } from "@/lib/cancellation";
import type { ClientSchedule, Payment, SessionOccurrence } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  late_cancelled: "Late cancelled",
  rescheduled: "Rescheduled",
};

export default async function ClientSchedulePage() {
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

  const [{ data: schedules }, { data: occurrences }, { data: unpaidFees }] =
    await Promise.all([
      supabase
        .from("client_schedules")
        .select("*")
        .eq("client_id", me.id)
        .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
      supabase
        .from("session_occurrences")
        .select("*")
        .eq("client_id", me.id)
        .gte("occurrence_date", new Date().toISOString().slice(0, 10)) as unknown as Promise<{
        data: SessionOccurrence[] | null;
      }>,
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
            upcoming sessions are paused until it&apos;s paid — reach out to
            Mickey to settle it (Cash, Cash App, or Zelle), and your schedule
            will pick back up right away.
          </p>
        </Card>
      </div>
    );
  }

  const occurrenceByDate = new Map<string, SessionOccurrence>();
  for (const o of occurrences ?? []) {
    occurrenceByDate.set(o.occurrence_date, o);
  }

  const upcoming = upcomingOccurrences(schedules ?? [], new Set(), 56);

  return (
    <div className="space-y-6">
      <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Your schedule
      </h1>
      <p className="text-sm text-gray">
        Cancelling with less than {LATE_CANCEL_NOTICE_HOURS} hours notice
        counts as a late cancellation. A first one is just noted — a second
        one within 16 weeks brings a $10 fee and pauses your sessions until
        it&apos;s paid.
      </p>

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming sessions"
          body="Your coach hasn't set a recurring weekly time yet — reach out if that seems off."
        />
      ) : (
        <div className="space-y-3">
          {upcoming.map((occ) => {
            const existing = occurrenceByDate.get(occ.date);
            const hours = hoursUntilOccurrence(occ.date, occ.timeOfDay);
            const wouldBeLate = hours < LATE_CANCEL_NOTICE_HOURS;

            return (
              <Card key={occ.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {DAY_NAMES[occ.dayOfWeek]}, {occ.date} at{" "}
                      {formatTimeOfDay(occ.timeOfDay)}
                    </p>
                    {occ.label ? (
                      <p className="text-sm text-gray">{occ.label}</p>
                    ) : null}
                  </div>
                  {existing ? (
                    <Badge tone={existing.status === "completed" ? "green" : "gold"}>
                      {STATUS_LABEL[existing.status]}
                    </Badge>
                  ) : (
                    <Badge tone="teal">Scheduled</Badge>
                  )}
                </div>

                {existing?.status === "rescheduled" && existing.rescheduled_to_date ? (
                  <p className="text-sm text-gray">
                    Moved to {existing.rescheduled_to_date}
                  </p>
                ) : null}

                {!existing ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-grayLt pt-3">
                    {wouldBeLate ? (
                      <p className="w-full text-xs text-pink">
                        Cancelling now is under {LATE_CANCEL_NOTICE_HOURS} hours
                        notice — this will count as a late cancellation.
                      </p>
                    ) : null}
                    <form
                      action={async () => {
                        "use server";
                        await cancelMySession(occ.scheduleId, occ.date, occ.timeOfDay);
                      }}
                    >
                      <Button type="submit" variant="danger">
                        Cancel
                      </Button>
                    </form>
                    <Link
                      href={`/client/request?reschedule_from=${occ.date}`}
                    >
                      <Button type="button" variant="secondary">
                        Request reschedule
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
