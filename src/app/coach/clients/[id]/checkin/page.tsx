import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { submitCheckin, addHabitForClient } from "@/app/coach/actions";
import { Button, Card, Checkbox, Collapsible, Heart, Input, Textarea } from "@/components/ui";
import type { Client, Measurement } from "@/lib/types";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };
  if (!client) notFound();

  const { data: lastMeasurement } = (await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", id)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: Measurement | null };

  const { count: activeScheduleCount } = await supabase
    .from("client_schedules")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("active", true);

  const today = new Date().toISOString().slice(0, 10);
  const boundSubmit = submitCheckin.bind(null, id);
  const boundAddHabit = async (formData: FormData) => {
    "use server";
    await addHabitForClient(id, String(formData.get("name") ?? ""));
  };

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Check-in — {client.name}
      </h1>
      <p className="text-sm text-gray">
        Measurements, the conversation, and the next 4 weeks&apos; goals, all in
        one place.
      </p>

      <Card>
        <form action={boundSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Date</label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>

          <div className="space-y-3 border-t border-grayLt pt-4">
            <p className="font-medium text-ink">Measurements</p>
            {lastMeasurement ? (
              <p className="text-xs text-gray">
                Last logged {lastMeasurement.date}
                {lastMeasurement.weight ? ` — ${lastMeasurement.weight} lb` : ""}
              </p>
            ) : (
              <p className="text-xs text-gray">Nothing logged yet.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <NumField name="weight" label="Weight (lb)" />
              <NumField name="neck" label="Neck (in)" />
              <NumField name="chest" label="Chest (in)" />
              <NumField name="waist" label="Waist (in)" />
              <NumField name="hips" label="Hips (in)" />
              <NumField name="thigh_l" label="Thigh — L (in)" />
              <NumField name="thigh_r" label="Thigh — R (in)" />
              <NumField name="bicep_l" label="Bicep — L (in)" />
              <NumField name="bicep_r" label="Bicep — R (in)" />
            </div>
            <Textarea name="measurement_notes" rows={2} placeholder="Notes on measurements (optional)" />
            <p className="text-xs text-gray">
              Leave any measurement blank if you didn&apos;t take it this time.
            </p>
          </div>

          <div className="space-y-3 border-t border-grayLt pt-4">
            <p className="font-medium text-ink">The conversation</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Satisfaction (1–5)
              </label>
              <Input name="satisfaction" type="number" min={1} max={5} step={1} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                What&apos;s working
              </label>
              <Textarea name="what_working" rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                What they want to change
              </label>
              <Textarea name="what_would_help" rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Anything else <span className="font-normal text-gray">(optional)</span>
              </label>
              <Textarea name="anything_else" rows={2} />
            </div>
            <Checkbox
              name="testimonial_consent"
              label="They're open to giving a testimonial"
            />
          </div>

          <div className="space-y-3 border-t border-grayLt pt-4">
            <p className="font-medium text-ink">Goals for the next 4 weeks</p>
            <p className="text-xs text-gray">
              These feed their dashboard&apos;s movement and nutrition circles.
              Leave blank to fall back to the default
              {activeScheduleCount != null && activeScheduleCount > 0
                ? ` (${activeScheduleCount} session${activeScheduleCount === 1 ? "" : "s"}/week, from their standing schedule)`
                : ""}
              .
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">
                  In-person / week
                </label>
                <Input
                  name="weekly_inperson_goal"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={client.weekly_inperson_goal ?? ""}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">
                  Solo workouts / week
                </label>
                <Input
                  name="weekly_solo_goal"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={client.weekly_solo_goal ?? ""}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">
                  Meals logged / day
                </label>
                <Input
                  name="nutrition_goal"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={client.nutrition_goal ?? ""}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save check-in
          </Button>
        </form>
      </Card>

      <Card>
        <Collapsible label="+ Add a habit to track">
          <form action={boundAddHabit} className="mt-2 flex items-end gap-2">
            <Input name="name" placeholder="e.g. 8 hours of sleep" className="flex-1" />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </Collapsible>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium text-ink">Worked out after this check-in?</p>
          <p className="text-sm text-gray">Log it separately, right from here.</p>
        </div>
        <Link
          href={`/coach/clients/${id}/log-session?date=${today}`}
          className="shrink-0 rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Log the workout →
        </Link>
      </Card>
    </div>
  );
}

function NumField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink">{label}</label>
      <Input name={name} type="number" step="any" inputMode="decimal" />
    </div>
  );
}
