import { BackLink } from "@/components/back-link";
import { submitRequest } from "@/app/client/actions";
import { getMyClient } from "@/lib/current-client";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";
import { BUSINESS_TIMEZONE, timezoneLabel } from "@/lib/timezone";
import { CALL_DURATION_MINUTES } from "@/lib/video-session";

export default async function CheckinCallPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const me = await getMyClient();
  const clientTz = me?.timezone || BUSINESS_TIMEZONE;
  const isOwnTimezone = clientTz === BUSINESS_TIMEZONE;

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Book a check-in call
      </h1>
      <p className="text-sm text-gray">
        A one-time {CALL_DURATION_MINUTES}-minute call for whatever needs
        extra time to sort out — getting equipment or a home setup
        situated, going over something in depth, or anything else a quick
        program note can&apos;t cover. Available whether you train
        in-person or virtually. Propose a time and your coach will confirm
        or suggest another.
      </p>

      {error ? (
        <div className="rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">That didn&apos;t go through</p>
          <p className="mt-1 text-gray">{error}</p>
        </div>
      ) : null}

      <Card>
        <form action={submitRequest} className="space-y-4">
          <input type="hidden" name="request_type" value="checkin_call" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred date
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
              What do you need the call for?
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder="e.g. setting up my home gym space, going over form on something specific"
            />
          </div>

          <Button type="submit">Send request</Button>
        </form>
      </Card>
    </div>
  );
}
