import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Card, EmptyState, Heart } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { makeT } from "@/lib/i18n";
import type { BusinessSettings } from "@/lib/types";

export default async function ClientTipPage() {
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
  const supabase = await createClient();
  const { data: businessSettings } = (await supabase
    .from("business_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()) as { data: BusinessSettings | null };

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("Support the work")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("This is completely optional and never expected — your sessions are never contingent on it. If you'd ever like to send something as thanks, here's where.")}
        </p>
      </div>

      <Card>
        <p className="text-sm font-medium text-gray">{t("Ways to send a tip")}</p>
        <PaymentMethods settings={businessSettings} />
      </Card>
    </div>
  );
}
