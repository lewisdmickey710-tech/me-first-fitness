import { BackLink } from "@/components/back-link";
import { getMyClient } from "@/lib/current-client";
import { logCheckin } from "@/app/client/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";
import { makeT } from "@/lib/i18n";

export default async function ClientCheckinPage() {
  const me = await getMyClient();
  const t = makeT(me?.language);
  const today = new Date().toISOString().slice(0, 10);

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
    </div>
  );
}
