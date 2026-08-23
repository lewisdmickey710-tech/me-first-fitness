import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "@/components/ui";
import { getCurrentPhase } from "@/lib/phase";
import type { Client } from "@/lib/types";
import { LogSessionForm, type ProgramDayOption } from "./LogSessionForm";

interface ProgramDayJoinRow {
  phase: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    position: number;
    sets: string | null;
    reps: string | null;
    exercises: { name: string } | null;
  }[];
}

export default async function LogSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };

  if (!client) notFound();

  const [{ data: days }, currentPhase] = await Promise.all([
    client.care_profile_id
      ? (supabase
          .from("program_days")
          .select("phase, day_number, day_label, program_day_exercises(position, sets, reps, exercises(name))")
          .eq("care_profile_id", client.care_profile_id)
          .order("phase")
          .order("day_number") as unknown as Promise<{
          data: ProgramDayJoinRow[] | null;
        }>)
      : Promise.resolve({ data: null }),
    getCurrentPhase(supabase, id),
  ]);

  const programDayOptions: ProgramDayOption[] = (days ?? []).map((d) => ({
    phase: d.phase,
    dayNumber: d.day_number,
    label: d.day_label,
    exercises: (d.program_day_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((pde) => ({
        exercise: pde.exercises?.name ?? "",
        sets: pde.sets ?? "",
        reps: pde.reps ?? "",
      }))
      .filter((e) => e.exercise),
  }));

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${id}?tab=sessions`}
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a session
      </h1>

      <LogSessionForm
        clientId={id}
        today={today}
        programDayOptions={programDayOptions}
        defaultPhase={currentPhase?.phase ?? "1"}
        paymentSchedule={client.payment_schedule}
      />
    </div>
  );
}
