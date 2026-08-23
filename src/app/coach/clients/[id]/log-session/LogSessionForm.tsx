"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addHabitForClient, logSession } from "@/app/coach/actions";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { BodyMapInput } from "@/components/body-map";
import { PHASES } from "@/lib/constants";
import type { SessionType } from "@/lib/types";

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

const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: "program", label: "Program day" },
  { id: "freestyle", label: "Freestyle workout" },
  { id: "conversation", label: "Conversation" },
  { id: "recovery", label: "Recovery" },
  { id: "assessment", label: "Measurements / screening" },
];

const NOTES_LABEL: Record<SessionType, string> = {
  program: "Notes",
  freestyle: "Notes",
  conversation: "What did you talk about? What's the plan for their week?",
  recovery: "Notes",
  assessment: "Movement screening / measurement findings",
};

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

  const [sessionType, setSessionType] = useState<SessionType>(
    availablePhases.length > 0 ? "program" : "freestyle"
  );
  const [phase, setPhase] = useState(
    availablePhases.some((p) => p.id === defaultPhase)
      ? defaultPhase
      : availablePhases[0]?.id ?? ""
  );
  const [dayLabel, setDayLabel] = useState("");
  const [rows, setRows] = useState<Row[]>(blankRows(BLANK_ROWS));
  const [recoveryDescription, setRecoveryDescription] = useState("");
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [habitName, setHabitName] = useState("");
  const [dayLabelTouched, setDayLabelTouched] = useState(false);

  const boundLogSession = logSession.bind(null, clientId);
  const boundAddHabit = addHabitForClient.bind(null, clientId);

  const daysForPhase = programDayOptions.filter((d) => d.phase === phase);
  const showExerciseGrid = sessionType === "program" || sessionType === "freestyle";
  const showRecoveryField = sessionType === "recovery";
  const showProgramPicker = sessionType === "program" && availablePhases.length > 0;

  function applyDay(day: ProgramDayOption) {
    setActiveDayKey(`${day.phase}-${day.dayNumber}`);
    setDayLabel(day.label);
    setDayLabelTouched(true);
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

  function defaultDayLabelFor(type: SessionType): string {
    switch (type) {
      case "conversation":
        return "Conversation";
      case "recovery":
        return "Recovery";
      case "assessment":
        return "Measurements / screening";
      default:
        return "";
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm font-medium text-ink">
          What&apos;s today&apos;s session?
        </p>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSessionType(t.id);
                clearTemplate();
                if (!dayLabelTouched) {
                  setDayLabel(defaultDayLabelFor(t.id));
                }
              }}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                sessionType === t.id
                  ? "bg-rose text-white"
                  : "border border-grayLt bg-white text-ink hover:border-rose/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showProgramPicker ? (
          <div className="space-y-3 border-t border-grayLt pt-3">
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
                switch to Freestyle below.
              </p>
            )}
          </div>
        ) : null}

        {sessionType === "assessment" ? (
          <div className="border-t border-grayLt pt-3">
            <Link
              href={`/coach/clients/${clientId}/log-measurement`}
              className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              + Log a measurement
            </Link>
            <p className="mt-1 text-xs text-gray">
              For movement screening findings, use the notes field below.
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <form action={boundLogSession} className="space-y-4">
          <input type="hidden" name="session_type" value={sessionType} />

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
                onChange={(e) => {
                  setDayLabel(e.target.value);
                  setDayLabelTouched(true);
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Date
              </label>
              <Input name="date" type="date" required defaultValue={today} />
            </div>
          </div>

          {showExerciseGrid ? (
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
          ) : null}

          {showRecoveryField ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                What did you do?
              </label>
              <Textarea
                name="exercise"
                rows={2}
                placeholder="Foam rolling, assisted stretching, Theragun..."
                value={recoveryDescription}
                onChange={(e) => setRecoveryDescription(e.target.value)}
              />
            </div>
          ) : null}

          {sessionType !== "conversation" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Rating (1–5){" "}
                <span className="font-normal text-gray">(optional)</span>
              </label>
              <Input name="rating" type="number" min="1" max="5" />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {NOTES_LABEL[sessionType]}
            </label>
            <Textarea name="day_notes" rows={3} />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              Body map{" "}
              <span className="font-normal text-gray">(optional)</span>
            </p>
            <BodyMapInput name="body_map" />
          </div>

          <Button type="submit">Save session</Button>
        </form>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-ink">Add a habit for them</p>
        <p className="text-xs text-gray">
          Something you want them tracking on their own between now and next
          time — shows up right away in their tracker.
        </p>
        <form
          action={async (formData: FormData) => {
            await boundAddHabit(String(formData.get("name") ?? ""));
            setHabitName("");
          }}
          className="flex gap-2"
        >
          <Input
            name="name"
            placeholder="e.g. Stretch hip flexors daily"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </Card>
    </div>
  );
}
