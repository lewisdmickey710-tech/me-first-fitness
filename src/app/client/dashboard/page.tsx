import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Badge, Card, EmptyState, Heart, PhaseBanner } from "@/components/ui";
import { trackName } from "@/lib/constants";
import type { SessionRequest, TrainingSession } from "@/lib/types";

export default async function ClientDashboard() {
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

  const [{ data: sessions }, { data: requests }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(5) as unknown as Promise<{ data: TrainingSession[] | null }>,
    supabase
      .from("requests")
      .select("*")
      .eq("client_id", me.id)
      .eq("status", "pending") as unknown as Promise<{
      data: SessionRequest[] | null;
    }>,
  ]);

  const { count: sessionsUsed } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", me.id);

  const allotted = me.sessions_allotted;

  return (
    <div className="space-y-6">
      <PhaseBanner
        phase={me.phase}
        title={`Hey, ${me.name.split(" ")[0]}`}
        subtitle={trackName(me.track)}
      />

      <Card>
        <p className="text-sm font-medium text-gray">Sessions</p>
        {allotted ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {sessionsUsed ?? 0} / {allotted}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayLt">
              <div
                className="h-full rounded-full bg-rose"
                style={{
                  width: `${Math.min(
                    100,
                    ((sessionsUsed ?? 0) / allotted) * 100
                  )}%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {sessionsUsed ?? 0} logged
          </p>
        )}
      </Card>

      {(requests?.length ?? 0) > 0 ? (
        <Card>
          <p className="text-sm font-medium text-gray">
            <Heart className="mr-1" />
            Pending time requests
          </p>
          <div className="mt-2 space-y-2">
            {requests!.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <p className="text-sm text-ink">
                  {r.preferred_date}
                  {r.preferred_time ? ` at ${r.preferred_time}` : ""}
                </p>
                <Badge tone="gold">pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/client/checkin" label="Log check-in" />
        <QuickAction href="/client/activity" label="Log activity" />
        <QuickAction href="/client/request" label="Request time" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Recent sessions</p>
        {!sessions || sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            body="Once your coach logs a session, it'll show up here."
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{s.day_label}</p>
                  <p className="text-sm text-gray">{s.date}</p>
                </div>
                {s.rating ? (
                  <p className="mt-1 text-sm text-gray">
                    Rating: {s.rating}/5
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-grayLt bg-white px-2 py-4 text-center text-sm font-medium text-ink shadow-sm transition hover:border-rose/40"
    >
      <Heart className="text-base" />
      {label}
    </Link>
  );
}
