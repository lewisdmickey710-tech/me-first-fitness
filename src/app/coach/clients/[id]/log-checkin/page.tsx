import Link from "next/link";
import { logCheckinAsCoach } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default async function LogCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const boundLogCheckin = logCheckinAsCoach.bind(null, id);

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${id}?tab=checkins`}
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a check-in
      </h1>
      <p className="text-sm text-gray">
        Logging this on your client&apos;s behalf.
      </p>

      <Card>
        <form action={boundLogCheckin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Sleep
              </label>
              <Input name="sleep" placeholder="e.g. 7 hrs" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Water
              </label>
              <Input name="water" placeholder="e.g. 64 oz" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Food
              </label>
              <Input name="food" placeholder="On track / off track" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Energy
              </label>
              <Input name="energy" placeholder="e.g. Good" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Mood
              </label>
              <Input name="mood" placeholder="e.g. Steady" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="notes" rows={3} />
          </div>

          <Button type="submit">Save check-in</Button>
        </form>
      </Card>
    </div>
  );
}
