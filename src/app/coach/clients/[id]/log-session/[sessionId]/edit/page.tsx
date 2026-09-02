import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { Card, Heart } from "@/components/ui";
import { getCurrentPhase } from "@/lib/phase";
import { formatReps } from "@/lib/constants";
import type { Client, TrainingSession } from "@/lib/types";
import { LogSessionForm, type ExistingSession, type ProgramDayOption } from "../../LogSessionForm";

interface ProgramDayJoinRow {
  phase: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    id: string;
    position: number;
    sets: string | null;
    reps: string | null;
    exercises: { name: string; laterality: string | null } | null;
  }[];
}

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  const supabase = await createClient();
  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };

  if (!client) notFound();

  const { data: session } = (await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("client_id", id)
    .single()) as { data: TrainingSession | null };

  // Only ever her own logged sessions are editable here -- a client's own
  // self-logged entry can carry per-entry fields (exercise swaps, entry
  // notes) this form doesn't round-trip, so it's delete-only, same as
  // before. The edit link is hidden for those; this is just the backstop
  // against someone hitting the URL directly.
  if (!session || session.logged_by !== "coach") notFound();

  const [{ data: days }, currentPhase] = await Promise.all([
    client.care_profile_id
      ? (supabase
          .from("program_days")
          .select("phase, day_number, day_label, program_day_exercises(id, position, sets, reps, exercises(name, laterality))")
          .eq("care_profile_id", client.care_profile_id)
          .order("phase")
          .order("day_number") as unknown as Promise<{
          data: ProgramDayJoinRow[] | null;
        }>)
      : Promise.resolve({ data: null }),
    getCurrentPhase(supabase, id),
  ]);

  const allPdeIds = (days ?? []).flatMap((d) =>
    d.program_day_exercises.map((pde) => pde.id)
  );
  const { data: overrides } = allPdeIds.length
    ? await supabase
        .from("client_program_overrides")
        .select(
          "program_day_exercise_id, substitute_exercise_id, sets_override, reps_override, removed, position_override"
        )
        .eq("client_id", id)
        .eq("active", true)
        .in("program_day_exercise_id", allPdeIds)
    : {
        data: [] as {
          program_day_exercise_id: string;
          substitute_exercise_id: string | null;
          sets_override: string | null;
          reps_override: string | null;
          removed: boolean;
          position_override: number | null;
        }[],
      };
  const overrideByPdeId = new Map((overrides ?? []).map((o) => [o.program_day_exercise_id, o]));

  const substituteIds = [...overrideByPdeId.values()]
    .map((o) => o.substitute_exercise_id)
    .filter((v): v is string => !!v);
  const { data: substituteExercises } = substituteIds.length
    ? await supabase
        .from("exercises")
        .select("id, name, laterality")
        .in("id", substituteIds)
    : { data: [] as { id: string; name: string; laterality: string | null }[] };
  const substituteById = new Map((substituteExercises ?? []).map((e) => [e.id, e]));

  const programDayOptions: ProgramDayOption[] = (days ?? []).map((d) => ({
    phase: d.phase,
    dayNumber: d.day_number,
    label: d.day_label,
    exercises: (d.program_day_exercises ?? [])
      .filter((pde) => !overrideByPdeId.get(pde.id)?.removed)
      .slice()
      .sort(
        (a, b) =>
          (overrideByPdeId.get(a.id)?.position_override ?? a.position) -
          (overrideByPdeId.get(b.id)?.position_override ?? b.position)
      )
      .map((pde) => {
        const override = overrideByPdeId.get(pde.id);
        const substitute = override?.substitute_exercise_id
          ? substituteById.get(override.substitute_exercise_id)
          : null;
        const effectiveLaterality = substitute?.laterality ?? pde.exercises?.laterality ?? null;
        return {
          exercise: substitute?.name ?? pde.exercises?.name ?? "",
          sets: override?.sets_override || pde.sets || "",
          reps: formatReps(override?.reps_override || pde.reps || "", effectiveLaterality),
        };
      })
      .filter((e) => e.exercise),
  }));

  const existingSession: ExistingSession = {
    id: session.id,
    day_label: session.day_label,
    date: session.date,
    session_type: session.session_type,
    entries: session.entries,
    rating: session.rating,
    day_notes: session.day_notes,
    payment_status: session.payment_status,
    body_map: session.body_map,
    coached: session.coached,
  };

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}?tab=log`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Edit session
      </h1>

      <Card className="border-gold/30 bg-gold/5">
        <p className="text-sm text-ink">
          Editing what you logged for <strong>{session.day_label}</strong> on{" "}
          {session.date}.
        </p>
      </Card>

      <LogSessionForm
        clientId={id}
        today={session.date}
        programDayOptions={programDayOptions}
        defaultPhase={currentPhase?.phase ?? "1"}
        lastEntry={null}
        existingSession={existingSession}
      />
    </div>
  );
}
