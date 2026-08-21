import { addClient } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Select, Textarea } from "@/components/ui";
import { PHASES, TRACKS } from "@/lib/constants";

export default function NewClientPage() {
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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Track
            </label>
            <Select name="track" required defaultValue="">
              <option value="" disabled>
                Choose a track
              </option>
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.name}
                </option>
              ))}
            </Select>
          </div>

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
