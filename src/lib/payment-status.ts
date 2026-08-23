export type PaymentStatusBadge = {
  label: string;
  tone: "teal" | "gold" | "pink";
} | null;

// Pay-as-you-go clients don't have scheduled invoices -- their status is
// just whatever the coach marked on their most recent logged session.
export function payAsYouGoStatus(
  mostRecentPaymentMade: boolean | null | undefined
): PaymentStatusBadge {
  if (mostRecentPaymentMade === true) return { label: "Paid last session", tone: "teal" };
  if (mostRecentPaymentMade === false) return { label: "Payment due", tone: "pink" };
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
