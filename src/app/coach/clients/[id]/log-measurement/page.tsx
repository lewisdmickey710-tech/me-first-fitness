import { BackLink } from "@/components/back-link";
import { logMeasurementAsCoach } from "@/app/coach/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default async function LogMeasurementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const boundLogMeasurement = logMeasurementAsCoach.bind(null, id);

  return (
    <div className="space-y-6">
      <BackLink href={`/coach/clients/${id}?tab=measurements`} />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log measurements
      </h1>

      <Card>
        <form action={boundLogMeasurement} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <Input name="date" type="date" required defaultValue={today} />
          </div>

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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="notes" rows={3} />
          </div>

          <Button type="submit">Save measurements</Button>
        </form>
      </Card>

      <p className="text-sm text-gray">
        Leave any field blank if you didn&apos;t take that measurement this
        time — it&apos;ll just be skipped in the trend.
      </p>
    </div>
  );
}

function NumField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <Input name={name} type="number" step="0.1" inputMode="decimal" />
    </div>
  );
}
