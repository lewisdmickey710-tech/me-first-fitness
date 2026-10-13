import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Card, EmptyState, Heart } from "@/components/ui";
import { makeT } from "@/lib/i18n";
import type { TrainingSession } from "@/lib/types";

export default async function MyWorkoutsPage() {
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
  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", me.id)
    .eq("session_type", "freestyle")
    .not("workout_name", "is", null)
    .order("date", { ascending: false })) as { data: TrainingSession[] | null };

  // One card per distinct name -- the most recent logging of it is what's
  // shown and what gets repeated, since that's the freshest version of the
  // workout (exercises/sets can change a little each time it's logged).
  const byName = new Map<string, { latest: TrainingSession; timesDone: number }>();
  for (const s of sessions ?? []) {
    const name = s.workout_name!;
    const existing = byName.get(name);
    if (existing) {
      existing.timesDone += 1;
    } else {
      byName.set(name, { latest: s, timesDone: 1 });
    }
  }
  const workouts = [...byName.values()];

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("My Workouts")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Freestyle workouts you and your coach built together -- repeat any of them on your own anytime.")}
        </p>
      </div>

      {workouts.length === 0 ? (
        <EmptyState
          title={t("Nothing here yet")}
          body={t("When your coach names a freestyle workout you've done together, it'll show up here to repeat.")}
        />
      ) : (
        <div className="space-y-2">
          {workouts.map(({ latest, timesDone }) => (
            <Card key={latest.workout_name} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{latest.workout_name}</p>
                <p className="shrink-0 text-xs text-gray">
                  {timesDone > 1
                    ? t("Done {n} times", { n: timesDone })
                    : t("Last done {date}", { date: latest.date })}
                </p>
              </div>
              {latest.entries.length > 0 ? (
                <ul className="space-y-0.5 text-sm text-gray">
                  {latest.entries.map((e, i) => (
                    <li key={i}>
                      {e.exercise}
                      {e.sets || e.reps ? ` — ${e.sets}x${e.reps}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={`/client/my-workouts/${latest.id}/repeat`}
                className="inline-block rounded-xl bg-rose px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                {t("Repeat this workout")}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
