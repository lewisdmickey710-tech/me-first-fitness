import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { createCompPackage } from "@/app/coach/actions";
import { Button, Card, Heart, Input } from "@/components/ui";
import type { Client } from "@/lib/types";

export default async function NewCompPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: client } = (await supabase
    .from("clients")
    .select("session_rate")
    .eq("id", id)
    .maybeSingle()) as { data: Pick<Client, "session_rate"> | null };

  const boundCreate = createCompPackage.bind(null, id);

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}?tab=payments`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Start a comp session package
      </h1>

      <Card>
        <form action={boundCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Label
            </label>
            <Input
              name="label"
              required
              placeholder="e.g. Silent Auction Donation — Strong Start Package"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Value per session ($)
              </label>
              <Input
                name="session_value"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={client?.session_rate ?? ""}
              />
              <p className="mt-1 text-xs text-gray">
                What each comp session is worth — shown as its value once
                logged as waived.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Comp sessions
              </label>
              <Input
                name="comp_sessions_total"
                type="number"
                min="1"
                step="1"
                required
                defaultValue="3"
              />
              <p className="mt-1 text-xs text-gray">
                How many free sessions this package covers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-grayLt pt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Discount rate ($)
                <span className="font-normal text-gray"> — optional</span>
              </label>
              <Input
                name="discount_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Discounted sessions
              </label>
              <Input
                name="discount_sessions_total"
                type="number"
                min="0"
                step="1"
                defaultValue="4"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-gray">
            If they sign on for recurring training before their comp
            sessions run out, this rate applies for this many sessions
            before reverting to their normal rate. Leave the discount rate
            blank to skip this — the package just ends once the comp
            sessions are used.
          </p>

          <Button type="submit">Start package</Button>
        </form>
      </Card>
    </div>
  );
}
