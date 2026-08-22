import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { getCurrentPhase } from "@/lib/phase";
import { logMyWorkout, setProgramExerciseSwap } from "@/app/client/actions";
import {
  Button,
  Card,
  Collapsible,
  EmptyState,
  Input,
  PhaseBanner,
  Textarea,
} from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { toDateString } from "@/lib/timezone";

interface ProgramDayJoinRow {
  id: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    id: string;
    position: number;
    sets: string | null;
    reps: string | null;
    superset_group: string | null;
    exercise_id: string;
    exercises: {
      id: string;
      name: string;
      client_description: string | null;
      regress_to_id: string | null;
      progress_to_id: string | null;
    } | null;
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
            "id, day_number, day_label, program_day_exercises(id, position, sets, reps, superset_group, exercise_id, exercises(id, name, client_description, regress_to_id, progress_to_id))"
          )
          .eq("care_profile_id", me.care_profile_id)
          .eq("phase", currentPhase.phase)
          .order("day_number")) as unknown as {
          data: ProgramDayJoinRow[] | null;
        })
      : { data: null };

  const programDays = days ?? [];
  const allPdeIds = programDays.flatMap((d) =>
    d.program_day_exercises.map((pde) => pde.id)
  );

  const { data: overrides } = allPdeIds.length
    ? await supabase
        .from("client_program_overrides")
        .select("program_day_exercise_id, substitute_exercise_id")
        .eq("client_id", me.id)
        .eq("active", true)
        .in("program_day_exercise_id", allPdeIds)
    : { data: [] as { program_day_exercise_id: string; substitute_exercise_id: string | null }[] };

  const overrideByPdeId = new Map(
    (overrides ?? []).map((o) => [o.program_day_exercise_id, o.substitute_exercise_id])
  );

  // regress_to/progress_to/substitute exercises aren't included in the
  // main join (they're a self-reference on `exercises`), so fetch their
  // names + descriptions separately and look them up by id.
  const extraIds = new Set<string>();
  for (const day of programDays) {
    for (const pde of day.program_day_exercises) {
      if (pde.exercises?.regress_to_id) extraIds.add(pde.exercises.regress_to_id);
      if (pde.exercises?.progress_to_id) extraIds.add(pde.exercises.progress_to_id);
      const sub = overrideByPdeId.get(pde.id);
      if (sub) extraIds.add(sub);
    }
  }
  const { data: extraExercises } = extraIds.size
    ? await supabase
        .from("exercises")
        .select("id, name, client_description")
        .in("id", [...extraIds])
    : { data: [] as { id: string; name: string; client_description: string | null }[] };
  const extraById = new Map((extraExercises ?? []).map((e) => [e.id, e]));

  const today = toDateString(new Date());

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
          {programDays.map((day) => {
            const sortedExercises = day.program_day_exercises
              .slice()
              .sort((a, b) => a.position - b.position);

            return (
              <Card key={day.id}>
                <p className="font-medium text-ink">
                  Day {day.day_number}: {day.day_label}
                </p>
                <div className="mt-3 space-y-4">
                  {sortedExercises.map((pde) => {
                    const base = pde.exercises;
                    const substituteId = overrideByPdeId.get(pde.id) ?? null;
                    const substitute = substituteId
                      ? extraById.get(substituteId)
                      : null;
                    const effective = substitute ?? base;
                    const regress = base?.regress_to_id
                      ? extraById.get(base.regress_to_id)
                      : null;
                    const progress = base?.progress_to_id
                      ? extraById.get(base.progress_to_id)
                      : null;

                    return (
                      <div
                        key={pde.id}
                        className="border-t border-grayLt pt-3 first:border-t-0 first:pt-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {effective?.name}
                            </p>
                            {substitute ? (
                              <p className="text-xs text-gray">
                                Swapped from {base?.name}
                              </p>
                            ) : null}
                          </div>
                          <p className="whitespace-nowrap text-sm text-gray">
                            {pde.sets}×{pde.reps}
                            {pde.superset_group
                              ? ` · ${pde.superset_group}`
                              : ""}
                          </p>
                        </div>

                        {effective?.client_description ? (
                          <Collapsible
                            label="About this movement"
                            className="mt-1"
                          >
                            <p className="whitespace-pre-wrap text-sm text-gray">
                              {effective.client_description}
                            </p>
                          </Collapsible>
                        ) : null}

                        {substitute ? (
                          <form
                            action={async () => {
                              "use server";
                              await setProgramExerciseSwap(pde.id, null);
                            }}
                            className="mt-2"
                          >
                            <Button type="submit" variant="secondary">
                              Back to prescribed: {base?.name}
                            </Button>
                          </form>
                        ) : regress || progress ? (
                          <Collapsible label="Swap this movement" className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {regress ? (
                                <form
                                  action={async () => {
                                    "use server";
                                    await setProgramExerciseSwap(
                                      pde.id,
                                      regress.id
                                    );
                                  }}
                                >
                                  <Button type="submit" variant="secondary">
                                    Easier: {regress.name}
                                  </Button>
                                </form>
                              ) : null}
                              {progress ? (
                                <form
                                  action={async () => {
                                    "use server";
                                    await setProgramExerciseSwap(
                                      pde.id,
                                      progress.id
                                    );
                                  }}
                                >
                                  <Button type="submit" variant="secondary">
                                    Harder: {progress.name}
                                  </Button>
                                </form>
                              ) : null}
                            </div>
                          </Collapsible>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <Collapsible label="Log this workout" className="mt-4 border-t border-grayLt pt-3">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await logMyWorkout(day.id, formData);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Date
                      </label>
                      <Input name="date" type="date" required defaultValue={today} />
                    </div>

                    {sortedExercises.map((pde) => {
                      const substituteId = overrideByPdeId.get(pde.id) ?? null;
                      const substitute = substituteId
                        ? extraById.get(substituteId)
                        : null;
                      const effective = substitute ?? pde.exercises;
                      return (
                        <div key={pde.id} className="space-y-2">
                          <p className="text-sm font-medium text-ink">
                            {effective?.name}{" "}
                            <span className="font-normal text-gray">
                              ({pde.sets}×{pde.reps})
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              name={`weight_${pde.id}`}
                              placeholder="Weight used"
                            />
                            <Input
                              name={`notes_${pde.id}`}
                              placeholder="Notes (optional)"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Anything else about how this session felt?
                      </label>
                      <Textarea name="day_notes" rows={2} />
                    </div>

                    <Button type="submit" className="w-full">
                      Log this workout
                    </Button>
                  </form>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
