import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/current-lead";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import type { CareProfile, LeadAssessmentRequest, LeadIntake } from "@/lib/types";

export default async function LeadDashboard() {
  const lead = await getMyLead();

  if (!lead) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const supabase = await createClient();

  const [{ data: requests }, { data: intake }, { data: careProfiles }] =
    await Promise.all([
      supabase
        .from("lead_assessment_requests")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false }) as unknown as Promise<{
        data: LeadAssessmentRequest[] | null;
      }>,
      supabase
        .from("lead_intake")
        .select("*")
        .eq("lead_id", lead.id)
        .maybeSingle() as unknown as Promise<{ data: LeadIntake | null }>,
      supabase
        .from("care_profiles")
        .select("*")
        .order("name") as unknown as Promise<{ data: CareProfile[] | null }>,
    ]);

  const latestRequest = requests?.[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Hey, {lead.name.split(" ")[0]}
        </h1>
        <Link href="/lead/profile" className="text-sm text-gray hover:text-ink">
          Edit profile
        </Link>
      </div>
      <p className="text-sm text-gray">
        So glad you reached out. Here&apos;s where things stand.
      </p>

      {latestRequest ? (
        <Card>
          <p className="text-sm font-medium text-gray">Assessment request</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {latestRequest.preferred_date}
            {latestRequest.preferred_time
              ? ` at ${latestRequest.preferred_time}`
              : ""}
          </p>
          <div className="mt-2">
            <StatusBadge status={latestRequest.status} />
          </div>
          {latestRequest.status === "pending" ? (
            <p className="mt-2 text-sm text-gray">
              I&apos;ll reach out to confirm a time that works.
            </p>
          ) : null}
        </Card>
      ) : null}

      {!intake?.submitted_at ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            Before we meet
          </p>
          <p className="mt-1 text-sm text-gray">
            A few things I&apos;d love to know about you first — nothing
            here is a test, take your time with it.
          </p>
          <Link
            href="/lead/intake"
            className="mt-3 inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Fill it out
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              Your intake questionnaire
            </p>
            <Badge tone="green">submitted</Badge>
          </div>
          <Link
            href="/lead/intake"
            className="mt-2 inline-block text-sm text-gray hover:text-ink"
          >
            Review or update your answers →
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">
          <Heart className="mr-1.5" />
          What training with me looks like
        </h2>

        <Card className="space-y-3 text-sm text-ink">
          <p>
            I&apos;m Mickey — a solo coach, not a gym or a franchise. I train
            the whole person, not just the workout: your body, your history,
            your actual life. Every new client starts with a free
            assessment, then 50% off your first paid session after you sign
            on. No pressure, no obligation — just a chance to see if this
            feels right.
          </p>
          <p>
            Every program moves through the same four phases (Stability →
            Strength → Size → Power), built around movement quality, not
            motivation or how you feel on a given day. Nutrition coaching is
            built on Intuitive Eating rather than calorie restriction by
            default — you choose the style that actually works for you:
            macro tracking, food &amp; mood journaling, photos, or just
            talking it through.
          </p>
          <p className="text-xs text-gray">
            $40/session in-person · $25/session virtual · $50 self-led plan
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-ink">
            <Heart className="mr-1" />
            Curious what you&apos;d get access to?
          </p>
          <p className="mt-1 text-sm text-gray">
            The same wellness guide I hand every client at their
            assessment — movement, nutrition, mindset, and recovery, all in
            one place.
          </p>
          <Link
            href="/lead/guide"
            className="mt-2 inline-block text-sm font-medium text-rose hover:opacity-80"
          >
            Read the guide →
          </Link>
        </Card>

        {(careProfiles ?? []).length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray">
              Programs I build around real circumstances
            </p>
            {(careProfiles ?? []).map((cp) => (
              <Card key={cp.id}>
                <p className="font-medium text-ink">{cp.name}</p>
                {cp.description ? (
                  <p className="mt-1 text-sm text-gray">{cp.description}</p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: LeadAssessmentRequest["status"];
}) {
  const tone =
    status === "confirmed" ? "green" : status === "declined" ? "pink" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}
