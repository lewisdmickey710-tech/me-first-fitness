import { BackLink } from "@/components/back-link";
import { logCheckin } from "@/app/client/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default function ClientCheckinPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a check-in
      </h1>

      <Card>
        <form action={logCheckin} className="space-y-4">
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
              Anything else?
            </label>
            <Textarea name="notes" rows={3} placeholder="Totally optional" />
          </div>

          <Button type="submit">Save check-in</Button>
        </form>
      </Card>
    </div>
  );
}
