import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { unarchiveClient } from "@/app/coach/actions";
import { Button, Card, EmptyState, Heart } from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import { isFirstWeekOfMonth, loggedThisMonth } from "@/lib/measurement-window";
import { computeCancellationRisk } from "@/lib/risk";
import { toDateString } from "@/lib/timezone";
import { monthlyPaymentStatus, payAsYouGoStatus } from "@/lib/payment-status";
import type { Client, OccurrenceStatus } from "@/lib/types";

type ClientRow = Client & { care_profiles: { name: string } | null };

const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function shortDate(dateStr: string): string {
  return SHORT_DATE_FMT.format(new Date(`${dateStr}T00:00:00Z`));
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived: archivedParam } = await searchParams;
  const showArchived = archivedParam === "1";

  const supabase = await createClient();

  let clientsQuery = supabase
    .from("clients")
    .select("*, care_profiles(name)")
    .order("name");
  clientsQuery = showArchived
    ? clientsQuery.not("archived_at", "is", null)
    : clientsQuery.is("archived_at", null);
  const { data: clients } = (await clientsQuery) as unknown as {
    data: ClientRow[] | null;
  };

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
    { data: documentAckRows },
    { data: minorConsentRows },
    { data: allLinkedClientRows },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select("client_id, reschedule_from_date")
      .eq("status", "pending"),
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
          .select("client_id, due_date, paid_on, kind")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("session_occurrences")
          .select("client_id, status, occurrence_date, created_at")
          .in("client_id", clientIds)
          .order("occurrence_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("sessions")
          .select("client_id, date, payment_status, logged_by")
          .in("client_id", clientIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("service_checkins")
          .select("client_id, date, satisfaction")
          .in("client_id", clientIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("client_document_acknowledgments")
          .select("client_id, acknowledged_at")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase
          .from("client_minor_consent")
          .select("client_id, signed_at")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
    // Unfiltered by archived_at on purpose -- an archived client can still
    // have a linked login, and the "pending signup" count below needs to
    // know that regardless of which roster view (active/archived) is
    // currently showing, or it phantom-counts them as still unlinked.
    supabase.from("clients").select("user_id").not("user_id", "is", null),
  ]);

  const pendingRequestsByClient = new Map<
    string,
    { total: number; reschedules: number }
  >();
  for (const r of pendingRequests ?? []) {
    const cur = pendingRequestsByClient.get(r.client_id) ?? {
      total: 0,
      reschedules: 0,
    };
    cur.total += 1;
    if (r.reschedule_from_date) cur.reschedules += 1;
    pendingRequestsByClient.set(r.client_id, cur);
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

  const clientLoggedSessionDates = (sessionRows ?? []).filter(
    (r) => r.logged_by === "client"
  );
  const lastTrackedByClient = new Map<string, string>();
  for (const row of [
    ...(checkinRows ?? []),
    ...(activityRows ?? []),
    ...clientLoggedSessionDates,
  ]) {
    const prev = lastTrackedByClient.get(row.client_id);
    if (!prev || row.date > prev) lastTrackedByClient.set(row.client_id, row.date);
  }

  const overdueByClient = new Set(
    (paymentRows ?? [])
      .filter((p) => !p.paid_on && p.due_date < today)
      .map((p) => p.client_id)
  );

  const paymentsByClient = new Map<
    string,
    { due_date: string; paid_on: string | null }[]
  >();
  for (const p of paymentRows ?? []) {
    paymentsByClient.set(p.client_id, [
      ...(paymentsByClient.get(p.client_id) ?? []),
      { due_date: p.due_date, paid_on: p.paid_on },
    ]);
  }

  // sessionRows is ordered by date desc, so the first row seen per client
  // is their most recent session.
  const mostRecentPaymentStatusByClient = new Map<
    string,
    "paid" | "unpaid" | "waived" | null
  >();
  for (const row of sessionRows ?? []) {
    if (!mostRecentPaymentStatusByClient.has(row.client_id)) {
      mostRecentPaymentStatusByClient.set(row.client_id, row.payment_status ?? null);
    }
  }

  const occurrencesByClient = new Map<string, OccurrenceStatus[]>();
  for (const row of occurrenceRows ?? []) {
    if (row.status === "scheduled") continue;
    occurrencesByClient.set(row.client_id, [
      ...(occurrencesByClient.get(row.client_id) ?? []),
      row.status as OccurrenceStatus,
    ]);
  }

  // "Recent" flags (a cancellation, a signed document) fade off the board
  // on their own after a week instead of needing to be dismissed by hand.
  const recentWindowStart = toDateString(
    new Date(new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  const recentWindowEnd = toDateString(
    new Date(new Date(today).getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  // Value is {date, at}: `date` is the session's own date (for the flag's
  // text), `at` is when the cancellation was actually recorded (used to
  // tell whether the coach has viewed this client since it happened).
  const recentCancelledByClient = new Map<string, { date: string; at: string }>();
  const recentLateCancelledByClient = new Map<string, { date: string; at: string }>();
  for (const row of occurrenceRows ?? []) {
    if (row.occurrence_date < recentWindowStart || row.occurrence_date > recentWindowEnd) {
      continue;
    }
    if (row.status === "cancelled") {
      recentCancelledByClient.set(row.client_id, {
        date: row.occurrence_date,
        at: row.created_at,
      });
    } else if (row.status === "late_cancelled") {
      recentLateCancelledByClient.set(row.client_id, {
        date: row.occurrence_date,
        at: row.created_at,
      });
    }
  }

  const lateCancelFeeDueByClient = new Set(
    (paymentRows ?? [])
      .filter((p) => p.kind === "late_cancellation_fee" && !p.paid_on)
      .map((p) => p.client_id)
  );

  // Latest acknowledged/signed timestamp per client, within the window.
  const recentDocumentAtByClient = new Map<string, string>();
  for (const r of [
    ...(documentAckRows ?? []).map((r) => ({ client_id: r.client_id, at: r.acknowledged_at })),
    ...(minorConsentRows ?? [])
      .filter((r) => r.signed_at)
      .map((r) => ({ client_id: r.client_id, at: r.signed_at as string })),
  ]) {
    if (r.at.slice(0, 10) < recentWindowStart) continue;
    const prev = recentDocumentAtByClient.get(r.client_id);
    if (!prev || r.at > prev) recentDocumentAtByClient.set(r.client_id, r.at);
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
    (allLinkedClientRows ?? []).map((c) => c.user_id)
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
        <div>
          <h1 className="text-xl font-semibold text-ink">
            <Heart className="mr-1.5" />
            {showArchived ? "Archived clients" : "The Motherboard"}
          </h1>
          {!showArchived ? (
            <p className="mt-0.5 text-sm text-gray">
              Every client, every flag that needs you — one board.
            </p>
          ) : null}
        </div>
        {showArchived ? (
          <Link
            href="/coach/roster"
            className="text-sm text-gray hover:text-ink"
          >
            ← Back to Motherboard
          </Link>
        ) : (
          <Link
            href="/coach/roster/new"
            className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Add client
          </Link>
        )}
      </div>

      {!showArchived ? (
        <Link
          href="/coach/roster?archived=1"
          className="inline-block text-sm text-gray hover:text-ink"
        >
          View archived clients →
        </Link>
      ) : null}

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
          title={showArchived ? "No archived clients" : "No clients yet"}
          body={
            showArchived
              ? "Clients you archive show up here, with all their history intact."
              : "Add your first client to start building their program."
          }
        />
      ) : showArchived ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{client.name}</p>
                <p className="mt-0.5 text-sm text-gray">
                  {client.care_profiles?.name ?? "No care profile set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/coach/clients/${client.id}`}
                  className="text-sm text-gray hover:text-ink"
                >
                  View
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await unarchiveClient(client.id);
                  }}
                >
                  <Button type="submit" variant="secondary">
                    Restore
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const phase = phaseInfo(phaseByClient.get(client.id) ?? "n/a");
            const reqs = pendingRequestsByClient.get(client.id);
            const newRequests = (reqs?.total ?? 0) - (reqs?.reschedules ?? 0);
            const needsWindow =
              inWindow &&
              (!loggedThisMonth(measurementDatesByClient.get(client.id) ?? []) ||
                !loggedThisMonth(serviceCheckinDatesByClient.get(client.id) ?? []));
            const highRisk = riskByClient.get(client.id) ?? false;
            const paymentStatus =
              client.payment_schedule === "pay_as_you_go"
                ? payAsYouGoStatus(mostRecentPaymentStatusByClient.get(client.id))
                : client.payment_schedule === "monthly"
                  ? monthlyPaymentStatus(paymentsByClient.get(client.id) ?? [], today)
                  : null;

            // Purely informational events (a cancellation, a signed
            // document) only show up while the coach hasn't opened this
            // client's profile since they happened -- opening it counts
            // as "seen." Flags that still need an action from her (a
            // pending request, an unpaid fee, high risk) show regardless.
            const notYetSeen = (at: string) =>
              !client.last_viewed_at || client.last_viewed_at < at;

            const flags: string[] = [];
            if (newRequests > 0) {
              flags.push(
                newRequests === 1 ? "Requested time" : `Requested time (${newRequests})`
              );
            }
            if ((reqs?.reschedules ?? 0) > 0) {
              flags.push(
                reqs!.reschedules === 1
                  ? "Requested reschedule"
                  : `Requested reschedule (${reqs!.reschedules})`
              );
            }
            if (highRisk) flags.push("High risk");
            if (paymentStatus) flags.push(paymentStatus.label);
            if (lateCancelFeeDueByClient.has(client.id)) flags.push("Late cancel fee due");

            const lastTracked = lastTrackedByClient.get(client.id);
            const daysSinceActivity = lastTracked
              ? Math.floor(
                  (new Date(today).getTime() - new Date(lastTracked).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : Math.floor(
                  (new Date(today).getTime() - new Date(client.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
            const clientEstablished =
              new Date(today).getTime() - new Date(client.created_at).getTime() >
              3 * 24 * 60 * 60 * 1000;
            if (clientEstablished && daysSinceActivity > 3) {
              flags.push(`Inactive ${daysSinceActivity}+ days`);
            }

            const lateCancel = recentLateCancelledByClient.get(client.id);
            if (lateCancel && notYetSeen(lateCancel.at)) {
              flags.push(`Late cancellation (${shortDate(lateCancel.date)})`);
            }
            const cancel = recentCancelledByClient.get(client.id);
            if (cancel && notYetSeen(cancel.at)) {
              flags.push(`Cancelled ${shortDate(cancel.date)} session`);
            }
            const documentAt = recentDocumentAtByClient.get(client.id);
            if (documentAt && notYetSeen(documentAt)) {
              flags.push("Completed document");
            }
            if (needsWindow) flags.push("Needs monthly check-in");

            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`}>
                <Card className="transition hover:border-rose/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{client.name}</p>
                      <p className="mt-0.5 text-sm text-gray">
                        {client.care_profiles?.name ?? "No care profile set"}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.name}
                    </span>
                  </div>
                  {flags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {flags.map((f) => (
                        <span
                          key={f}
                          className="text-sm font-medium text-rose before:mr-1 before:content-['•']"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
