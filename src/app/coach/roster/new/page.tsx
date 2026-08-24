import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addClient } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Select, Textarea } from "@/components/ui";
import type { CareProfile } from "@/lib/types";
import { CareProfilePicker } from "./CareProfilePicker";

export default async function NewClientPage() {
  const supabase = await createClient();
  const { data: careProfiles } = (await supabase
    .from("care_profiles")
    .select("*")
    .order("name")) as { data: CareProfile[] | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Add a client
      </h1>

      <Card>
        <form action={addClient} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Name
            </label>
            <Input name="name" required placeholder="Client's full name" />
          </div>

          <CareProfilePicker careProfiles={careProfiles ?? []} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Days per week
              </label>
              <Select name="days_per_week" defaultValue="3">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Session mode
              </label>
              <Select name="session_mode" defaultValue="in_person">
                <option value="in_person">In-person</option>
                <option value="virtual">Virtual (async programming)</option>
              </Select>
              <p className="mt-1 text-xs text-gray">
                Video sessions are an optional add-on for either mode —
                turn it on later from their profile once they&apos;re added.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Sessions allotted{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input
              name="sessions_allotted"
              type="number"
              min="0"
              placeholder="e.g. 12"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes{" "}
              <span className="font-normal text-gray">(coach-only)</span>
            </label>
            <Textarea name="notes" rows={3} />
          </div>

          <Button type="submit">Add client</Button>
        </form>
      </Card>

      <p className="text-sm text-gray">
        They start at Phase 1, week 1 of a new cycle automatically. Once
        they log in for the first time (client tab on the login page),
        you&apos;ll find them under{" "}
        <Link href="/coach/signups" className="text-rose hover:underline">
          Signups
        </Link>{" "}
        to link their login to this client record.
      </p>
    </div>
  );
}
