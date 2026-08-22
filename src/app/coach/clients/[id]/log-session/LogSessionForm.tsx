"use client";

import { useState } from "react";
import { logSession } from "@/app/coach/actions";
import { Button, Card, Input, Textarea } from "@/components/ui";
import type { ProgramDay } from "@/lib/track-programs";

interface Row {
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
}

const BLANK_ROWS = 6;

function blankRows(count: number): Row[] {
  return Array.from({ length: count }, () => ({
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
  }));
}

export function LogSessionForm({
  clientId,
  today,
  programDays,
}: {
  clientId: string;
  today: string;
  programDays: ProgramDay[] | null;
}) {
  const [dayLabel, setDayLabel] = useState("");
  const [rows, setRows] = useState<Row[]>(blankRows(BLANK_ROWS));
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const boundLogSession = logSession.bind(null, clientId);

  function applyDay(day: ProgramDay) {
    setActiveDay(day.label);
    setDayLabel(day.label);
    const filled = day.exercises.map((e) => ({
      exercise: e.exercise,
      sets: e.sets,
      reps: e.reps,
      weight: "",
    }));
    setRows([...filled, ...blankRows(2)]);
  }

  function clearTemplate() {
    setActiveDay(null);
    setDayLabel("");
    setRows(blankRows(BLANK_ROWS));
  }

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  }

  return (
    <Card>
      {programDays && programDays.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-ink">
            Start from this client&apos;s program
          </p>
          <div className="flex flex-wrap gap-2">
            {programDays.map((day) => (
              <button
                key={day.label}
                type="button"
                onClick={() => applyDay(day)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  activeDay === day.label
                    ? "bg-rose text-white"
                    : "border border-grayLt bg-white text-ink hover:border-rose/40"
                }`}
              >
                {day.label}
              </button>
            ))}
            {activeDay ? (
              <button
                type="button"
                onClick={clearTemplate}
                className="rounded-xl px-3 py-1.5 text-sm text-gray hover:text-ink"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

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
              value={dayLabel}
              onChange={(e) => setDayLabel(e.target.value)}
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
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input
                  name="exercise"
                  placeholder="Exercise"
                  className="col-span-6"
                  value={row.exercise}
                  onChange={(e) => updateRow(i, "exercise", e.target.value)}
                />
                <Input
                  name="sets"
                  placeholder="Sets"
                  className="col-span-2"
                  value={row.sets}
                  onChange={(e) => updateRow(i, "sets", e.target.value)}
                />
                <Input
                  name="reps"
                  placeholder="Reps"
                  className="col-span-2"
                  value={row.reps}
                  onChange={(e) => updateRow(i, "reps", e.target.value)}
                />
                <Input
                  name="weight"
                  placeholder="Weight"
                  className="col-span-2"
                  value={row.weight}
                  onChange={(e) => updateRow(i, "weight", e.target.value)}
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
  );
}
