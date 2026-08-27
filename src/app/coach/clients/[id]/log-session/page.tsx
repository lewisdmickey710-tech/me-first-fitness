import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { Card, Heart } from "@/components/ui";
import { getCurrentPhase } from "@/lib/phase";
import { formatReps } from "@/lib/constants";
import { mergeLogEntries } from "@/lib/log-entries";
import type { Activity, Client, TrainingSession } from "@/lib/types";
import { LogSessionForm, type ProgramDayOption } from "./LogSessionForm";

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

export default async function LogSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;
  const today =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };

  if (!client) notFound();

  const { data: partner } = client.partner_client_id
    ? ((await supabase
        .from("clients")
        .select("id, name")
        .eq("id", client.partner_client_id)
        .single()) as { data: { id: string; name: string } | null })
    : { data: null };

  const [{ data: days }, currentPhase, { data: lastSessions }, { data: lastActivities }] =
    await Promise.all([
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
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", id)
        .order("date", { ascending: false })
        .limit(1) as unknown as Promise<{ data: TrainingSession[] | null }>,
      supabase
        .from("activities")
        .select("*")
        .eq("client_id", id)
        .order("date", { ascending: false })
        .limit(1) as unknown as Promise<{ data: Activity[] | null }>,
    ]);

  const lastEntry = mergeLogEntries(lastSessions ?? [], lastActivities ?? [])[0] ?? null;

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

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}?tab=log`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a session
      </h1>

      {partner ? (
        <Card className="border-teal/30 bg-teal/5">
          <p className="text-sm text-ink">
            Booked with <strong>{partner.name}</strong> — if they pay as one,
            mark payment on whichever of them actually paid and{" "}
            <strong>waived</strong> on the other.
          </p>
          <Link
            href={`/coach/clients/${partner.id}/log-session?date=${today}`}
            className="mt-2 inline-block text-sm font-medium text-rose hover:underline"
          >
            Log {partner.name}&apos;s session too →
          </Link>
        </Card>
      ) : null}

      <LogSessionForm
        clientId={id}
        today={today}
        programDayOptions={programDayOptions}
        defaultPhase={currentPhase?.phase ?? "1"}
        lastEntry={lastEntry}
      />
    </div>
  );
}
