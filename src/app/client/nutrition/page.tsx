import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { deleteNutritionLog } from "@/app/client/actions";
import { Card, EmptyState, Heart } from "@/components/ui";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import { makeT } from "@/lib/i18n";
import type { ClientNutritionLog } from "@/lib/types";
import { NutritionLogForm } from "@/app/client/nutrition/NutritionLogForm";

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

  const t = makeT(me.language);
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
          {t("Nutrition log")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Use whatever style fits you — a quick photo, hunger/fullness and satisfaction notes, numbers, or any mix. Nothing here is required.")}
        </p>
      </div>

      {me.calorie_goal_enabled && me.daily_calorie_goal ? (
        <Card className="border-teal/40 bg-teal/5">
          <p className="text-sm text-gray">{t("Your daily calorie goal")}</p>
          <p className="text-2xl font-semibold text-ink">
            {me.daily_calorie_goal} <span className="text-sm font-normal text-gray">{t("cal")}</span>
          </p>
        </Card>
      ) : null}

      <NutritionLogForm clientId={me.id} todayStr={todayStr} t={t} />

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
                    {t("Delete")}
                  </button>
                </form>
              </div>
              {n.photo_path && photoUrlByPath.has(n.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrlByPath.get(n.photo_path)}
                  alt={t("Food photo")}
                  className="mt-2 max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
              {n.description ? (
                <p className="mt-1 text-sm text-ink">{n.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray">
                {[
                  n.hunger_before ? t("hunger {n}/10", { n: n.hunger_before }) : null,
                  n.fullness_after ? t("fullness {n}/10", { n: n.fullness_after }) : null,
                  n.satisfaction ? t("satisfaction {n}/5", { n: n.satisfaction }) : null,
                  n.calories ? t("{n} cal", { n: n.calories }) : null,
                  n.protein_g ? t("{n}g protein", { n: n.protein_g }) : null,
                  n.carbs_g ? t("{n}g carbs", { n: n.carbs_g }) : null,
                  n.fat_g ? t("{n}g fat", { n: n.fat_g }) : null,
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
