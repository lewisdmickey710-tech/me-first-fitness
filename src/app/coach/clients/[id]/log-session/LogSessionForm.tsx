"use client";

import { useMemo, useState } from "react";
import { logSession } from "@/app/coach/actions";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { PHASES } from "@/lib/constants";

export interface ProgramDayOption {
  phase: string;
  dayNumber: number;
  label: string;
  exercises: { exercise: string; sets: string; reps: string }[];
}

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
  programDayOptions,
  defaultPhase,
}: {
  clientId: string;
  today: string;
  programDayOptions: ProgramDayOption[];
  defaultPhase: string;
}) {
  const availablePhases = useMemo(
    () =>
      PHASES.filter((p) =>
        programDayOptions.some((d) => d.phase === p.id)
      ),
    [programDayOptions]
  );

  const [phase, setPhase] = useState(
    availablePhases.some((p) => p.id === defaultPhase)
      ? defaultPhase
      : availablePhases[0]?.id ?? ""
  );
  const [dayLabel, setDayLabel] = useState("");
  const [rows, setRows] = useState<Row[]>(blankRows(BLANK_ROWS));
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);

  const boundLogSession = logSession.bind(null, clientId);

  const daysForPhase = programDayOptions.filter((d) => d.phase === phase);

  function applyDay(day: ProgramDayOption) {
    setActiveDayKey(`${day.phase}-${day.dayNumber}`);
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
    setActiveDayKey(null);
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
      {availablePhases.length > 0 ? (
        <div className="mb-4 space-y-3">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              Which phase&apos;s version?
            </p>
            <div className="flex flex-wrap gap-2">
              {availablePhases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPhase(p.id);
                    clearTemplate();
                  }}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    phase === p.id
                      ? "text-white"
                      : "border border-grayLt bg-white text-ink hover:border-rose/40"
                  }`}
                  style={phase === p.id ? { backgroundColor: p.color } : undefined}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray">
              Mixing phases across sessions this week? Pick whichever phase
              fits today, day by day.
            </p>
          </div>

          {daysForPhase.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Start from this client&apos;s program
              </p>
              <div className="flex flex-wrap gap-2">
                {daysForPhase.map((day) => {
                  const key = `${day.phase}-${day.dayNumber}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyDay(day)}
                      className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                        activeDayKey === key
                          ? "bg-rose text-white"
                          : "border border-grayLt bg-white text-ink hover:border-rose/40"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
                {activeDayKey ? (
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
          ) : (
            <p className="text-sm text-gray">
              No days built yet for this phase — add them in Programs, or
              just log freeform below.
            </p>
          )}
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
