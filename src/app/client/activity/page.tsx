import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { logActivity, logFreestyleWorkout } from "@/app/client/actions";
import {
  Button,
  Card,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { WeightInput } from "@/components/weight-input";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { toDateString } from "@/lib/timezone";
import { makeT } from "@/lib/i18n";
import type { Activity } from "@/lib/types";

const FREESTYLE_ROWS = 8;

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

      <div>
        <h2 className="text-lg font-semibold text-ink">
          {t("Log a workout (sets, reps, weight)")}
        </h2>
        <p className="mt-1 text-sm text-gray">
          {t("Track your own sets, reps, and weight for a workout you did on your own — no prescribed program needed, just fill in what you did.")}
        </p>
      </div>

      <Card>
        <form action={logFreestyleWorkout} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Date")}
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Workout name")}{" "}
              <span className="font-normal text-gray">{t("(optional)")}</span>
            </label>
            <Input name="day_label" placeholder={t("e.g. Leg day")} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              {t("Exercises")}
            </label>
            <div className="space-y-2">
              {Array.from({ length: FREESTYLE_ROWS }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input
                    name="exercise"
                    placeholder={t("Exercise")}
                    className="col-span-5"
                  />
                  <Input name="sets" placeholder={t("Sets")} className="col-span-2" />
                  <Input name="reps" placeholder={t("Reps")} className="col-span-2" />
                  <div className="col-span-3">
                    <WeightInput name="weight" placeholder={t("Weight")} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray">
              {t("Leave a row blank to skip it.")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Notes")}
            </label>
            <Textarea name="day_notes" rows={3} />
          </div>
          <Button type="submit">{t("Save workout")}</Button>
        </form>
      </Card>
      <p className="text-sm text-gray">
        {t("Logged workouts show up in")}{" "}
        <a href="/client/history" className="text-rose hover:underline">
          {t("Past workouts")}
        </a>{" "}
        {t("and feed your strength trends on")}{" "}
        <a href="/client/progress" className="text-rose hover:underline">
          {t("Progress")}
        </a>
        .
      </p>

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
