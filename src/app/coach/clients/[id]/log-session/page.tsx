import Link from "next/link";
import { logSession } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default async function LogSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const boundLogSession = logSession.bind(null, id);

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${id}?tab=sessions`}
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a session
      </h1>

      <Card>
        <form action={boundLogSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Day label
              </label>
              <Input
                name="day_label"
                required
                placeholder="e.g. Legs & Glutes"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Date
              </label>
              <Input name="date" type="date" required defaultValue={today} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Exercises
            </label>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input
                    name="exercise"
                    placeholder="Exercise"
                    className="col-span-6"
                  />
                  <Input name="sets" placeholder="Sets" className="col-span-2" />
                  <Input name="reps" placeholder="Reps" className="col-span-2" />
                  <Input
                    name="weight"
                    placeholder="Weight"
                    className="col-span-2"
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray">
              Leave a row blank to skip it.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Rating (1–5){" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input name="rating" type="number" min="1" max="5" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="day_notes" rows={3} />
          </div>

          <Button type="submit">Save session</Button>
        </form>
      </Card>
    </div>
  );
}
