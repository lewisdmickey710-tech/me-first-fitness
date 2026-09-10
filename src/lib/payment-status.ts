import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentStatusBadge = {
  label: string;
  tone: "teal" | "gold" | "pink" | "gray";
} | null;

// Whether a given logged session was covered rather than paid for, and what
// it was worth -- true for every session of a GBTC (Give Back To Community)
// client automatically, not just the ones manually marked "waived" on that
// one session, plus any one-off waiver a non-GBTC client happens to get.
export function gbtcCoverage(
  client: {
    pro_bono: boolean;
    pro_bono_rate: number | null;
    session_rate: number | null;
  },
  session: { payment_status: "paid" | "unpaid" | "waived" | null }
): { covered: boolean; value: number | null } {
  if (client.pro_bono) {
    return { covered: true, value: client.pro_bono_rate };
  }
  if (session.payment_status === "waived") {
    return { covered: true, value: client.session_rate };
  }
  return { covered: false, value: null };
}

// Used to gate new self-service booking requests -- a client shouldn't be
// able to request more session time while an existing payment is overdue.
// Late cancellation fees have their own dedicated "sessions paused" flow
// already, so they're excluded here to avoid double-gating on the same fee.
export async function clientHasOverdueBalance(
  supabase: SupabaseClient,
  clientId: string,
  today: string
): Promise<boolean> {
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("client_id", clientId)
    .is("paid_on", null)
    .neq("kind", "late_cancellation_fee")
    .lt("due_date", today)
    .limit(1);
  return (data ?? []).length > 0;
}

// Pay-as-you-go clients don't have scheduled invoices -- their status is
// just whatever the coach marked on their most recent logged session.
export function payAsYouGoStatus(
  mostRecentPaymentStatus: "paid" | "unpaid" | "waived" | null | undefined
): PaymentStatusBadge {
  if (mostRecentPaymentStatus === "paid") return { label: "Paid last session", tone: "teal" };
  if (mostRecentPaymentStatus === "unpaid") return { label: "Payment due", tone: "pink" };
  if (mostRecentPaymentStatus === "waived")
    return { label: "Waived last session", tone: "gray" };
  return null;
}

// Monthly/scheduled clients are tracked via the `payments` table. No
// payment rows at all means nothing's been invoiced yet -- distinct from
// "paid up" (rows exist, all have paid_on set).
export function monthlyPaymentStatus(
  payments: { due_date: string; paid_on: string | null }[],
  today: string
): PaymentStatusBadge {
  if (payments.length === 0) return null;
  const unpaid = payments.filter((p) => !p.paid_on);
  if (unpaid.length === 0) return { label: "Paid up", tone: "teal" };
  const overdue = unpaid.some((p) => p.due_date < today);
  if (overdue) return { label: "Payment overdue", tone: "pink" };
  const next = [...unpaid].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  return { label: `Due ${next.due_date}`, tone: "gold" };
}
