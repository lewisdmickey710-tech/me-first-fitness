import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { logActivity } from "@/app/client/actions";
import {
  Button,
  Card,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { toDateString } from "@/lib/timezone";
import { makeT } from "@/lib/i18n";
import type { Activity } from "@/lib/types";

export default async function ClientActivityPage() {
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

  const { data: activities } = (await supabase
    .from("activities")
    // coach_notes is deliberately excluded -- coach's-eyes-only.
    .select(
      "id, client_id, date, type, duration, notes, logged_by, photo_path, created_at"
    )
    .eq("client_id", me.id)
    .order("date", { ascending: false })) as { data: Activity[] | null };

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

  const today = toDateString(new Date());

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Activity log")}
      </h1>
      <p className="text-sm text-gray">
        {t("A class, a walk, a workout with friends — anything active that wasn't one of your prescribed program days. Log a prescribed workout from")}{" "}
        <a href="/client/program" className="text-rose hover:underline">
          {t("My program")}
        </a>{" "}
        {t("instead, so it counts toward that.")}
      </p>

      <Card>
        <form action={logActivity} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Date")}
            </label>
            <Input name="date" type="date" required defaultValue={today} />
            <p className="mt-1 text-xs text-gray">
              {t("Forgot to log it the same day? Change the date to when it actually happened — logging it late is totally fine.")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Type")}
            </label>
            <Select name="type" required defaultValue="">
              <option value="" disabled>
                {t("Choose one")}
              </option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Duration")}{" "}
              <span className="font-normal text-gray">{t("(optional)")}</span>
            </label>
            <Input name="duration" placeholder={t("e.g. 30 min")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Notes")}
            </label>
            <Textarea name="notes" rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Photo")}{" "}
              <span className="font-normal text-gray">{t("(optional)")}</span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
            />
          </div>
          <Button type="submit">{t("Save activity")}</Button>
        </form>
      </Card>

      {!activities || activities.length === 0 ? (
        <EmptyState
          title={t("Nothing logged yet")}
          body={t("Once you log an activity above, it'll show up here.")}
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{t(a.type)}</p>
                <p className="text-sm text-gray">{a.date}</p>
              </div>
              {a.duration ? (
                <p className="mt-1 text-sm text-gray">{a.duration}</p>
              ) : null}
              {a.photo_path && photoUrlByPath.has(a.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrlByPath.get(a.photo_path)}
                  alt={t("Activity photo")}
                  className="mt-2 max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
              {a.notes ? (
                <p className="mt-1 text-sm text-ink">{a.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
