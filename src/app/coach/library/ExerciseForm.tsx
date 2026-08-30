import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { LATERALITIES, MOVEMENT_TYPES, MUSCLE_GROUPS } from "@/lib/constants";
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

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Demo video link{" "}
            <span className="font-normal text-gray">(optional)</span>
          </label>
          <Input
            name="video_url"
            type="url"
            defaultValue={exercise?.video_url ?? ""}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-gray">
            Shown to clients as a &quot;Watch demo&quot; link next to this
            movement in their program.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Muscle group
            </label>
            <Select
              name="primary_muscle_group"
              defaultValue={exercise?.primary_muscle_group ?? ""}
            >
              <option value="">— Choose one —</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Movement type
            </label>
            <Select name="movement_type" defaultValue={exercise?.movement_type ?? ""}>
              <option value="">— Choose one —</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Laterality
            </label>
            <Select name="laterality" defaultValue={exercise?.laterality ?? ""}>
              <option value="">— Choose one —</option>
              {LATERALITIES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>
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
