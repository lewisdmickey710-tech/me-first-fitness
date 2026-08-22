import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { Exercise } from "@/lib/types";

export function ExerciseForm({
  action,
  exercise,
  otherExercises,
}: {
  action: (formData: FormData) => void;
  exercise?: Exercise;
  otherExercises: Exercise[];
}) {
  return (
    <Card>
      <form action={action} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Name
          </label>
          <Input
            name="name"
            required
            defaultValue={exercise?.name}
            placeholder="e.g. Hip Thrust (barbell or heavy DB)"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Client description
          </label>
          <Textarea
            name="client_description"
            rows={5}
            defaultValue={exercise?.client_description ?? ""}
            placeholder="How you'd explain it to the client, step by step — what to feel, what good form looks like."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Coach cues
          </label>
          <Textarea
            name="coach_cues"
            rows={5}
            defaultValue={exercise?.coach_cues ?? ""}
            placeholder="Mechanical notes for in-session coaching — what to watch, common compensations, correction cues, progression triggers."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Regress to{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Select
              name="regress_to_id"
              defaultValue={exercise?.regress_to_id ?? ""}
            >
              <option value="">None</option>
              {otherExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Progress to{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Select
              name="progress_to_id"
              defaultValue={exercise?.progress_to_id ?? ""}
            >
              <option value="">None</option>
              {otherExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button type="submit">
          {exercise ? "Save changes" : "Add exercise"}
        </Button>
      </form>
    </Card>
  );
}
