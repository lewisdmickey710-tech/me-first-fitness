"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearClientCustomProgramDay,
  setClientCustomProgramDay,
} from "@/app/coach/actions";
import { Button, Input } from "@/components/ui";
import { ExerciseAutocomplete, type ExerciseLibraryEntry } from "@/components/exercise-autocomplete";

interface Row {
  exercise: string;
  sets: string;
  reps: string;
}

function blankRow(): Row {
  return { exercise: "", sets: "", reps: "" };
}

// A fully custom version of a client's day -- unlike the swap/adjust/
// remove editor (ProgramDayEditor), rows here aren't tied to an existing
// program_day_exercise, so any number can be added or removed freely.
// Works for two kinds of day: an existing template day switched to custom
// (promoteDayToCustom -- "Reset" below reverts it), or a day that only
// exists for this client (client_extra_program_days -- no template to
// reset to, so that control doesn't show).
export function CustomProgramDayEditor({
  clientId,
  target,
  trackName,
  initialRows,
  exerciseLibrary,
}: {
  clientId: string;
  target: { programDayId: string } | { extraDayId: string };
  trackName: string | null;
  initialRows: Row[];
  exerciseLibrary: ExerciseLibraryEntry[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initialRows.length > 0 ? initialRows.map((r) => ({ ...r })) : [blankRow(), blankRow()]
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isExtraDay = "extraDayId" in target;

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    for (const row of rows) {
      if (!row.exercise.trim()) continue;
      formData.append("exercise", row.exercise.trim());
      formData.append("sets", row.sets.trim());
      formData.append("reps", row.reps.trim());
    }

    startTransition(async () => {
      try {
        await setClientCustomProgramDay(clientId, target, formData);
        setSavedAt(Date.now());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleReset() {
    if (isExtraDay) return;
    setError(null);
    startTransition(async () => {
      try {
        await clearClientCustomProgramDay(clientId, target.programDayId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-3">
      <p className="text-xs text-gray">
        {isExtraDay
          ? "This day only exists for this client -- nobody else on their track sees it."
          : `Fully customized for this client — the shared ${trackName ? `"${trackName}" ` : ""}template and everyone else on it are unaffected.`}{" "}
        Add or remove exercises freely; sets/reps are plain text.
      </p>

      <form onSubmit={handleSave} className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <ExerciseAutocomplete
              value={row.exercise}
              exercises={exerciseLibrary}
              placeholder="Exercise"
              className="col-span-6"
              onChangeText={(text) => updateRow(i, "exercise", text)}
              onSelect={(ex) => updateRow(i, "exercise", ex.name)}
            />
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
              className="col-span-2 text-sm text-gray hover:text-pink"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-rose hover:underline"
          >
            + Add exercise
          </button>
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        {savedAt && !error ? <p className="text-sm text-teal">Saved.</p> : null}
      </form>

      {!isExtraDay ? (
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="text-xs text-gray hover:text-ink"
        >
          Reset to the shared track default →
        </button>
      ) : null}
    </div>
  );
}
