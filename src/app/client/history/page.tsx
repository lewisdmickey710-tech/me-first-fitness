import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { deleteMyLoggedSession } from "@/app/client/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Badge, Card, Collapsible, EmptyState, Heart } from "@/components/ui";
import { gbtcCoverage } from "@/lib/payment-status";
import {
  LOG_ENTRY_KIND_LABEL,
  LOG_ENTRY_KIND_TONE,
  mergeLogEntries,
} from "@/lib/log-entries";
import { makeT } from "@/lib/i18n";
import { NUTRITION_SESSION_FIELDS } from "@/lib/nutrition-session";
import { ItemReplyDisplay } from "@/components/item-reply-display";
import type { Activity, CoachItemReply, TrainingSession } from "@/lib/types";

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

  const t = makeT(me.language);
  const supabase = await createClient();

  const [{ data: sessions }, { data: activities }] = await Promise.all([
    supabase
      .from("sessions")
      // coach_notes is deliberately excluded -- coach's-eyes-only.
      .select(
        "id, client_id, day_label, date, entries, rating, day_notes, logged_by, session_type, body_map, payment_status, nutrition_details, coached, created_at"
      )
      .eq("client_id", me.id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: TrainingSession[] | null;
    }>,
    supabase
      .from("activities")
      // coach_notes is deliberately excluded -- coach's-eyes-only.
      .select(
        "id, client_id, date, type, duration, notes, logged_by, photo_path, entries, created_at"
      )
      .eq("client_id", me.id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: Activity[] | null;
    }>,
  ]);

  const { data: itemReplies } = (await supabase
    .from("coach_item_replies")
    .select("*")
    .eq("client_id", me.id)
    .eq("item_type", "activity")) as { data: CoachItemReply[] | null };
  const replyByItemKey = new Map(
    (itemReplies ?? []).map((r) => [`${r.item_type}:${r.item_id}`, r])
  );

  const entries = mergeLogEntries(sessions ?? [], activities ?? []);

  // A session entry logged against a matched exercise from the library
  // (picked from the autocomplete while logging, in a program day or a
  // freestyle workout alike) carries exercise_id -- resolve those here so
  // the client can see the same description/demo they'd see on their
  // program page, even looking back at a one-off freestyle session.
  const exerciseIds = [
    ...new Set(
      (sessions ?? []).flatMap((s) =>
        s.entries.map((e) => e.exercise_id).filter((id): id is string => !!id)
      )
    ),
  ];
  const { data: exercises } = exerciseIds.length
    ? await supabase
        .from("exercises")
        .select("id, name, client_description, video_url")
        .in("id", exerciseIds)
    : {
        data: [] as {
          id: string;
          name: string;
          client_description: string | null;
          video_url: string | null;
        }[],
      };
  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]));

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
        {t("Past workouts")}
      </h1>
      <p className="text-sm text-gray">
        {t("Everything you've logged, most recent first.")}
      </p>

      <div className="flex flex-wrap gap-3 text-xs text-gray">
        {(["coached", "solo", "activity"] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1">
            <Badge tone={LOG_ENTRY_KIND_TONE[kind]}>{t(LOG_ENTRY_KIND_LABEL[kind])}</Badge>
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title={t("Nothing logged yet")}
          body={t("Once you log a workout from My program, or an activity from Activity log, it'll show up here.")}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const s = entry.session;
            const a = entry.activity;
            const coverage = s ? gbtcCoverage(me, s) : { covered: false, value: null };
            return (
              <Card key={`${entry.kind === "activity" ? "a" : "s"}-${entry.id}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{s ? s.day_label : t(a!.type)}</p>
                    <Badge tone={LOG_ENTRY_KIND_TONE[entry.kind]}>
                      {t(LOG_ENTRY_KIND_LABEL[entry.kind])}
                    </Badge>
                    {entry.loggedBy === "coach" ? (
                      <Badge tone="gray">{t("logged by your coach")}</Badge>
                    ) : null}
                    {coverage.covered ? (
                      <Badge tone="gold">
                        {coverage.value
                          ? t("💛 ${amount} value — covered through Give Back To Community", {
                              amount: coverage.value.toFixed(2),
                            })
                          : t("💛 Covered through Give Back To Community")}
                      </Badge>
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
                    {s.entries.map((e, i) => {
                      const matched = e.exercise_id ? exerciseById.get(e.exercise_id) : null;
                      return (
                        <li key={i}>
                          {e.exercise} — {e.sets}x{e.reps}
                          {e.weight ? ` @ ${e.weight}` : ""}
                          {e.substitute_exercise_id ? (
                            <span className="text-xs text-rose">
                              {" "}
                              {t("(swapped from {name})", {
                                name: e.prescribed_exercise || t("prescribed movement"),
                              })}
                            </span>
                          ) : null}
                          {e.notes ? (
                            <span className="block text-xs text-gray/80">
                              {e.notes}
                            </span>
                          ) : null}
                          {matched?.client_description ? (
                            <Collapsible label={t("About this movement")}>
                              <p className="whitespace-pre-wrap text-sm text-gray">
                                {matched.client_description}
                              </p>
                            </Collapsible>
                          ) : null}
                          {matched?.video_url ? (
                            <a
                              href={matched.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-sm font-medium text-rose hover:underline"
                            >
                              {t("▶ Watch demo")}
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {s?.day_notes ? (
                  <p className="text-sm text-ink">{s.day_notes}</p>
                ) : null}
                {s?.nutrition_details ? (
                  <dl className="space-y-1.5 rounded-lg bg-cream/50 p-2.5 text-sm">
                    {NUTRITION_SESSION_FIELDS.filter(
                      (f) => s.nutrition_details![f.key]
                    ).map((f) => (
                      <div key={f.key}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-gray/70">
                          {t(f.label)}
                        </dt>
                        <dd className="text-ink">{s.nutrition_details![f.key]}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {a?.duration ? <p className="text-sm text-gray">{a.duration}</p> : null}
                {a?.photo_path && photoUrlByPath.has(a.photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlByPath.get(a.photo_path)}
                    alt={t("Activity photo")}
                    className="max-h-64 w-full rounded-xl object-cover"
                  />
                ) : null}
                {a?.notes ? <p className="text-sm text-ink">{a.notes}</p> : null}
                {a ? (
                  <ItemReplyDisplay
                    emoji={replyByItemKey.get(`activity:${entry.id}`)?.emoji ?? null}
                    note={replyByItemKey.get(`activity:${entry.id}`)?.note ?? null}
                    locale={me.language}
                  />
                ) : null}
                {s && entry.loggedBy === "client" ? (
                  <form
                    action={async () => {
                      "use server";
                      await deleteMyLoggedSession(s.id);
                    }}
                  >
                    <ConfirmButton
                      variant="ghost"
                      confirmText={t("Delete this logged workout? This can't be undone.")}
                      className="text-xs text-gray hover:text-pink"
                    >
                      {t("Delete")}
                    </ConfirmButton>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
