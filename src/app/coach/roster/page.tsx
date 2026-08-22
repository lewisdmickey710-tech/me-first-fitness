import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { isFirstWeekOfMonth, loggedThisMonth } from "@/lib/measurement-window";
import { computeCancellationRisk } from "@/lib/risk";
import { toDateString } from "@/lib/timezone";
import type { Client, OccurrenceStatus } from "@/lib/types";

type ClientRow = Client & { care_profiles: { name: string } | null };

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: clients } = (await supabase
    .from("clients")
    .select("*, care_profiles(name)")
    .order("name")) as { data: ClientRow[] | null };

  const clientIds = (clients ?? []).map((c) => c.id);

  const [
    { data: pendingRequests },
    { data: clientProfileRows },
    { data: phaseRows },
    { data: measurementRows },
    { data: serviceCheckinRows },
    { data: checkinRows },
    { data: activityRows },
    { data: paymentRows },
    { data: occurrenceRows },
    { data: sessionRows },
    { data: satisfactionRows },
  ] = await Promise.all([
    supabase.from("requests").select("client_id").eq("status", "pending"),
    supabase.from("profiles").select("id").eq("role", "client"),
    clientIds.length > 0
      ? supabase
          .from("client_phase_history")
          .select("client_id, phase")
          .in("client_id", clientIds)
          .is("ended_on", null)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("measurements").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("service_checkins").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("checkins").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("activities").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("payments")
          .select("client_id, due_date, paid_on")
          .in("client_id", clientIds)
          .is("paid_on", null)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("session_occurrences")
          .select("client_id, status, occurrence_date")
          .in("client_id", clientIds)
          .order("occurrence_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from("sessions").select("client_id, date").in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("service_checkins")
          .select("client_id, date, satisfaction")
          .in("client_id", clientIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const pendingByClient = new Map<string, number>();
  for (const r of pendingRequests ?? []) {
    pendingByClient.set(
      r.client_id,
      (pendingByClient.get(r.client_id) ?? 0) + 1
    );
  }

  const phaseByClient = new Map<string, string>();
  for (const p of phaseRows ?? []) {
    phaseByClient.set(p.client_id, p.phase);
  }

  const datesByClient = (
    rows: { client_id: string; date: string }[] | null
  ) => {
    const map = new Map<string, string[]>();
    for (const row of rows ?? []) {
      map.set(row.client_id, [...(map.get(row.client_id) ?? []), row.date]);
    }
    return map;
  };
  const measurementDatesByClient = datesByClient(measurementRows);
  const serviceCheckinDatesByClient = datesByClient(serviceCheckinRows);

  const today = toDateString(new Date());

  const lastTrackedByClient = new Map<string, string>();
  for (const row of [...(checkinRows ?? []), ...(activityRows ?? [])]) {
    const prev = lastTrackedByClient.get(row.client_id);
    if (!prev || row.date > prev) lastTrackedByClient.set(row.client_id, row.date);
  }

  const overdueByClient = new Set(
    (paymentRows ?? [])
      .filter((p) => p.due_date < today)
      .map((p) => p.client_id)
  );

  const occurrencesByClient = new Map<string, OccurrenceStatus[]>();
  for (const row of occurrenceRows ?? []) {
    occurrencesByClient.set(row.client_id, [
      ...(occurrencesByClient.get(row.client_id) ?? []),
      row.status as OccurrenceStatus,
    ]);
  }

  const sessionCountByClient = new Map<string, number>();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  for (const row of sessionRows ?? []) {
    if (new Date(row.date) >= fourWeeksAgo) {
      sessionCountByClient.set(
        row.client_id,
        (sessionCountByClient.get(row.client_id) ?? 0) + 1
      );
    }
  }

  const latestSatisfactionByClient = new Map<string, number | null>();
  for (const row of satisfactionRows ?? []) {
    if (!latestSatisfactionByClient.has(row.client_id)) {
      latestSatisfactionByClient.set(row.client_id, row.satisfaction ?? null);
    }
  }

  const linkedUserIds = new Set(
    (clients ?? []).filter((c) => c.user_id).map((c) => c.user_id)
  );
  const pendingSignupCount = (clientProfileRows ?? []).filter(
    (p) => !linkedUserIds.has(p.id)
  ).length;

  const inWindow = isFirstWeekOfMonth();
  const clientsNeedingWindow = (clients ?? []).filter(
    (c) =>
      inWindow &&
      (!loggedThisMonth(measurementDatesByClient.get(c.id) ?? []) ||
        !loggedThisMonth(serviceCheckinDatesByClient.get(c.id) ?? []))
  ).length;

  const riskByClient = new Map<string, boolean>();
  for (const c of clients ?? []) {
    const lastTracked = lastTrackedByClient.get(c.id);
    const daysSince = lastTracked
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastTracked).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    const expectedCount = (c.days_per_week ?? 3) * 4;
    const consistencyPct =
      expectedCount > 0
        ? Math.min(
            100,
            Math.round(((sessionCountByClient.get(c.id) ?? 0) / expectedCount) * 100)
          )
        : null;
    const { isHighRisk } = computeCancellationRisk({
      recentOccurrenceStatuses: occurrencesByClient.get(c.id) ?? [],
      daysSinceLastCheckinOrActivity: daysSince,
      hasOverduePayment: overdueByClient.has(c.id),
      consistencyPct,
      latestServiceCheckinSatisfaction: latestSatisfactionByClient.get(c.id) ?? null,
    });
    riskByClient.set(c.id, isHighRisk);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Your roster
        </h1>
        <Link
          href="/coach/roster/new"
          className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add client
        </Link>
      </div>

      {pendingSignupCount > 0 ? (
        <Card className="border-rose/50 bg-rose/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {pendingSignupCount} new signup
              {pendingSignupCount > 1 ? "s" : ""} waiting to be linked to a
              client
            </p>
            <Link
              href="/coach/signups"
              className="shrink-0 text-sm font-medium text-rose hover:opacity-80"
            >
              Review →
            </Link>
          </div>
        </Card>
      ) : null}

      {clientsNeedingWindow > 0 ? (
        <Card className="border-gold/50 bg-gold/5">
          <p className="text-sm font-medium text-ink">
            It&apos;s the first week of the month — {clientsNeedingWindow}{" "}
            client{clientsNeedingWindow > 1 ? "s" : ""} still need
            {clientsNeedingWindow > 1 ? "" : "s"} this month&apos;s
            measurement or service check-in.
          </p>
        </Card>
      ) : null}

      {!clients || clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Add your first client to start building their program."
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const phase = phaseInfo(phaseByClient.get(client.id) ?? "n/a");
            const pending = pendingByClient.get(client.id) ?? 0;
            const needsWindow =
              inWindow &&
              (!loggedThisMonth(measurementDatesByClient.get(client.id) ?? []) ||
                !loggedThisMonth(serviceCheckinDatesByClient.get(client.id) ?? []));
            const highRisk = riskByClient.get(client.id) ?? false;
            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`}>
                <Card className="flex items-center justify-between transition hover:border-rose/40">
                  <div>
                    <p className="font-medium text-ink">{client.name}</p>
                    <p className="mt-0.5 text-sm text-gray">
                      {client.care_profiles?.name ?? "No care profile set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {highRisk ? (
                      <Badge tone="pink">high cancellation risk</Badge>
                    ) : null}
                    {needsWindow ? (
                      <Badge tone="gold">needs monthly check-in</Badge>
                    ) : null}
                    {pending > 0 ? (
                      <Badge tone="pink">
                        {pending} pending request{pending > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.name}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
