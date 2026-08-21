import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setRequestStatus } from "@/app/coach/actions";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heart,
  PhaseBanner,
} from "@/components/ui";
import { trackName } from "@/lib/constants";
import type {
  Activity,
  Checkin,
  Client,
  SessionRequest,
  TrainingSession,
} from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "checkins", label: "Check-ins" },
  { id: "activity", label: "Activity" },
  { id: "requests", label: "Requests" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: TabId = (TABS.find((t) => t.id === tabParam)?.id ??
    "overview") as TabId;

  const supabase = await createClient();

  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };

  if (!client) notFound();

  const [{ data: sessions }, { data: checkins }, { data: activities }, { data: requests }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", id)
        .order("date", { ascending: false }) as unknown as Promise<{
        data: TrainingSession[] | null;
      }>,
      supabase
        .from("checkins")
        .select("*")
        .eq("client_id", id)
        .order("date", { ascending: false }) as unknown as Promise<{
        data: Checkin[] | null;
      }>,
      supabase
        .from("activities")
        .select("*")
        .eq("client_id", id)
        .order("date", { ascending: false }) as unknown as Promise<{
        data: Activity[] | null;
      }>,
      supabase
        .from("requests")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }) as unknown as Promise<{
        data: SessionRequest[] | null;
      }>,
    ]);

  const pendingCount = (requests ?? []).filter(
    (r) => r.status === "pending"
  ).length;
  const sessionsUsed = sessions?.length ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/coach/roster" className="text-sm text-gray hover:text-ink">
        ← Back to roster
      </Link>

      <PhaseBanner
        phase={client.phase}
        title={client.name}
        subtitle={trackName(client.track)}
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/coach/clients/${id}?tab=${t.id}`}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-rose text-white" : "text-gray hover:text-ink"
            }`}
          >
            {t.label}
            {t.id === "requests" && pendingCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <Overview
          client={client}
          sessionsUsed={sessionsUsed}
          recentSessions={sessions?.slice(0, 3) ?? []}
        />
      )}
      {tab === "sessions" && (
        <SessionsTab clientId={id} sessions={sessions ?? []} />
      )}
      {tab === "checkins" && (
        <CheckinsTab clientId={id} checkins={checkins ?? []} />
      )}
      {tab === "activity" && <ActivityTab activities={activities ?? []} />}
      {tab === "requests" && (
        <RequestsTab clientId={id} requests={requests ?? []} />
      )}
    </div>
  );
}

function Overview({
  client,
  sessionsUsed,
  recentSessions,
}: {
  client: Client;
  sessionsUsed: number;
  recentSessions: TrainingSession[];
}) {
  const allotted = client.sessions_allotted;
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-medium text-gray">Sessions</p>
        {allotted ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {sessionsUsed} / {allotted}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayLt">
              <div
                className="h-full rounded-full bg-rose"
                style={{
                  width: `${Math.min(100, (sessionsUsed / allotted) * 100)}%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-2xl font-semibold text-ink">
            {sessionsUsed} logged
          </p>
        )}
      </Card>

      {client.notes ? (
        <Card>
          <p className="text-sm font-medium text-gray">Coach notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {client.notes}
          </p>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray">Recent sessions</p>
        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions logged yet"
            body="Log the first session to start tracking progress."
          />
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{s.day_label}</p>
                  <p className="text-sm text-gray">{s.date}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsTab({
  clientId,
  sessions,
}: {
  clientId: string;
  sessions: TrainingSession[];
}) {
  return (
    <div className="space-y-4">
      <Link
        href={`/coach/clients/${clientId}/log-session`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Log session
      </Link>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Log a session to start building this client's history."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{s.day_label}</p>
                <p className="text-sm text-gray">{s.date}</p>
              </div>
              {s.entries.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-gray">
                  {s.entries.map((e, i) => (
                    <li key={i}>
                      {e.exercise} — {e.sets}x{e.reps}
                      {e.weight ? ` @ ${e.weight}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.rating ? (
                <p className="mt-2 text-sm text-gray">Rating: {s.rating}/5</p>
              ) : null}
              {s.day_notes ? (
                <p className="mt-1 text-sm text-ink">{s.day_notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckinsTab({
  clientId,
  checkins,
}: {
  clientId: string;
  checkins: Checkin[];
}) {
  return (
    <div className="space-y-4">
      <Link
        href={`/coach/clients/${clientId}/log-checkin`}
        className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Log check-in
      </Link>

      {checkins.length === 0 ? (
        <EmptyState
          title="No check-ins yet"
          body="Check-ins logged by you or your client will show up here."
        />
      ) : (
        <div className="space-y-3">
          {checkins.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{c.date}</p>
                <Badge tone={c.logged_by === "coach" ? "rose" : "teal"}>
                  logged by {c.logged_by}
                </Badge>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray sm:grid-cols-3">
                {c.sleep ? <Field label="Sleep" value={c.sleep} /> : null}
                {c.water ? <Field label="Water" value={c.water} /> : null}
                {c.food ? <Field label="Food" value={c.food} /> : null}
                {c.energy ? <Field label="Energy" value={c.energy} /> : null}
                {c.mood ? <Field label="Mood" value={c.mood} /> : null}
              </dl>
              {c.notes ? (
                <p className="mt-2 text-sm text-ink">{c.notes}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray/70">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function ActivityTab({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity logged yet"
        body="Out-of-session activity your client logs will show up here."
      />
    );
  }
  return (
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
          {a.notes ? <p className="mt-1 text-sm text-ink">{a.notes}</p> : null}
        </Card>
      ))}
    </div>
  );
}

function RequestsTab({
  clientId,
  requests,
}: {
  clientId: string;
  requests: SessionRequest[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No time requests"
        body="When this client requests a session time, it'll show up here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">
                {r.preferred_date}
                {r.preferred_time ? ` at ${r.preferred_time}` : ""}
              </p>
              {r.note ? (
                <p className="mt-1 text-sm text-gray">{r.note}</p>
              ) : null}
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await setRequestStatus(r.id, clientId, "confirmed");
                }}
              >
                <Button type="submit">Confirm</Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await setRequestStatus(r.id, clientId, "declined");
                }}
              >
                <Button type="submit" variant="danger">
                  Decline
                </Button>
              </form>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: SessionRequest["status"] }) {
  const tone =
    status === "confirmed" ? "green" : status === "declined" ? "pink" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}
