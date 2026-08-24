import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { switchPaymentSchedule } from "@/app/client/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DocumentBody,
  EmptyState,
  Heart,
  Input,
} from "@/components/ui";
import type { LegalDocument, PaymentSchedule } from "@/lib/types";

const PLAN_LABEL: Record<PaymentSchedule, string> = {
  monthly: "Monthly",
  pay_as_you_go: "Pay-as-you-go",
};

export default async function ClientPlanPage() {
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
  const { data: documents } = (await supabase
    .from("legal_documents")
    .select("*")
    .in("key", ["monthly_plan_terms", "payg_plan_terms"])) as unknown as {
    data: LegalDocument[] | null;
  };

  const docByKey = new Map((documents ?? []).map((d) => [d.key, d]));
  const plans: { schedule: PaymentSchedule; doc: LegalDocument | undefined }[] = [
    { schedule: "monthly", doc: docByKey.get("monthly_plan_terms") },
    { schedule: "pay_as_you_go", doc: docByKey.get("payg_plan_terms") },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Payment plan
        </h1>
        <p className="mt-1 text-sm text-gray">
          Switch between monthly and pay-as-you-go any time. A fee
          already charged stays owed either way. Switching from monthly
          to pay-as-you-go forfeits any free cancellation beyond
          pay-as-you-go&apos;s smaller allotment and moves you to the
          higher fee right away — read the terms below before confirming.
        </p>
      </div>

      <Card className="flex items-center justify-between">
        <p className="text-sm text-gray">Your current plan</p>
        <Badge tone="green">
          {me.payment_schedule ? PLAN_LABEL[me.payment_schedule] : "Not set yet"}
        </Badge>
      </Card>

      {plans.map(({ schedule, doc }) => {
        if (!doc) return null;
        const isCurrent = me.payment_schedule === schedule;
        return (
          <Card key={schedule} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">{PLAN_LABEL[schedule]}</p>
              {isCurrent ? <Badge tone="green">current plan</Badge> : null}
            </div>
            <DocumentBody text={doc.body} />
            {!isCurrent ? (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await switchPaymentSchedule(schedule, formData);
                }}
                className="space-y-3 border-t border-grayLt pt-3"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Type your full legal name to confirm
                  </label>
                  <Input name="signed_name" required />
                </div>
                <Checkbox
                  name="agree"
                  required
                  label={`I have read and agree to the ${PLAN_LABEL[schedule]} terms above`}
                />
                <Button type="submit">Switch to {PLAN_LABEL[schedule]}</Button>
              </form>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
