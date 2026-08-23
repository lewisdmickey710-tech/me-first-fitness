import { createClient } from "@/lib/supabase/server";
import { updatePaymentMethods } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";
import type { BusinessSettings } from "@/lib/types";

export default async function CoachSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = (await supabase
    .from("business_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle()) as { data: BusinessSettings | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Settings
      </h1>

      <Card>
        <p className="mb-3 font-medium text-ink">Accepted payment methods</p>
        <p className="mb-4 text-sm text-gray">
          Shown to clients wherever a payment or late fee is due, so they
          have a concrete way to pay instead of just being told to reach
          out.
        </p>
        <form action={updatePaymentMethods} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Cash App cashtag
            </label>
            <Input
              name="cash_app_cashtag"
              defaultValue={settings?.cash_app_cashtag ?? ""}
              placeholder="$YourCashtag"
            />
            <p className="mt-1 text-xs text-gray">
              Just the tag — clients get a direct cash.app link to it.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Zelle
            </label>
            <Input
              name="zelle_info"
              defaultValue={settings?.zelle_info ?? ""}
              placeholder="email@example.com or phone number"
            />
            <p className="mt-1 text-xs text-gray">
              Zelle doesn&apos;t support payment links across banks, so
              this shows as plain text for clients to send to directly.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Cash note{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Textarea
              name="cash_note"
              rows={2}
              defaultValue={settings?.cash_note ?? ""}
              placeholder="e.g. In person at your next session"
            />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
