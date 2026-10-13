"use client";

import { useRef, useState, useTransition } from "react";
import { addActivityAsCoach } from "@/app/coach/actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { ExerciseAutocomplete, type ExerciseLibraryEntry } from "@/components/exercise-autocomplete";
import { ACTIVITY_TYPES } from "@/lib/constants";

interface Row {
  exercise: string;
  sets: string;
  reps: string;
  exerciseId?: string;
}

function blankRow(): Row {
  return { exercise: "", sets: "", reps: "" };
}

// Mirrors the client's own LogActivityForm -- an optional exercise grid
// alongside the usual date/type/duration/notes/photo, so a class the
// coach logs on the client's behalf can also carry enough to later
// become a program day (see setProgramDayFromActivity).
export function AddActivityForm({
  clientId,
  today,
  exerciseLibrary,
}: {
  clientId: string;
  today: string;
  exerciseLibrary: ExerciseLibraryEntry[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow(), blankRow()]);

  function updateRow(i: number, field: "exercise" | "sets" | "reps", value: string) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        if (field === "exercise") return { ...r, exercise: value, exerciseId: undefined };
        return { ...r, [field]: value };
      })
    );
  }

  function selectExercise(i: number, ex: ExerciseLibraryEntry) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, exercise: ex.name, exerciseId: ex.id } : r))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await addActivityAsCoach(clientId, formData);
        form.reset();
        setRows([blankRow(), blankRow(), blankRow()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-2 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Date</label>
          <Input name="date" type="date" required defaultValue={today} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Type</label>
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
      </div>
      <Input name="duration" placeholder="Duration (optional) -- e.g. 30 min" />
      <Textarea name="notes" rows={2} placeholder="Notes (optional)" />

      <div className="space-y-2 rounded-xl border border-grayLt p-2">
        <p className="text-xs font-medium text-ink">
          Was it structured? Add what they did (optional)
        </p>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <ExerciseAutocomplete
              value={row.exercise}
              exercises={exerciseLibrary}
              placeholder="Exercise"
              className="col-span-6"
              onChangeText={(text) => updateRow(i, "exercise", text)}
              onSelect={(ex) => selectExercise(i, ex)}
            />
            <input type="hidden" name="exercise_id" value={row.exerciseId ?? ""} />
            <Input
              placeholder="Sets"
              className="col-span-2"
              value={row.sets}
              onChange={(e) => updateRow(i, "sets", e.target.value)}
            />
            <Input
              placeholder="Reps"
              className="col-span-2"
              value={row.reps}
              onChange={(e) => updateRow(i, "reps", e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="col-span-2 text-xs text-gray hover:text-pink"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-medium text-rose hover:underline"
        >
          + Add exercise
        </button>
        <p className="text-xs text-gray">
          Lets you turn this into a program day later, from the activity
          entry below.
        </p>
      </div>

      <input
        type="file"
        name="photo"
        accept="image/*"
        className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
      />
      {error ? <p className="text-sm text-pink">{error}</p> : null}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Saving…" : "Log activity"}
      </Button>
    </form>
  );
}
