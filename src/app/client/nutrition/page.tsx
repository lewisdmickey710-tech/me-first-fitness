import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { addNutritionLog, deleteNutritionLog } from "@/app/client/actions";
import { Button, Card, EmptyState, Heart, Input, Textarea } from "@/components/ui";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type { ClientNutritionLog } from "@/lib/types";

export default async function ClientNutritionPage() {
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
  const todayStr = toDateString(nowInBusinessTz());

  const { data: nutritionLogs } = (await supabase
    .from("client_nutrition_logs")
    .select("*")
    .eq("client_id", me.id)
    .order("log_date", { ascending: false })
    .limit(20)) as { data: ClientNutritionLog[] | null };

  const photoUrlByPath = new Map<string, string>();
  const photoPaths = [
    ...new Set((nutritionLogs ?? []).map((n) => n.photo_path).filter(Boolean)),
  ] as string[];
  if (photoPaths.length > 0) {
    await Promise.all(
      photoPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from("form-checks")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) photoUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Nutrition log
        </h1>
        <p className="mt-1 text-sm text-gray">
          Use whatever style fits you — a quick photo, hunger/fullness and
          satisfaction notes, numbers, or any mix. Nothing here is
          required.
        </p>
      </div>

      {me.calorie_goal_enabled && me.daily_calorie_goal ? (
        <Card className="border-teal/40 bg-teal/5">
          <p className="text-sm text-gray">Your daily calorie goal</p>
          <p className="text-2xl font-semibold text-ink">
            {me.daily_calorie_goal} <span className="text-sm font-normal text-gray">cal</span>
          </p>
        </Card>
      ) : null}

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
              Photo{" "}
              <span className="font-normal text-gray">
                (easiest option — just snap it, no description needed)
              </span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
            />
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
              {n.photo_path && photoUrlByPath.has(n.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrlByPath.get(n.photo_path)}
                  alt="Food photo"
                  className="mt-2 max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
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
  );
}
