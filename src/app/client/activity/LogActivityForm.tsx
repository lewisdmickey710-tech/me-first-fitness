"use client";

import { useRef, useState, useTransition } from "react";
import { logActivity } from "@/app/client/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";
import { Button, Card, Collapsible, Input, Select, Textarea } from "@/components/ui";
import { ExerciseAutocomplete, type ExerciseLibraryEntry } from "@/components/exercise-autocomplete";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { makeT, type Locale } from "@/lib/i18n";

interface Row {
  exercise: string;
  sets: string;
  reps: string;
  exerciseId?: string;
}

function blankRow(): Row {
  return { exercise: "", sets: "", reps: "" };
}

export function LogActivityForm({
  clientId,
  today,
  locale,
  exerciseLibrary,
}: {
  clientId: string;
  today: string;
  locale: Locale;
  exerciseLibrary: ExerciseLibraryEntry[];
}) {
  const t = makeT(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
    const photo = formData.get("photo");
    formData.delete("photo");

    startTransition(async () => {
      try {
        if (photo instanceof File && photo.size > 0) {
          const path = await uploadFormCheckFile(clientId, "activity", photo);
          formData.set("photo_path", path);
        }
        await logActivity(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Date")}
          </label>
          <Input name="date" type="date" required defaultValue={today} />
          <p className="mt-1 text-xs text-gray">
            {t("Forgot to log it the same day? Change the date to when it actually happened — logging it late is totally fine.")}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Type")}
          </label>
          <Select name="type" required defaultValue="">
            <option value="" disabled>
              {t("Choose one")}
            </option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Duration")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          <Input name="duration" placeholder={t("e.g. 30 min")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Notes")}
          </label>
          <Textarea name="notes" rows={3} />
        </div>

        <Collapsible label={t("Was it structured? Add what you did (optional)")}>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <ExerciseAutocomplete
                  value={row.exercise}
                  exercises={exerciseLibrary}
                  placeholder={t("Exercise")}
                  className="col-span-6"
                  onChangeText={(text) => updateRow(i, "exercise", text)}
                  onSelect={(ex) => selectExercise(i, ex)}
                />
                <input type="hidden" name="exercise_id" value={row.exerciseId ?? ""} />
                <Input
                  placeholder={t("Sets")}
                  className="col-span-2"
                  value={row.sets}
                  onChange={(e) => updateRow(i, "sets", e.target.value)}
                />
                <Input
                  placeholder={t("Reps")}
                  className="col-span-2"
                  value={row.reps}
                  onChange={(e) => updateRow(i, "reps", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="col-span-2 text-sm text-gray hover:text-pink"
                >
                  {t("Remove")}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-2 text-sm font-medium text-rose hover:underline"
          >
            + {t("Add exercise")}
          </button>
          <p className="mt-2 text-xs text-gray">
            {t("Your coach can turn this into a program day if you want to repeat it.")}
          </p>
        </Collapsible>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Photo")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
          />
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("Saving…") : t("Save activity")}
        </Button>
      </form>
    </Card>
  );
}
