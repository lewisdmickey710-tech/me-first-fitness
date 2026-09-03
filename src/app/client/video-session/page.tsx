import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { submitRequest } from "@/app/client/actions";
import { getMyClient } from "@/lib/current-client";
import { Button, Card, EmptyState, Heart, Input, Textarea } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { BUSINESS_TIMEZONE, timezoneLabel, toDateString, nowInBusinessTz } from "@/lib/timezone";
import { clientHasOverdueBalance } from "@/lib/payment-status";
import { CALL_DURATION_MINUTES, VIDEO_SESSION_RATE } from "@/lib/video-session";
import { makeT } from "@/lib/i18n";
import type { BusinessSettings } from "@/lib/types";

export default async function VideoSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const t = makeT(me.language);

  if (!me.video_sessions_enabled) {
    return (
      <div className="space-y-6">
        <BackLink href="/client/dashboard" />
        <EmptyState
          title={t("Video sessions aren't enabled")}
          body={t("Ask Mickey to turn on the video session add-on for your profile if you'd like to book one.")}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: businessSettings } = (await supabase
    .from("business_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()) as { data: BusinessSettings | null };

  const overdue = await clientHasOverdueBalance(
    supabase,
    me.id,
    toDateString(nowInBusinessTz())
  );
  if (overdue) {
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

  const clientTz = me.timezone || BUSINESS_TIMEZONE;
  const isOwnTimezone = clientTz === BUSINESS_TIMEZONE;

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Book a video session")}
      </h1>
      <p className="text-sm text-gray">
        {t(
          "A {minutes}-minute video call. Propose a time and pay the ${rate} session balance via Cash App or Zelle below. Mickey confirms your timeslot once the payment comes through, and you'll get her video call link right here once it's confirmed.",
          { minutes: CALL_DURATION_MINUTES, rate: VIDEO_SESSION_RATE }
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
          <input type="hidden" name="request_type" value="video_session" />
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
              {t("Anything Mickey should know?")}{" "}
              <span className="font-normal text-gray">{t("(optional)")}</span>
            </label>
            <Textarea name="note" rows={3} />
          </div>

          <Button type="submit">{t("Request & go to payment")}</Button>
        </form>
      </Card>

      <Card className="space-y-2">
        <p className="font-medium text-ink">
          {t("Pay the ${rate} session balance", { rate: VIDEO_SESSION_RATE })}
        </p>
        <p className="text-sm text-gray">
          {t("Send this once you've submitted your request above, so Mickey knows which booking it's for.")}
        </p>
        <PaymentMethods settings={businessSettings} />
      </Card>
    </div>
  );
}
