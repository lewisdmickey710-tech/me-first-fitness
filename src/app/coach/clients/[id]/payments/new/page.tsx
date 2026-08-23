import { BackLink } from "@/components/back-link";
import { addPayment } from "@/app/coach/actions";
import { Button, Card, Heart, Input } from "@/components/ui";

export default async function NewPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const boundAdd = addPayment.bind(null, id);

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}?tab=payments`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Add a payment due
      </h1>

      <Card>
        <form action={boundAdd} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Description
            </label>
            <Input
              name="description"
              required
              placeholder="e.g. August package — 8 sessions"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Amount ($)
              </label>
              <Input name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Due date
              </label>
              <Input
                name="due_date"
                type="date"
                required
                defaultValue={today}
              />
            </div>
          </div>

          <Button type="submit">Add payment</Button>
        </form>
      </Card>

      <p className="text-sm text-gray">
        The app will email a reminder as the due date approaches, and again
        if it goes unpaid.
      </p>
    </div>
  );
}
