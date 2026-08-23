import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import type { TrainingSession } from "@/lib/types";

export default async function ClientHistoryPage() {
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

  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", me.id)
    .order("date", { ascending: false })) as { data: TrainingSession[] | null };

  return (
    <div className="space-y-6">
      <BackLink href="/client/program" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Past workouts
      </h1>
      <p className="text-sm text-gray">
        Everything you&apos;ve logged, most recent first.
      </p>

      {!sessions || sessions.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          body="Once you log a workout from My program, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{s.day_label}</p>
                <p className="text-sm text-gray">{s.date}</p>
              </div>
              {s.rating ? (
                <p className="text-sm text-gold">
                  {"★".repeat(s.rating)}
                  {"☆".repeat(5 - s.rating)}
                </p>
              ) : null}
              {s.entries.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray">
                  {s.entries.map((e, i) => (
                    <li key={i}>
                      {e.exercise} — {e.sets}x{e.reps}
                      {e.weight ? ` @ ${e.weight}` : ""}
                      {e.substitute_exercise_id ? (
                        <Badge tone="teal">swapped</Badge>
                      ) : null}
                      {e.notes ? (
                        <span className="block text-xs text-gray/80">
                          {e.notes}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.day_notes ? (
                <p className="text-sm text-ink">{s.day_notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
