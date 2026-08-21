import Link from "next/link";
import { logActivity } from "@/app/client/actions";
import { Button, Card, Heart, Input, Select, Textarea } from "@/components/ui";
import { ACTIVITY_TYPES } from "@/lib/constants";

export default function ClientActivityPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Link
        href="/client/dashboard"
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log activity
      </h1>
      <p className="text-sm text-gray">
        Anything active outside a coached session — a class, a walk, a
        workout with friends.
      </p>

      <Card>
        <form action={logActivity} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Type
            </label>
            <Select name="type" required defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Duration{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input name="duration" placeholder="e.g. 30 min" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="notes" rows={3} />
          </div>

          <Button type="submit">Save activity</Button>
        </form>
      </Card>
    </div>
  );
}
