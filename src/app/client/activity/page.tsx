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
        Activity log
      </h1>
      <p className="text-sm text-gray">
        A class, a walk, a workout with friends — anything active that
        wasn&apos;t one of your prescribed program days. Log a prescribed
        workout from{" "}
        <a href="/client/program" className="text-rose hover:underline">
          My program
        </a>{" "}
        instead, so it counts toward that.
      </p>

      <Card>
        <form action={logActivity} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Type
            </label>
            <Select name="type" required defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Duration{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input name="duration" placeholder="e.g. 30 min" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="notes" rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Photo{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
            />
          </div>
          <Button type="submit">Save activity</Button>
        </form>
      </Card>

      {!activities || activities.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          body="Once you log an activity above, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{a.type}</p>
                <p className="text-sm text-gray">{a.date}</p>
              </div>
              {a.duration ? (
                <p className="mt-1 text-sm text-gray">{a.duration}</p>
              ) : null}
              {a.photo_path && photoUrlByPath.has(a.photo_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrlByPath.get(a.photo_path)}
                  alt="Activity photo"
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
