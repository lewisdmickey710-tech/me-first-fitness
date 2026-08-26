import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import {
  LOG_ENTRY_KIND_LABEL,
  LOG_ENTRY_KIND_TONE,
  mergeLogEntries,
} from "@/lib/log-entries";
import type { Activity, TrainingSession } from "@/lib/types";

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

  const [{ data: sessions }, { data: activities }] = await Promise.all([
    supabase
      .from("sessions")
      // coach_notes is deliberately excluded -- coach's-eyes-only.
      .select(
        "id, client_id, day_label, date, entries, rating, day_notes, logged_by, session_type, body_map, payment_status, coached, created_at"
      )
      .eq("client_id", me.id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: TrainingSession[] | null;
    }>,
    supabase
      .from("activities")
      // coach_notes is deliberately excluded -- coach's-eyes-only.
      .select(
        "id, client_id, date, type, duration, notes, logged_by, photo_path, created_at"
      )
      .eq("client_id", me.id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: Activity[] | null;
    }>,
  ]);

  const entries = mergeLogEntries(sessions ?? [], activities ?? []);

  const photoUrlByPath = new Map<string, string>();
  const photoPaths = [
    ...new Set((activities ?? []).map((a) => a.photo_path).filter(Boolean)),
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
      <BackLink href="/client/program" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Past workouts
      </h1>
      <p className="text-sm text-gray">
        Everything you&apos;ve logged, most recent first.
      </p>

      <div className="flex flex-wrap gap-3 text-xs text-gray">
        {(["coached", "solo", "activity"] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1">
            <Badge tone={LOG_ENTRY_KIND_TONE[kind]}>{LOG_ENTRY_KIND_LABEL[kind]}</Badge>
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          body="Once you log a workout from My program, or an activity from Activity log, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const s = entry.session;
            const a = entry.activity;
            return (
              <Card key={`${entry.kind === "activity" ? "a" : "s"}-${entry.id}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{s ? s.day_label : a!.type}</p>
                    <Badge tone={LOG_ENTRY_KIND_TONE[entry.kind]}>
                      {LOG_ENTRY_KIND_LABEL[entry.kind]}
                    </Badge>
                    {entry.loggedBy === "coach" ? (
                      <Badge tone="gray">logged by your coach</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray">{entry.date}</p>
                </div>
                {s?.rating ? (
                  <p className="text-sm text-gold">
                    {"★".repeat(s.rating)}
                    {"☆".repeat(5 - s.rating)}
                  </p>
                ) : null}
                {s && s.entries.length > 0 ? (
                  <ul className="space-y-1 text-sm text-gray">
                    {s.entries.map((e, i) => (
                      <li key={i}>
                        {e.exercise} — {e.sets}x{e.reps}
                        {e.weight ? ` @ ${e.weight}` : ""}
                        {e.substitute_exercise_id ? (
                          <span className="text-xs text-rose">
                            {" "}
                            (swapped from {e.prescribed_exercise || "prescribed movement"})
                          </span>
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
                {s?.day_notes ? (
                  <p className="text-sm text-ink">{s.day_notes}</p>
                ) : null}
                {a?.duration ? <p className="text-sm text-gray">{a.duration}</p> : null}
                {a?.photo_path && photoUrlByPath.has(a.photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlByPath.get(a.photo_path)}
                    alt="Activity photo"
                    className="max-h-64 w-full rounded-xl object-cover"
                  />
                ) : null}
                {a?.notes ? <p className="text-sm text-ink">{a.notes}</p> : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
