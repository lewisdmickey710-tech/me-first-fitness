import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addClientSchedule, removeClientSchedule } from "@/app/coach/actions";
import { Button, Card, EmptyState, Heart, Input, Select } from "@/components/ui";
import { DAY_NAMES, formatSchedule } from "@/lib/schedule";
import type { Client, ClientSchedule } from "@/lib/types";

export default async function ClientSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: client }, { data: schedules }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single() as unknown as Promise<{
      data: Client | null;
    }>,
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", id)
      .eq("active", true)
      .order("day_of_week") as unknown as Promise<{ data: ClientSchedule[] | null }>,
  ]);

  if (!client) notFound();

  const boundAdd = addClientSchedule.bind(null, id);

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${id}`}
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {client.name}&apos;s weekly schedule
      </h1>
      <p className="text-sm text-gray">
        Set the recurring time(s) this client trains. The app reminds them by
        email the day before each one.
      </p>

      {(schedules ?? []).length === 0 ? (
        <EmptyState
          title="No recurring times yet"
          body="Add a day and time below to start reminding this client automatically."
        />
      ) : (
        <div className="space-y-2">
          {(schedules ?? []).map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">
                  {formatSchedule(s.day_of_week, s.time_of_day)}
                </p>
                {s.label ? (
                  <p className="text-sm text-gray">{s.label}</p>
                ) : null}
              </div>
              <form
                action={async () => {
                  "use server";
                  await removeClientSchedule(s.id, id);
                }}
              >
                <Button type="submit" variant="danger">
                  Remove
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <form action={boundAdd} className="space-y-4">
          <p className="font-medium text-ink">Add a recurring time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Day
              </label>
              <Select name="day_of_week" defaultValue="2">
                {DAY_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Time
              </label>
              <Input name="time_of_day" type="time" required defaultValue="17:00" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Label <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input name="label" placeholder="e.g. In-person, Virtual" />
          </div>
          <Button type="submit">Add time</Button>
        </form>
      </Card>
    </div>
  );
}
