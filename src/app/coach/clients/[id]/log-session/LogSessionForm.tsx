"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addHabitForClient, addMilestone, logSession } from "@/app/coach/actions";
import { Badge, Button, Card, Checkbox, Input, Select, Textarea } from "@/components/ui";
import { BodyMapInput } from "@/components/body-map";
import { PHASES } from "@/lib/constants";
import { LOG_ENTRY_KIND_LABEL, LOG_ENTRY_KIND_TONE, type LogEntry } from "@/lib/log-entries";
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
  lastEntry,
}: {
  clientId: string;
  today: string;
  programDayOptions: ProgramDayOption[];
  defaultPhase: string;
  lastEntry: LogEntry | null;
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
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [dayLabelTouched, setDayLabelTouched] = useState(false);

  const boundLogSession = logSession.bind(null, clientId);
  const boundAddHabit = addHabitForClient.bind(null, clientId);
  const boundAddMilestone = addMilestone.bind(null, clientId);

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

  function applyLastEntry() {
    if (!lastEntry?.session) return;
    setSessionType("program");
    setActiveDayKey(null);
    setDayLabel(lastEntry.session.day_label);
    setDayLabelTouched(true);
    const filled = lastEntry.session.entries.map((e) => ({
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
      {lastEntry ? (
        <Card className="space-y-2 border-rose/30 bg-rose/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              Last time{" "}
              <span className="ml-1">
                <Badge tone={LOG_ENTRY_KIND_TONE[lastEntry.kind]}>
                  {LOG_ENTRY_KIND_LABEL[lastEntry.kind]}
                </Badge>
              </span>
            </p>
            <p className="text-sm text-gray">{lastEntry.date}</p>
          </div>
          <p className="text-sm font-medium text-ink">
            {lastEntry.session ? lastEntry.session.day_label : lastEntry.activity!.type}
          </p>
          {lastEntry.session && lastEntry.session.entries.length > 0 ? (
            <ul className="space-y-0.5 text-sm text-gray">
              {lastEntry.session.entries.map((e, i) => (
                <li key={i}>
                  {e.exercise}
                  {e.sets || e.reps ? ` — ${e.sets}x${e.reps}` : ""}
                  {e.weight ? ` @ ${e.weight}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {lastEntry.session?.day_notes ? (
            <p className="text-sm text-ink">{lastEntry.session.day_notes}</p>
          ) : null}
          {lastEntry.activity?.notes ? (
            <p className="text-sm text-ink">{lastEntry.activity.notes}</p>
          ) : null}
          {lastEntry.session?.coach_notes || lastEntry.activity?.coach_notes ? (
            <p className="rounded-lg bg-white px-2 py-1.5 text-sm text-ink">
              <span className="font-medium">Your note: </span>
              {lastEntry.session?.coach_notes ?? lastEntry.activity?.coach_notes}
            </p>
          ) : null}
          {lastEntry.session && lastEntry.session.entries.length > 0 ? (
            <Button type="button" variant="secondary" onClick={applyLastEntry}>
              Use as starting point
            </Button>
          ) : null}
        </Card>
      ) : null}

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
            <label className="mb-1 block text-sm font-medium text-ink">
              Payment{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Select name="payment_status" defaultValue="">
              <option value="">— Not recorded —</option>
              <option value="paid">Paid this session</option>
              <option value="unpaid">Not paid this session</option>
              <option value="waived">Waived (free session)</option>
            </Select>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              Body map{" "}
              <span className="font-normal text-gray">(optional)</span>
            </p>
            <BodyMapInput name="body_map" />
          </div>

          <Checkbox
            name="coached"
            label="This was a session I ran"
            defaultChecked
          />
          <p className="-mt-2 text-xs text-gray">
            Uncheck this if you&apos;re recording something they did on
            their own instead — it&apos;ll show as a solo workout, not a
            coached session.
          </p>

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

      <Card className="space-y-2">
        <p className="text-sm font-medium text-ink">Add a milestone</p>
        <p className="text-xs text-gray">
          Something worth marking as a goal, based on what came up just now.
        </p>
        <form
          action={async (formData: FormData) => {
            await boundAddMilestone(formData);
            setMilestoneTitle("");
          }}
          className="space-y-2"
        >
          <Input
            name="title"
            placeholder="e.g. First unassisted pull-up"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input name="target_date" type="date" />
            <Button type="submit" variant="secondary">
              Add milestone
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
