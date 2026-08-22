import { addClient } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Select, Textarea } from "@/components/ui";
import { PHASES } from "@/lib/constants";
import { SORTING_QUESTIONS } from "@/lib/track-criteria";
import { TrackPicker } from "./TrackPicker";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Add a client
      </h1>

      <details className="rounded-2xl border border-grayLt bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink">
          <Heart className="mr-1.5" />
          Not sure which track? Work through these in order
        </summary>
        <ol className="mt-3 space-y-2 text-sm text-gray">
          {SORTING_QUESTIONS.map((q, i) => (
            <li key={i}>
              <span className="font-medium text-ink">{i + 1}.</span> {q}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-gray">
          Most clients sort themselves into a track by question 2 or 3 — the
          rest just confirm the fit. When more than one track could fit, the
          more specific track (medical or population-based) wins over a
          general frequency-based one. Pick a track below to see what it&apos;s
          built for.
        </p>
      </details>

      <Card>
        <form action={addClient} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Name
            </label>
            <Input name="name" required placeholder="Client's full name" />
          </div>

          <TrackPicker />

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phase
            </label>
            <Select name="phase" defaultValue="n/a">
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
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
        Once they have a login, invite them by adding their email as a
        Supabase user and linking it to this client — see the README.
      </p>
    </div>
  );
}
