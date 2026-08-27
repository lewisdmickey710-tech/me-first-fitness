import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./PrintButton";
import type { Payment } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  session: "Training session",
  late_cancellation_fee: "Late cancellation fee",
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = (await supabase
    .from("payments")
    .select("*, clients(name)")
    .eq("id", id)
    .single()) as unknown as {
    data: (Payment & { clients: { name: string } | null }) | null;
  };

  if (!payment || !payment.paid_on) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6 p-6 print:p-0">
      <div className="print:hidden">
        <PrintButton />
      </div>

      <div className="space-y-4 rounded-2xl border border-grayLt p-6">
        <div>
          <p className="text-lg font-semibold text-ink">
            MeFirstFitness — Mind &amp; Muscle Mechanics
          </p>
          <p className="text-sm text-gray">Payment receipt</p>
        </div>

        <div className="border-t border-grayLt pt-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray">Received from</span>
            <span className="text-ink">{payment.clients?.name ?? "Client"}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray">For</span>
            <span className="text-ink">
              {KIND_LABEL[payment.kind] ?? payment.description} — {payment.description}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray">Date paid</span>
            <span className="text-ink">{payment.paid_on}</span>
          </div>
          <div className="flex justify-between border-t border-grayLt py-2 mt-1">
            <span className="font-medium text-ink">Amount</span>
            <span className="text-lg font-semibold text-ink">
              ${Number(payment.amount).toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray">Thank you for training with Mickey.</p>
      </div>
    </div>
  );
}
