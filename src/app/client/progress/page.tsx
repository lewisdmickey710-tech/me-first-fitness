import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { addProgressPhoto, deleteProgressPhoto } from "@/app/client/actions";
import {
  Button,
  Card,
  DeltaField,
  EmptyState,
  Heart,
  Input,
  Select,
  Sparkline,
  Textarea,
} from "@/components/ui";
import type { ClientProgressPhoto, Measurement, TrainingSession } from "@/lib/types";

function parseWeight(raw: string): number | null {
  const match = raw.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

interface ExerciseTrend {
  name: string;
  points: { date: string; weight: number }[];
  pr: number;
  prDate: string;
}

export default async function ClientProgressPage() {
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
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: measurements }, { data: sessions }, { data: progressPhotos }] =
    await Promise.all([
      supabase
        .from("measurements")
        .select("*")
        .eq("client_id", me.id)
        .order("date", { ascending: false }) as unknown as Promise<{
        data: Measurement[] | null;
      }>,
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", me.id)
        .order("date", { ascending: true }) as unknown as Promise<{
        data: TrainingSession[] | null;
      }>,
      supabase
        .from("client_progress_photos")
        .select("*")
        .eq("client_id", me.id)
        .order("date", { ascending: false }) as unknown as Promise<{
        data: ClientProgressPhoto[] | null;
      }>,
    ]);

  const photoUrlByPath = new Map<string, string>();
  const photoPaths = [
    ...new Set((progressPhotos ?? []).map((p) => p.photo_path)),
  ];
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

  const allMeasurements = measurements ?? [];
  const weights = allMeasurements
    .slice()
    .reverse()
    .filter((m) => m.weight != null)
    .map((m) => m.weight as number);

  const CIRCUMFERENCE_FIELDS: { key: keyof Measurement; label: string }[] = [
    { key: "neck", label: "Neck" },
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "thigh_l", label: "Thigh L" },
    { key: "thigh_r", label: "Thigh R" },
    { key: "bicep_l", label: "Bicep L" },
    { key: "bicep_r", label: "Bicep R" },
  ];

  // Group every logged set (coach- or self-logged) by exercise name to
  // build a weight-over-time trend per movement -- this is a free-text
  // field so grouping is just a trimmed, case-insensitive match.
  const trendByExercise = new Map<string, ExerciseTrend>();
  for (const session of sessions ?? []) {
    for (const entry of session.entries) {
      const name = entry.exercise?.trim();
      if (!name || !entry.weight) continue;
      const weight = parseWeight(entry.weight);
      if (weight == null) continue;

      const key = name.toLowerCase();
      const existing = trendByExercise.get(key);
      const point = { date: session.date, weight };
      if (!existing) {
        trendByExercise.set(key, {
          name,
          points: [point],
          pr: weight,
          prDate: session.date,
        });
      } else {
        existing.name = name; // keep most recent casing
        existing.points.push(point);
        if (weight >= existing.pr) {
          existing.pr = weight;
          existing.prDate = session.date;
        }
      }
    }
  }

  const exerciseTrends = [...trendByExercise.values()].sort(
    (a, b) =>
      (b.points.at(-1)?.date ?? "").localeCompare(a.points.at(-1)?.date ?? "")
  );

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          My progress
        </h1>
        <p className="mt-1 text-sm text-gray">
          Your measurement trends and strength progress, all in one place.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray">Progress photos</p>
        <Card>
          <form action={addProgressPhoto} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Date
                </label>
                <Input name="date" type="date" required defaultValue={today} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Angle
                </label>
                <Select name="angle" defaultValue="">
                  <option value="">Not specified</option>
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Photo
              </label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                capture="environment"
                required
                className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Notes{" "}
                <span className="font-normal text-gray">(optional)</span>
              </label>
              <Textarea name="notes" rows={2} />
            </div>
            <Button type="submit">Add photo</Button>
          </form>
        </Card>

        {(progressPhotos ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {progressPhotos!.map((p) => (
              <div key={p.id} className="space-y-1">
                {photoUrlByPath.has(p.photo_path) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrlByPath.get(p.photo_path)}
                    alt={`Progress photo ${p.date}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="text-xs text-gray">
                  {p.date}
                  {p.angle ? ` · ${p.angle}` : ""}
                </p>
                <form
                  action={async () => {
                    "use server";
                    await deleteProgressPhoto(p.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-gray hover:text-pink"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray">Measurements</p>
        {allMeasurements.length === 0 ? (
          <EmptyState
            title="No measurements yet"
            body="Your coach logs these during your monthly assessment — they'll show up here once the first one's in."
          />
        ) : (
          <>
            {weights.length >= 2 ? (
              <Card>
                <p className="text-sm font-medium text-gray">Weight trend</p>
                <Sparkline values={weights} />
              </Card>
            ) : null}

            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray">Latest</p>
                <p className="text-sm text-gray">{allMeasurements[0].date}</p>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                <DeltaField
                  label="Weight"
                  value={allMeasurements[0].weight}
                  previous={allMeasurements[1]?.weight ?? null}
                  unit="lb"
                />
                {CIRCUMFERENCE_FIELDS.map((f) => (
                  <DeltaField
                    key={f.key}
                    label={f.label}
                    value={allMeasurements[0][f.key] as number | null}
                    previous={(allMeasurements[1]?.[f.key] as number | null) ?? null}
                    unit="in"
                  />
                ))}
              </dl>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray">Strength progress</p>
        {exerciseTrends.length === 0 ? (
          <EmptyState
            title="Nothing to show yet"
            body="Once weights are logged with your sessions, each movement's progress will show up here."
          />
        ) : (
          <div className="space-y-2">
            {exerciseTrends.map((t) => (
              <Card key={t.name}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="text-sm text-gray">
                    PR: {t.pr} ({t.prDate})
                  </p>
                </div>
                {t.points.length >= 2 ? (
                  <Sparkline
                    values={t.points.map((p) => p.weight)}
                    color="#5EC4B6"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray">
                    Latest: {t.points.at(-1)?.weight}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
