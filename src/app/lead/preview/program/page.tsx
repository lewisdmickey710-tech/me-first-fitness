import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/current-lead";
import { requestTransition } from "@/app/lead/actions";
import { Button, Card, Collapsible, EmptyState, Heart, PhaseBanner } from "@/components/ui";
import { formatReps } from "@/lib/constants";

// What's genuinely useful to know even if someone never signs up -- shown
// as a "sneak peek" of everything else beyond this one workout day, since
// that's exactly what a locked/empty tab can't show on its own.
const PARTNERSHIP_PERKS = [
  {
    label: "Every day of this phase, programmed for you",
    detail:
      "Not just Day 1 -- the whole rotation, updated as you progress through phases.",
  },
  {
    label: "Your actual numbers tracked over time",
    detail:
      "Weights, measurements, and progress photos with trend lines, so you can see the arc, not just today.",
  },
  {
    label: "A real schedule, not a guess",
    detail: "Book, reschedule, or cancel sessions right from your phone.",
  },
  {
    label: "Direct feedback on your form and your plan",
    detail:
      "Notes on what to repeat or adjust after every session, plus check-ins between them.",
  },
  {
    label: "The Community board",
    detail: "Wins, questions, and support with other clients, not just me.",
  },
] as const;

interface PreviewDayRow {
  id: string;
  day_number: number;
  day_label: string;
  program_day_exercises: {
    id: string;
    position: number;
    sets: string | null;
    reps: string | null;
    tempo: string | null;
    superset_group: string | null;
    exercises: {
      name: string;
      client_description: string | null;
      laterality: string | null;
      video_url: string | null;
    } | null;
  }[];
}

export default async function LeadPreviewProgramPage() {
  const lead = await getMyLead();

  if (!lead) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  if (!lead.previewing || !lead.preview_care_profile_id || !lead.preview_phase) {
    return (
      <div className="space-y-6">
        <BackLink href="/lead/dashboard" />
        <EmptyState
          title="No Test the Waters preview set up yet"
          body="Reach out and I can put one together for you."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: days } = (await supabase
    .from("program_days")
    .select(
      "id, day_number, day_label, program_day_exercises(id, position, sets, reps, tempo, superset_group, exercises(name, client_description, laterality, video_url))"
    )
    .eq("care_profile_id", lead.preview_care_profile_id)
    .eq("phase", lead.preview_phase)
    .order("day_number")) as unknown as { data: PreviewDayRow[] | null };

  const programDays = (days ?? []).slice().sort((a, b) => a.day_number - b.day_number);
  const dayOne = programDays[0] ?? null;
  const lockedDays = programDays.slice(1);

  return (
    <div className="space-y-6">
      <BackLink href="/lead/dashboard" />

      <PhaseBanner phase={lead.preview_phase} title="Test the Waters — Day 1" />

      <p className="text-sm text-gray">
        This is a read-only look at what your program would actually be —
        exactly what you&apos;d see and log as a client. Day 1 is unlocked in
        full; the rest of the days in this phase stay locked until you sign
        on.
      </p>

      {!dayOne ? (
        <EmptyState
          title="Nothing built here yet"
          body="This track's program isn't built out yet -- reach out and I'll get you a proper look."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <p className="font-medium text-ink">
              <Heart className="mr-1" />
              Day {dayOne.day_number}: {dayOne.day_label}
            </p>
            <div className="mt-3 space-y-4">
              {dayOne.program_day_exercises
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((pde) => (
                  <div
                    key={pde.id}
                    className="space-y-1.5 border-t border-grayLt pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {pde.exercises?.name ?? "Exercise"}
                      </p>
                      <p className="whitespace-nowrap text-sm text-gray">
                        {pde.sets}×{formatReps(pde.reps, pde.exercises?.laterality ?? null)}
                        {pde.tempo ? ` @ ${pde.tempo}` : ""}
                        {pde.superset_group ? ` · ${pde.superset_group}` : ""}
                      </p>
                    </div>
                    {pde.exercises?.client_description ? (
                      <Collapsible label="About this movement">
                        <p className="whitespace-pre-wrap text-sm text-gray">
                          {pde.exercises.client_description}
                        </p>
                      </Collapsible>
                    ) : null}
                    {pde.exercises?.video_url ? (
                      <a
                        href={pde.exercises.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm font-medium text-rose hover:underline"
                      >
                        ▶ Watch demo
                      </a>
                    ) : null}
                  </div>
                ))}
            </div>
          </Card>

          {lockedDays.map((day) => (
            <Card key={day.id} className="relative overflow-hidden bg-grayLt/10">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">Day {day.day_number}</p>
                <span className="text-lg" aria-hidden>
                  🔒
                </span>
              </div>
              <p className="mt-1 text-sm text-gray">
                {day.program_day_exercises.length} more exercises, locked
                until you sign on.
              </p>
              <p className="mt-2 text-xs italic text-gray">
                💛 If you partnered with Mickey, this day would be unlocked
                right alongside Day 1 — no guessing what comes next.
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-ink">
          <Heart className="mr-1.5" />
          If you partnered with Mickey, you&apos;d also get...
        </h2>
        <Card className="divide-y divide-grayLt">
          {PARTNERSHIP_PERKS.map((perk) => (
            <div key={perk.label} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-ink">{perk.label}</p>
              <p className="mt-0.5 text-sm text-gray">{perk.detail}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card className="border-rose/30 bg-rose/5">
        <p className="text-sm font-medium text-ink">Ready to unlock the rest?</p>
        <p className="mt-1 text-sm text-gray">
          The rest of this phase, your full schedule, progress tracking, and
          everything else — all unlocked the moment we get you signed on.
        </p>
        {lead.ready_to_transition ? (
          <p className="mt-3 text-sm text-teal">
            You&apos;ve let me know you&apos;re ready — I&apos;ll be in touch
            to get you set up. 💛
          </p>
        ) : (
          <form action={requestTransition} className="mt-3">
            <Button type="submit">Unlock Our Partnership ✨</Button>
          </form>
        )}
        <Link
          href="/lead/dashboard"
          className="mt-3 inline-block text-sm font-medium text-rose hover:underline"
        >
          ← Back to your dashboard
        </Link>
      </Card>
    </div>
  );
}
