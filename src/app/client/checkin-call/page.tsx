import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { submitRequest } from "@/app/client/actions";
import { getMyClient } from "@/lib/current-client";
import { Button, Card, EmptyState, Heart, Input, Textarea } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { BUSINESS_TIMEZONE, timezoneLabel, toDateString, nowInBusinessTz } from "@/lib/timezone";
import { clientHasOverdueBalance } from "@/lib/payment-status";
import { CALL_DURATION_MINUTES } from "@/lib/video-session";
import { makeT } from "@/lib/i18n";
import type { BusinessSettings } from "@/lib/types";

export default async function CheckinCallPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const me = await getMyClient();
  const t = makeT(me?.language);
  const clientTz = me?.timezone || BUSINESS_TIMEZONE;
  const isOwnTimezone = clientTz === BUSINESS_TIMEZONE;

  const supabase = await createClient();
  const overdue = me
    ? await clientHasOverdueBalance(supabase, me.id, toDateString(nowInBusinessTz()))
    : false;

  if (overdue) {
    const { data: businessSettings } = (await supabase
      .from("business_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()) as { data: BusinessSettings | null };
    return (
      <div className="space-y-6">
        <BackLink href="/client/dashboard" />
        <EmptyState
          title={t("Booking is on hold")}
          body={t("You have an outstanding balance, so new session requests are disabled until it's paid. Send it below and you're clear to book again right away.")}
        />
        <Card>
          <PaymentMethods settings={businessSettings} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Book a check-in call")}
      </h1>
      <p className="text-sm text-gray">
        {t(
          "A one-time {minutes}-minute call for whatever needs extra time to sort out — getting equipment or a home setup situated, going over something in depth, or anything else a quick program note can't cover. Available whether you train in-person or virtually. Propose a time and your coach will confirm or suggest another.",
          { minutes: CALL_DURATION_MINUTES }
        )}
      </p>

      {error ? (
        <div className="rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">{t("That didn't go through")}</p>
          <p className="mt-1 text-gray">{error}</p>
        </div>
      ) : null}

      <Card>
        <form action={submitRequest} className="space-y-4">
          <input type="hidden" name="request_type" value="checkin_call" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Preferred date")}
              </label>
              <Input name="preferred_date" type="date" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Preferred time")}{" "}
                <span className="font-normal text-gray">{t("(optional)")}</span>
              </label>
              <Input name="preferred_time" type="time" />
            </div>
          </div>
          {!isOwnTimezone ? (
            <p className="-mt-2 text-xs text-gray">
              {t("Time is in your timezone ({tz}).", { tz: timezoneLabel(clientTz) })}
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("What do you need the call for?")}
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder={t("e.g. setting up my home gym space, going over form on something specific")}
            />
          </div>

          <Button type="submit">{t("Send request")}</Button>
        </form>
      </Card>
    </div>
  );
}
