import { Fragment } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import {
  addSymptomTracker,
  cycleSymptomLog,
  deleteSymptomTracker,
  updateSymptomLogDetails,
} from "@/app/client/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Collapsible,
  EmptyState,
  Heart,
  Input,
  Textarea,
} from "@/components/ui";
import { nowInBusinessTz, toDateString, weekDates } from "@/lib/timezone";
import type { ClientSymptom, ClientSymptomDayLog } from "@/lib/types";

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const LEVEL_CLASS: Record<number, string> = {
  1: "border-teal bg-teal",
  2: "border-gold bg-gold",
  3: "border-pink bg-pink",
};

export default async function ClientSymptomsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
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
        <BackLink href="/client/dashboard" />
        <EmptyState
          title="Not turned on for your account"
          body="This one's optional and off by default — ask your coach if you'd like it enabled."
        />
      </div>
    );
  }

  const { week: weekParam } = await searchParams;
  const weekOffset = Math.min(0, Math.trunc(Number(weekParam ?? 0)) || 0);

  const supabase = await createClient();
  const now = nowInBusinessTz();
  const todayStr = toDateString(now);
  const last7Days = weekDates(now, weekOffset);

  const [{ data: symptoms }, { data: dayLogs }] = await Promise.all([
    supabase
      .from("client_symptoms")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true)
      .order("created_at") as unknown as Promise<{ data: ClientSymptom[] | null }>,
    supabase
      .from("client_symptom_day_logs")
      .select("*")
      .eq("client_id", me.id)
      .gte("log_date", last7Days[0])
      .lte("log_date", last7Days[6]) as unknown as Promise<{
      data: ClientSymptomDayLog[] | null;
    }>,
  ]);

  const logByKey = new Map(
    (dayLogs ?? []).map((l) => [`${l.symptom_id}:${l.log_date}`, l])
  );
  const symptomById = new Map((symptoms ?? []).map((s) => [s.id, s]));

  const loggedDays = (dayLogs ?? [])
    .slice()
    .sort((a, b) => (a.log_date < b.log_date ? 1 : -1));

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Symptom log
        </h1>
        <p className="mt-1 text-sm text-gray">
          A private place to keep track of anything you might want to bring
          up with a doctor or physical therapist. Tap a day to cycle it
          through a level —{" "}
          <span className="font-medium text-teal">teal</span> →{" "}
          <span className="font-medium text-gold">gold</span> →{" "}
          <span className="font-medium text-pink">pink</span> → clear.
          Sharing with your coach is entirely up to you, day by day.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/client/symptoms?week=${weekOffset - 1}`}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          ← Prev week
        </Link>
        <p className="text-xs text-gray">
          {last7Days[0]} – {last7Days[6]}
        </p>
        {weekOffset < 0 ? (
          <Link
            href={`/client/symptoms?week=${weekOffset + 1}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            Next week →
          </Link>
        ) : (
          <span className="px-2 py-1 text-sm text-grayLt">Next week →</span>
        )}
      </div>

      {(symptoms ?? []).length === 0 ? (
        <EmptyState
          title="Nothing tracked yet"
          body="Add something you want to keep an eye on — a joint, a symptom, anything."
        />
      ) : (
        <Card className="space-y-3">
          <div className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-x-1 gap-y-2 text-xs text-gray">
            <div />
            {last7Days.map((d) => {
              const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
              return (
                <div
                  key={d}
                  className={`text-center ${d === todayStr ? "font-semibold text-rose" : ""}`}
                >
                  {WEEKDAY_SHORT[dow]}
                </div>
              );
            })}
            {(symptoms ?? []).map((symptom) => (
              <Fragment key={symptom.id}>
                <div className="flex items-center justify-between gap-2 pr-1">
                  <span className="truncate text-sm text-ink">{symptom.name}</span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteSymptomTracker(symptom.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray hover:text-pink"
                      aria-label={`Delete ${symptom.name}`}
                    >
                      ✕
                    </button>
                  </form>
                </div>
                {last7Days.map((d) => {
                  const log = logByKey.get(`${symptom.id}:${d}`);
                  return (
                    <form
                      key={`${symptom.id}-${d}`}
                      action={async () => {
                        "use server";
                        await cycleSymptomLog(symptom.id, d);
                      }}
                      className="flex justify-center"
                    >
                      <button
                        type="submit"
                        className={`h-6 w-6 rounded-full border transition ${
                          log ? LEVEL_CLASS[log.level] : "border-grayLt bg-white hover:border-rose/40"
                        }`}
                        aria-label={
                          log ? `Level ${log.level} — tap to change` : "Tap to log"
                        }
                      />
                    </form>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <form
          action={async (formData: FormData) => {
            "use server";
            await addSymptomTracker(String(formData.get("name") ?? ""));
          }}
          className="flex gap-2"
        >
          <Input name="name" placeholder="New symptom (e.g. right knee ache)" />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </Card>

      {loggedDays.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-ink">
            Notes &amp; sharing this week
          </h2>
          <div className="space-y-2">
            {loggedDays.map((log) => {
              const symptom = symptomById.get(log.symptom_id);
              if (!symptom) return null;
              return (
                <Card key={log.id}>
                  <Collapsible
                    label={
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`inline-block h-3 w-3 rounded-full border ${LEVEL_CLASS[log.level]}`}
                        />
                        {log.log_date} — {symptom.name}
                        {log.shared_with_coach ? (
                          <Badge tone="teal">shared with coach</Badge>
                        ) : null}
                      </span>
                    }
                    labelClassName="text-sm text-ink"
                  >
                    <form action={updateSymptomLogDetails} className="space-y-3">
                      <input type="hidden" name="symptom_id" value={symptom.id} />
                      <input type="hidden" name="log_date" value={log.log_date} />
                      <div>
                        <label className="mb-1 block text-sm font-medium text-ink">
                          Notes
                        </label>
                        <Textarea
                          name="note"
                          rows={2}
                          defaultValue={log.note ?? ""}
                          placeholder="Optional — when it happens, what helps, etc."
                        />
                      </div>
                      <Checkbox
                        name="shared_with_coach"
                        label="Share this entry with my coach"
                        defaultChecked={log.shared_with_coach}
                      />
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
