import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Card, EmptyState, Heart } from "@/components/ui";
import { makeT } from "@/lib/i18n";
import type { ClientMilestone } from "@/lib/types";

export default async function ClientMilestonesPage() {
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
  const { data: milestones } = (await supabase
    .from("client_milestones")
    .select("*")
    .eq("client_id", me.id)
    .order("created_at", { ascending: false })) as {
    data: ClientMilestone[] | null;
  };

  const upcoming = (milestones ?? []).filter((m) => !m.achieved_at);
  const achieved = (milestones ?? []).filter((m) => m.achieved_at);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("Milestones")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Things to look forward to, and things we've already celebrated together.")}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          {t("To look forward to")}
        </p>
        {upcoming.length === 0 ? (
          <EmptyState
            title={t("Nothing set yet")}
            body={t("Your coach will add milestones here for you to work toward.")}
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <Card key={m.id}>
                <p className="font-medium text-ink">{m.title}</p>
                {m.target_date ? (
                  <p className="text-sm text-gray">{t("Target: {date}", { date: m.target_date })}</p>
                ) : null}
                {m.notes ? (
                  <p className="mt-1 text-sm text-gray">{m.notes}</p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      {achieved.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray">{t("Celebrated 🎉")}</p>
          <div className="space-y-2">
            {achieved.map((m) => (
              <Card key={m.id} className="border-gold/40 bg-gold/5">
                <p className="font-medium text-ink">🎉 {m.title}</p>
                <p className="text-sm text-gray">
                  {m.achieved_at
                    ? new Date(m.achieved_at).toLocaleDateString()
                    : ""}
                </p>
                {m.achieved_note ? (
                  <p className="mt-1 text-sm text-ink">{m.achieved_note}</p>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
