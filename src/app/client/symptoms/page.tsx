import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { addSymptomLog, deleteSymptomLog } from "@/app/client/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type { ClientSymptomLog } from "@/lib/types";

export default async function ClientSymptomsPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  if (!me.symptom_tracker_enabled) {
    return (
      <div className="space-y-6">
        <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
          ← Back
        </Link>
        <EmptyState
          title="Not turned on for your account"
          body="This one's optional and off by default — ask your coach if you'd like it enabled."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const todayStr = toDateString(nowInBusinessTz());

  const { data: symptomLogs } = (await supabase
    .from("client_symptom_logs")
    .select("*")
    .eq("client_id", me.id)
    .order("log_date", { ascending: false })
    .limit(20)) as { data: ClientSymptomLog[] | null };

  return (
    <div className="space-y-6">
      <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Symptom log
        </h1>
        <p className="mt-1 text-sm text-gray">
          A private place to keep track of anything you might want to bring
          up with a doctor or physical therapist. Sharing with your coach is
          entirely up to you, entry by entry.
        </p>
      </div>

      <Card>
        <form action={addSymptomLog} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Date
              </label>
              <Input name="log_date" type="date" required defaultValue={todayStr} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Severity
              </label>
              <Select name="severity" defaultValue="">
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Symptom
            </label>
            <Input name="symptom" required placeholder="e.g. Right knee ache" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Notes
            </label>
            <Textarea name="notes" rows={2} placeholder="Optional — when it happens, what helps, etc." />
          </div>
          <Checkbox name="shared_with_coach" label="Share this entry with my coach" />
          <Button type="submit">Save entry</Button>
        </form>
      </Card>

      {(symptomLogs ?? []).length > 0 ? (
        <div className="space-y-2">
          {symptomLogs!.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {s.symptom}
                  {s.severity ? (
                    <span className="ml-2 text-sm text-gray">
                      severity {s.severity}/5
                    </span>
                  ) : null}
                </p>
                <div className="flex items-center gap-2">
                  {s.shared_with_coach ? (
                    <Badge tone="teal">shared with coach</Badge>
                  ) : null}
                  <form
                    action={async () => {
                      "use server";
                      await deleteSymptomLog(s.id);
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
              </div>
              <p className="mt-1 text-sm text-gray">{s.log_date}</p>
              {s.notes ? (
                <p className="mt-1 text-sm text-ink">{s.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
