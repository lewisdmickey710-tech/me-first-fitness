import { Fragment } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import {
  addHabit,
  addNutritionLog,
  addSymptomLog,
  deleteHabit,
  deleteNutritionLog,
  deleteSymptomLog,
  toggleHabitLog,
} from "@/app/client/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type {
  ClientHabit,
  ClientHabitLog,
  ClientNutritionLog,
  ClientSymptomLog,
} from "@/lib/types";

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export default async function ClientTrackerPage() {
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
  const now = nowInBusinessTz();
  const todayStr = toDateString(now);

  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    last7Days.push(toDateString(d));
  }

  const [
    { data: habits },
    { data: habitLogs },
    { data: symptomLogs },
    { data: nutritionLogs },
  ] = await Promise.all([
    supabase
      .from("client_habits")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true)
      .order("created_at") as unknown as Promise<{ data: ClientHabit[] | null }>,
    supabase
      .from("client_habit_logs")
      .select("*")
      .eq("client_id", me.id)
      .gte("log_date", last7Days[0]) as unknown as Promise<{
      data: ClientHabitLog[] | null;
    }>,
    supabase
      .from("client_symptom_logs")
      .select("*")
      .eq("client_id", me.id)
      .order("log_date", { ascending: false })
      .limit(20) as unknown as Promise<{ data: ClientSymptomLog[] | null }>,
    supabase
      .from("client_nutrition_logs")
      .select("*")
      .eq("client_id", me.id)
      .order("log_date", { ascending: false })
      .limit(20) as unknown as Promise<{ data: ClientNutritionLog[] | null }>,
  ]);

  const loggedByHabitAndDate = new Set(
    (habitLogs ?? []).map((l) => `${l.habit_id}:${l.log_date}`)
  );

  return (
    <div className="space-y-6">
      <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          My tracker
        </h1>
        <p className="mt-1 text-sm text-gray">
          Optional tools just for you — track whatever&apos;s useful, skip
          whatever&apos;s not.
        </p>
      </div>

      {/* Habits */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-rose">Habits</h2>

        {(habits ?? []).length === 0 ? (
          <EmptyState
            title="No habits yet"
            body="Add something you want to build consistency on — a stretch, a med, a walk, anything."
          />
        ) : (
          <Card className="space-y-3">
            <div className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-x-1 gap-y-2 text-xs text-gray">
              <div />
              {last7Days.map((d) => {
                const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
                return (
                  <div
                    key={d}
                    className={`text-center ${d === todayStr ? "font-semibold text-rose" : ""}`}
                  >
                    {WEEKDAY_SHORT[dow]}
                  </div>
                );
              })}
              {(habits ?? []).map((habit) => (
                <Fragment key={habit.id}>
                  <div className="flex items-center justify-between gap-2 pr-1">
                    <span className="truncate text-sm text-ink">{habit.name}</span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteHabit(habit.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="shrink-0 text-xs text-gray hover:text-pink"
                        aria-label={`Delete ${habit.name}`}
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                  {last7Days.map((d) => {
                    const done = loggedByHabitAndDate.has(`${habit.id}:${d}`);
                    return (
                      <form
                        key={`${habit.id}-${d}`}
                        action={async () => {
                          "use server";
                          await toggleHabitLog(habit.id, d);
                        }}
                        className="flex justify-center"
                      >
                        <button
                          type="submit"
                          className={`h-6 w-6 rounded-full border text-xs transition ${
                            done
                              ? "border-rose bg-rose text-white"
                              : "border-grayLt bg-white text-transparent hover:border-rose/40"
                          }`}
                        >
                          ✓
                        </button>
                      </form>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <form
            action={async (formData: FormData) => {
              "use server";
              await addHabit(String(formData.get("name") ?? ""));
            }}
            className="flex gap-2"
          >
            <Input name="name" placeholder="New habit (e.g. stretch before bed)" />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </Card>
      </div>

      {/* Symptoms */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-rose">Symptom log</h2>
        <p className="text-sm text-gray">
          A private place to keep track of anything you might want to bring
          up with a doctor or physical therapist. Sharing with your coach is
          entirely up to you, entry by entry.
        </p>

        <Card>
          <form action={addSymptomLog} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Date
                </label>
                <Input name="log_date" type="date" required defaultValue={todayStr} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Severity
                </label>
                <Select name="severity" defaultValue="">
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Symptom
              </label>
              <Input name="symptom" required placeholder="e.g. Right knee ache" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Notes
              </label>
              <Textarea name="notes" rows={2} placeholder="Optional — when it happens, what helps, etc." />
            </div>
            <Checkbox name="shared_with_coach" label="Share this entry with my coach" />
            <Button type="submit">Save entry</Button>
          </form>
        </Card>

        {(symptomLogs ?? []).length > 0 ? (
          <div className="space-y-2">
            {symptomLogs!.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">
                    {s.symptom}
                    {s.severity ? (
                      <span className="ml-2 text-sm text-gray">
                        severity {s.severity}/5
                      </span>
                    ) : null}
                  </p>
                  <div className="flex items-center gap-2">
                    {s.shared_with_coach ? (
                      <Badge tone="teal">shared with coach</Badge>
                    ) : null}
                    <form
                      action={async () => {
                        "use server";
                        await deleteSymptomLog(s.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-gray hover:text-pink"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray">{s.log_date}</p>
                {s.notes ? (
                  <p className="mt-1 text-sm text-ink">{s.notes}</p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Nutrition */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-rose">Nutrition log</h2>
        <p className="text-sm text-gray">
          Use whatever style fits you — hunger/fullness and satisfaction
          notes, numbers, or both. Nothing here is required.
        </p>

        <Card>
          <form action={addNutritionLog} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Date
                </label>
                <Input name="log_date" type="date" required defaultValue={todayStr} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Meal
                </label>
                <Input name="meal_label" placeholder="e.g. Lunch" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                What did you eat?
              </label>
              <Textarea name="description" rows={2} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Hunger before (1–10)
                </label>
                <Input name="hunger_before" type="number" min={1} max={10} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Fullness after (1–10)
                </label>
                <Input name="fullness_after" type="number" min={1} max={10} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Satisfaction (1–5)
                </label>
                <Input name="satisfaction" type="number" min={1} max={5} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Calories
                </label>
                <Input name="calories" type="number" min={0} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Protein (g)
                </label>
                <Input name="protein_g" type="number" min={0} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Carbs (g)
                </label>
                <Input name="carbs_g" type="number" min={0} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Fat (g)
              </label>
              <Input name="fat_g" type="number" min={0} className="max-w-[8rem]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Notes
              </label>
              <Textarea name="notes" rows={2} placeholder="Optional" />
            </div>
            <Button type="submit">Save entry</Button>
          </form>
        </Card>

        {(nutritionLogs ?? []).length > 0 ? (
          <div className="space-y-2">
            {nutritionLogs!.map((n) => (
              <Card key={n.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">
                    {n.log_date}
                    {n.meal_label ? ` · ${n.meal_label}` : ""}
                  </p>
                  <form
                    action={async () => {
                      "use server";
                      await deleteNutritionLog(n.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-gray hover:text-pink"
                    >
                      Delete
                    </button>
                  </form>
                </div>
                {n.description ? (
                  <p className="mt-1 text-sm text-ink">{n.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-gray">
                  {[
                    n.hunger_before ? `hunger ${n.hunger_before}/10` : null,
                    n.fullness_after ? `fullness ${n.fullness_after}/10` : null,
                    n.satisfaction ? `satisfaction ${n.satisfaction}/5` : null,
                    n.calories ? `${n.calories} cal` : null,
                    n.protein_g ? `${n.protein_g}g protein` : null,
                    n.carbs_g ? `${n.carbs_g}g carbs` : null,
                    n.fat_g ? `${n.fat_g}g fat` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {n.notes ? (
                  <p className="mt-1 text-sm text-gray">{n.notes}</p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
