import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markDigestReviewed } from "@/app/coach/actions";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import type { Client } from "@/lib/types";

const REVIEW_WINDOW_DAYS = 7;
const STALE_PROGRAM_DAYS = 14;

interface SessionRow {
  client_id: string;
  day_label: string;
  date: string;
  rating: number | null;
  day_notes: string | null;
  entries: { notes?: string }[] | null;
}

export default async function DigestPage() {
  const supabase = await createClient();

  const { data: clients } = (await supabase
    .from("clients")
    .select("*")
    .eq("session_mode", "virtual")
    .eq("is_test", false)
    .is("archived_at", null)
    .order("name")) as { data: Client[] | null };

  const virtualClients = clients ?? [];
  const clientIds = virtualClients.map((c) => c.id);

  const sevenDaysAgo = toDateString(
    new Date(nowInBusinessTz().getTime() - (REVIEW_WINDOW_DAYS - 1) * 86400000)
  );

  const [
    { data: sessionRows },
    { data: checkinRows },
    { data: habitLogRows },
    { data: measurementRows },
  ] = clientIds.length
    ? await Promise.all([
        supabase
          .from("sessions")
          .select("client_id, day_label, date, rating, day_notes, entries")
          .in("client_id", clientIds)
          .gte("date", sevenDaysAgo) as unknown as Promise<{ data: SessionRow[] | null }>,
        supabase
          .from("checkins")
          .select("client_id, date")
          .in("client_id", clientIds)
          .gte("date", sevenDaysAgo),
        supabase
          .from("client_habit_logs")
          .select("client_id, log_date")
          .in("client_id", clientIds)
          .gte("log_date", sevenDaysAgo),
        supabase
          .from("measurements")
          .select("client_id, date")
          .in("client_id", clientIds)
          .gte("date", sevenDaysAgo),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const sessionsByClient = new Map<string, SessionRow[]>();
  for (const s of sessionRows ?? []) {
    const list = sessionsByClient.get(s.client_id) ?? [];
    list.push(s);
    sessionsByClient.set(s.client_id, list);
  }
  const checkinCountByClient = new Map<string, number>();
  for (const c of checkinRows ?? []) {
    checkinCountByClient.set(c.client_id, (checkinCountByClient.get(c.client_id) ?? 0) + 1);
  }
  const habitDaysByClient = new Map<string, Set<string>>();
  for (const h of habitLogRows ?? []) {
    const set = habitDaysByClient.get(h.client_id) ?? new Set<string>();
    set.add(h.log_date);
    habitDaysByClient.set(h.client_id, set);
  }
  const measurementCountByClient = new Map<string, number>();
  for (const m of measurementRows ?? []) {
    measurementCountByClient.set(
      m.client_id,
      (measurementCountByClient.get(m.client_id) ?? 0) + 1
    );
  }

  const today = nowInBusinessTz();
  function daysSince(dateStr: string | null): number | null {
    if (!dateStr) return null;
    return Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000);
  }

  const cards = virtualClients.map((client) => {
    const sessions = sessionsByClient.get(client.id) ?? [];
    const reviewedDaysAgo = daysSince(client.digest_reviewed_at);
    const needsReview = reviewedDaysAgo === null || reviewedDaysAgo >= REVIEW_WINDOW_DAYS;
    const programDaysAgo = daysSince(client.program_last_updated_at);
    const programStale = programDaysAgo === null || programDaysAgo >= STALE_PROGRAM_DAYS;
    const notes = sessions
      .flatMap((s) => [
        s.day_notes ? { date: s.date, text: s.day_notes } : null,
        ...(s.entries ?? [])
          .filter((e) => e.notes)
          .map((e) => ({ date: s.date, text: e.notes as string })),
      ])
      .filter((n): n is { date: string; text: string } => !!n);

    return {
      client,
      needsReview,
      programStale,
      programDaysAgo,
      sessionCount: sessions.length,
      avgRating:
        sessions.filter((s) => s.rating != null).length > 0
          ? sessions.reduce((sum, s) => sum + (s.rating ?? 0), 0) /
            sessions.filter((s) => s.rating != null).length
          : null,
      checkinCount: checkinCountByClient.get(client.id) ?? 0,
      habitDayCount: habitDaysByClient.get(client.id)?.size ?? 0,
      measurementCount: measurementCountByClient.get(client.id) ?? 0,
      notes,
    };
  });

  cards.sort((a, b) => {
    if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
    return a.client.name.localeCompare(b.client.name);
  });

  const needsReviewCount = cards.filter((c) => c.needsReview).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Weekly digest
      </h1>
      <p className="text-sm text-gray">
        The last {REVIEW_WINDOW_DAYS} days for every virtual client, so
        you&apos;re reacting to one summary instead of clicking into each
        profile cold.
        {needsReviewCount > 0
          ? ` ${needsReviewCount} client${needsReviewCount === 1 ? "" : "s"} need${
              needsReviewCount === 1 ? "s" : ""
            } a look.`
          : " Everyone's reviewed for this week."}
      </p>

      {cards.length === 0 ? (
        <EmptyState
          title="No virtual clients"
          body="This fills in once you have virtual/monitoring clients on the roster."
        />
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <Card
              key={c.client.id}
              className={c.needsReview ? "border-gold/40 bg-gold/5" : ""}
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/coach/clients/${c.client.id}`}
                  className="font-medium text-ink hover:text-rose"
                >
                  {c.client.name}
                </Link>
                {c.needsReview ? (
                  <Badge tone="gold">Needs review</Badge>
                ) : (
                  <Badge tone="teal">
                    Reviewed {c.client.digest_reviewed_at?.slice(0, 10)}
                  </Badge>
                )}
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray sm:grid-cols-4">
                <div>
                  <dt className="text-xs">Sessions logged</dt>
                  <dd className="text-ink">
                    {c.sessionCount}
                    {c.avgRating != null ? ` · avg ${c.avgRating.toFixed(1)}/5` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">Check-ins</dt>
                  <dd className="text-ink">{c.checkinCount}</dd>
                </div>
                <div>
                  <dt className="text-xs">Habit days</dt>
                  <dd className="text-ink">{c.habitDayCount} of {REVIEW_WINDOW_DAYS}</dd>
                </div>
                <div>
                  <dt className="text-xs">Program updated</dt>
                  <dd className={c.programStale ? "text-pink" : "text-ink"}>
                    {c.programDaysAgo == null
                      ? "never"
                      : c.programDaysAgo === 0
                        ? "today"
                        : `${c.programDaysAgo}d ago`}
                  </dd>
                </div>
              </dl>

              {c.notes.length > 0 ? (
                <div className="mt-2 space-y-1 border-t border-grayLt pt-2">
                  {c.notes.slice(0, 4).map((n, i) => (
                    <p key={i} className="text-xs text-gray">
                      <span className="text-ink">{n.date}:</span> {n.text}
                    </p>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/coach/clients/${c.client.id}?tab=log`}
                  className="rounded-xl border border-grayLt px-3 py-1.5 text-sm text-ink hover:bg-bg"
                >
                  Log
                </Link>
                <Link
                  href={`/coach/clients/${c.client.id}?tab=program`}
                  className="rounded-xl border border-grayLt px-3 py-1.5 text-sm text-ink hover:bg-bg"
                >
                  Program
                </Link>
                <Link
                  href={`/coach/clients/${c.client.id}?tab=checkins`}
                  className="rounded-xl border border-grayLt px-3 py-1.5 text-sm text-ink hover:bg-bg"
                >
                  Check-ins
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await markDigestReviewed(c.client.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-xl bg-rose px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Mark reviewed
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
