import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { submitRequest } from "@/app/client/actions";
import { getMyClient } from "@/lib/current-client";
import { Button, Card, EmptyState, Heart, Input, Textarea } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { BUSINESS_TIMEZONE, timezoneLabel, toDateString, nowInBusinessTz } from "@/lib/timezone";
import { clientHasOverdueBalance } from "@/lib/payment-status";
import { makeT } from "@/lib/i18n";
import type { BusinessSettings } from "@/lib/types";

export default async function RequestTimePage({
  searchParams,
}: {
  searchParams: Promise<{ reschedule_from?: string; error?: string }>;
}) {
  const { reschedule_from: rescheduleFrom, error } = await searchParams;
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
      <BackLink href={rescheduleFrom ? "/client/schedule" : "/client/dashboard"} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {rescheduleFrom
          ? t("Request to reschedule {date}", { date: rescheduleFrom })
          : t("Request a session time")}
      </h1>
      <p className="text-sm text-gray">
        {t("Propose a time that works for you — your coach will confirm or suggest another.")}
      </p>

      {error ? (
        <div className="rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">{t("That didn't go through")}</p>
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
                {rescheduleFrom ? t("New date") : t("Preferred date")}
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
              {t("Note")}
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder={t("Anything your coach should know")}
            />
          </div>

          <Button type="submit">{t("Send request")}</Button>
        </form>
      </Card>
    </div>
  );
}
