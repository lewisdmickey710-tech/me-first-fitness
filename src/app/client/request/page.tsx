import { BackLink } from "@/components/back-link";
import { submitRequest } from "@/app/client/actions";
import { getMyClient } from "@/lib/current-client";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";
import { BUSINESS_TIMEZONE, timezoneLabel } from "@/lib/timezone";

export default async function RequestTimePage({
  searchParams,
}: {
  searchParams: Promise<{ reschedule_from?: string; error?: string }>;
}) {
  const { reschedule_from: rescheduleFrom, error } = await searchParams;
  const me = await getMyClient();
  const clientTz = me?.timezone || BUSINESS_TIMEZONE;
  const isOwnTimezone = clientTz === BUSINESS_TIMEZONE;

  return (
    <div className="space-y-6">
      <BackLink href={rescheduleFrom ? "/client/schedule" : "/client/dashboard"} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {rescheduleFrom
          ? `Request to reschedule ${rescheduleFrom}`
          : "Request a session time"}
      </h1>
      <p className="text-sm text-gray">
        Propose a time that works for you — your coach will confirm or
        suggest another.
      </p>

      {error ? (
        <div className="rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">That didn&apos;t go through</p>
          <p className="mt-1 text-gray">{error}</p>
        </div>
      ) : null}

      <Card>
        <form action={submitRequest} className="space-y-4">
          {rescheduleFrom ? (
            <input type="hidden" name="reschedule_from_date" value={rescheduleFrom} />
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {rescheduleFrom ? "New date" : "Preferred date"}
              </label>
              <Input name="preferred_date" type="date" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred time{" "}
                <span className="font-normal text-gray">(optional)</span>
              </label>
              <Input name="preferred_time" type="time" />
            </div>
          </div>
          {!isOwnTimezone ? (
            <p className="-mt-2 text-xs text-gray">
              Time is in your timezone ({timezoneLabel(clientTz)}).
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Note
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder="Anything your coach should know"
            />
          </div>

          <Button type="submit">Send request</Button>
        </form>
      </Card>
    </div>
  );
}
