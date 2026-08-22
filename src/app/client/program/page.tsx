import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { getCurrentPhase } from "@/lib/phase";
import {
  Card,
  Collapsible,
  EmptyState,
  PhaseBanner,
} from "@/components/ui";
import { phaseInfo } from "@/lib/constants";

interface ProgramDayJoinRow {
  id: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    position: number;
    sets: string | null;
    reps: string | null;
    superset_group: string | null;
    exercises: { name: string; client_description: string | null } | null;
  }[];
}

export default async function ClientProgramPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const supabase = await createClient();
  const currentPhase = await getCurrentPhase(supabase, me.id);

  const { data: days } =
    me.care_profile_id && currentPhase
      ? ((await supabase
          .from("program_days")
          .select(
            "id, day_number, day_label, program_day_exercises(position, sets, reps, superset_group, exercises(name, client_description))"
          )
          .eq("care_profile_id", me.care_profile_id)
          .eq("phase", currentPhase.phase)
          .order("day_number")) as unknown as {
          data: ProgramDayJoinRow[] | null;
        })
      : { data: null };

  const programDays = days ?? [];

  return (
    <div className="space-y-6">
      <PhaseBanner
        phase={currentPhase?.phase ?? "n/a"}
        title="Your program"
        subtitle={
          currentPhase ? phaseInfo(currentPhase.phase).name : undefined
        }
      />

      {programDays.length === 0 ? (
        <EmptyState
          title="No program assigned yet"
          body="Once your coach builds out your care profile's program, it'll show up here."
        />
      ) : (
        <div className="space-y-4">
          {programDays.map((day) => (
            <Card key={day.id}>
              <p className="font-medium text-ink">
                Day {day.day_number}: {day.day_label}
              </p>
              <div className="mt-3 space-y-3">
                {day.program_day_exercises
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((pde, i) => (
                    <div
                      key={i}
                      className="border-t border-grayLt pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-ink">
                          {pde.exercises?.name}
                        </p>
                        <p className="whitespace-nowrap text-sm text-gray">
                          {pde.sets}×{pde.reps}
                          {pde.superset_group
                            ? ` · ${pde.superset_group}`
                            : ""}
                        </p>
                      </div>
                      {pde.exercises?.client_description ? (
                        <Collapsible
                          label="About this movement"
                          className="mt-1"
                        >
                          <p className="whitespace-pre-wrap text-sm text-gray">
                            {pde.exercises.client_description}
                          </p>
                        </Collapsible>
                      ) : null}
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
