import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { logCheckin } from "@/app/client/actions";
import { Badge, Button, Card, EmptyState, Heart, Input, Textarea } from "@/components/ui";
import { makeT } from "@/lib/i18n";
import type { Checkin } from "@/lib/types";

export default async function ClientCheckinPage() {
  const me = await getMyClient();
  const t = makeT(me?.language);
  const today = new Date().toISOString().slice(0, 10);

  let checkins: Checkin[] = [];
  if (me) {
    const supabase = await createClient();
    const { data } = (await supabase
      .from("checkins")
      .select("*")
      .eq("client_id", me.id)
      .order("date", { ascending: false })) as unknown as { data: Checkin[] | null };
    checkins = data ?? [];
  }

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Log a check-in")}
      </h1>

      <Card>
        <form action={logCheckin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Date")}
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Sleep")}
              </label>
              <Input name="sleep" placeholder={t("e.g. 7 hrs")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Water")}
              </label>
              <Input name="water" placeholder={t("e.g. 64 oz")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Food")}
              </label>
              <Input name="food" placeholder={t("On track / off track")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Energy")}
              </label>
              <Input name="energy" placeholder={t("e.g. Good")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                {t("Mood")}
              </label>
              <Input name="mood" placeholder={t("e.g. Steady")} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Anything else?")}
            </label>
            <Textarea name="notes" rows={3} placeholder={t("Totally optional")} />
          </div>

          <Button type="submit">{t("Save check-in")}</Button>
        </form>
      </Card>

      <h2 className="text-lg font-semibold text-ink">{t("Past check-ins")}</h2>

      {checkins.length === 0 ? (
        <EmptyState
          title={t("No check-ins yet")}
          body={t("Check-ins you or your coach log will show up here.")}
        />
      ) : (
        <div className="space-y-3">
          {checkins.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{c.date}</p>
                <Badge tone={c.logged_by === "coach" ? "rose" : "teal"}>
                  {c.logged_by === "coach" ? t("logged by your coach") : t("logged by you")}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray sm:grid-cols-3">
                {c.sleep ? <CheckinField label={t("Sleep")} value={c.sleep} /> : null}
                {c.water ? <CheckinField label={t("Water")} value={c.water} /> : null}
                {c.food ? <CheckinField label={t("Food")} value={c.food} /> : null}
                {c.energy ? <CheckinField label={t("Energy")} value={c.energy} /> : null}
                {c.mood ? <CheckinField label={t("Mood")} value={c.mood} /> : null}
              </dl>
              {c.notes ? <p className="mt-2 text-sm text-ink">{c.notes}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckinField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
