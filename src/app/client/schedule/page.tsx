import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyClient } from "@/lib/current-client";
import { cancelMySession, submitClassInterest } from "@/app/client/actions";
import { Badge, Button, Card, Collapsible, EmptyState, Heart } from "@/components/ui";
import { PaymentMethods } from "@/components/payment-methods";
import { ConfirmButton } from "@/components/confirm-button";
import { DAY_NAMES, formatTimeOfDay, formatTimeOfDayForClient } from "@/lib/schedule";
import { hoursUntilOccurrence, LATE_CANCEL_NOTICE_HOURS } from "@/lib/cancellation";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { makeT } from "@/lib/i18n";
import type {
  BusinessSettings,
  ClientSchedule,
  CoachEvent,
  Payment,
  SessionOccurrence,
} from "@/lib/types";

const DOT_TONE: Record<string, string> = {
  scheduled: "bg-teal",
  completed: "bg-green",
  cancelled: "bg-pink",
  late_cancelled: "bg-pink",
  rescheduled: "bg-gold",
  needs_logging: "bg-purple",
};

const WEEKDAY_SHORT_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_SHORT_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const SCHEDULE_QUOTE =
  "Motivation is what gets you started, habits are what keep you going.";
const SCHEDULE_QUOTE_ES =
  "La motivación es lo que te pone en marcha, los hábitos son lo que te mantiene en movimiento.";

export default async function ClientSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
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

  const t = makeT(me.language);
  const isEs = me.language === "es";
  const STATUS_LABEL: Record<string, string> = {
    completed: t("Completed"),
    cancelled: t("Cancelled"),
    late_cancelled: t("Late cancelled"),
    rescheduled: t("Rescheduled"),
    needs_logging: t("Not yet logged"),
  };
  const MONTH_LABEL_FMT = new Intl.DateTimeFormat(isEs ? "es" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const WEEKDAY_SHORT = isEs ? WEEKDAY_SHORT_ES : WEEKDAY_SHORT_EN;

  const supabase = await createClient();

  const [{ data: schedules }, { data: unpaidFees }] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true) as unknown as Promise<{ data: ClientSchedule[] | null }>,
    supabase
      .from("payments")
      .select("*")
      .eq("client_id", me.id)
      .eq("kind", "late_cancellation_fee")
      .is("paid_on", null) as unknown as Promise<{ data: Payment[] | null }>,
  ]);

  if (me.hold_started_at) {
    return (
      <div className="space-y-6">
        <BackLink href="/client/dashboard" />
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("Your schedule")}
        </h1>
        <Card className="space-y-1 border-gold/40 bg-gold/5">
          <p className="font-medium text-ink">{t("Your spot is on hold")}</p>
          <p className="text-sm text-gray">
            {t(
              "You're not currently scheduled for sessions — the weekly $10 retainer keeps your app access and reserves your spot for whenever you're ready to come back. Reach out to Mickey when you want to resume."
            )}
          </p>
        </Card>
      </div>
    );
  }

  const frozen = (unpaidFees ?? []).length > 0;

  if (frozen) {
    const fee = unpaidFees![0];
    const { data: businessSettings } = (await supabase
      .from("business_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()) as { data: BusinessSettings | null };
    return (
      <div className="space-y-6">
        <BackLink href="/client/dashboard" />
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("Your schedule")}
        </h1>
        <Card className="space-y-2 border-pink/40">
          <p className="font-medium text-pink">{t("Sessions paused")}</p>
          <p className="text-sm text-ink">
            {t(
              "A ${amount} late cancellation fee is outstanding. Your upcoming sessions are paused until it's paid — send it using one of the methods below, and your schedule will pick back up right away.",
              { amount: fee.amount }
            )}
          </p>
          <PaymentMethods settings={businessSettings} />
        </Card>
      </div>
    );
  }

  const { month: monthParam, date: dateParam } = await searchParams;

  const now = nowInBusinessTz();
  const todayStr = toDateString(now);

  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();
  const firstDateStr = toDateString(firstOfMonth);
  const lastDateStr = toDateString(new Date(Date.UTC(year, month, daysInMonth)));

  const activeSchedules = schedules ?? [];
  const scheduleByDayOfWeek = new Map<number, ClientSchedule[]>();
  for (const s of activeSchedules) {
    const list = scheduleByDayOfWeek.get(s.day_of_week) ?? [];
    list.push(s);
    scheduleByDayOfWeek.set(s.day_of_week, list);
  }

  const [{ data: monthOccurrences }, { data: businessSettings }, { data: monthSessions }] =
    await Promise.all([
      supabase
        .from("session_occurrences")
        .select("*")
        .eq("client_id", me.id)
        .gte("occurrence_date", firstDateStr)
        .lte("occurrence_date", lastDateStr),
      supabase
        .from("business_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle() as unknown as Promise<{ data: BusinessSettings | null }>,
      supabase
        .from("sessions")
        .select("date")
        .eq("client_id", me.id)
        .gte("date", firstDateStr)
        .lte("date", lastDateStr),
    ]);

  const occurrenceByDate = new Map<string, SessionOccurrence>();
  for (const o of monthOccurrences ?? []) {
    occurrenceByDate.set(o.occurrence_date, o);
  }
  // Logging a session never touches session_occurrences -- they're
  // independent -- so a day only reads as truly resolved if either one
  // says so.
  const loggedSessionDates = new Set((monthSessions ?? []).map((s) => s.date));

  const cells: { day: number; date: string; status: string | null }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = toDateString(date);
    const existing = occurrenceByDate.get(dateStr);
    const isScheduledDay = scheduleByDayOfWeek.has(date.getUTCDay());
    let status: string | null = existing ? existing.status : isScheduledDay ? "scheduled" : null;
    if (status === "scheduled" && dateStr < todayStr && !loggedSessionDates.has(dateStr)) {
      status = "needs_logging";
    }
    cells.push({ day, date: dateStr, status });
  }

  const selectedDate = dateParam ?? (monthKey === toDateString(now).slice(0, 7) ? todayStr : null);
  const selectedCell = cells.find((c) => c.date === selectedDate) ?? null;
  const selectedSchedules = selectedCell
    ? scheduleByDayOfWeek.get(new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()) ?? []
    : [];
  const selectedOccurrence = selectedDate ? occurrenceByDate.get(selectedDate) : undefined;

  const prevMonthDate = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const prevMonthKey = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonthKey = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const [{ data: events }, { data: myInterest }] = await Promise.all([
    supabase
      .from("coach_events")
      .select("*")
      .eq("visible_to_clients", true)
      .gte("event_date", todayStr)
      .order("event_date", { ascending: true }) as unknown as Promise<{ data: CoachEvent[] | null }>,
    supabase
      .from("requests")
      .select("event_id")
      .eq("client_id", me.id)
      .eq("request_type", "class_interest")
      .in("status", ["pending", "confirmed"]),
  ]);

  const interestedEventIds = new Set((myInterest ?? []).map((r) => r.event_id));
  const eventPdfPaths = (events ?? []).filter((e) => e.pdf_path).map((e) => e.pdf_path as string);
  const eventPdfUrlByPath = new Map<string, string>();
  if (eventPdfPaths.length > 0) {
    const admin = createAdminClient();
    await Promise.all(
      eventPdfPaths.map(async (path) => {
        const { data } = await admin.storage.from("class-pdfs").createSignedUrl(path, 3600);
        if (data) eventPdfUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Your schedule")}
      </h1>
      <p className="text-sm italic text-gray">
        <Heart className="mr-1" />
        &quot;{isEs ? SCHEDULE_QUOTE_ES : SCHEDULE_QUOTE}&quot;
      </p>

      <Collapsible label={t("Cancellation policy")}>
        <p className="text-sm text-gray">
          {t(
            "Cancelling with less than {hours} hours notice counts as a late cancellation. A first one is just noted — every one after that within 16 weeks brings a $10 fee and pauses your sessions until it's paid.",
            { hours: LATE_CANCEL_NOTICE_HOURS }
          )}
        </p>
      </Collapsible>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            <Heart className="mr-1.5" />
            {t('Want more "me time"?')}
          </p>
          <p className="mt-1 text-sm text-gray">
            {t("Ask for an extra session or a different time.")}
          </p>
        </div>
        <Link href="/client/request" className="shrink-0">
          <Button type="button" variant="secondary">
            {t("Request time")}
          </Button>
        </Link>
      </Card>

      {(events ?? []).length > 0 ? (
        <div className="space-y-3">
          <p className="font-medium text-ink">{t("Classes & Workshops")}</p>
          {(events ?? []).map((e) => {
            const interested = interestedEventIds.has(e.id);
            const pdfUrl = e.pdf_path ? eventPdfUrlByPath.get(e.pdf_path) : undefined;
            return (
              <Card key={e.id} className="space-y-2">
                <Badge tone={e.kind === "workshop" ? "gold" : "teal"}>
                  {e.kind === "workshop" ? t("Workshop") : t("Group class")}
                </Badge>
                <p className="font-medium text-ink">{e.title}</p>
                <p className="text-sm text-gray">
                  {e.event_date} · {formatTimeOfDay(e.start_time)}–{formatTimeOfDay(e.end_time)}
                </p>
                {e.description ? <p className="text-sm text-ink">{e.description}</p> : null}
                {pdfUrl ? (
                  <a href={pdfUrl} target="_blank" rel="noreferrer" className="block text-sm text-rose hover:underline">
                    {t("View class format →")}
                  </a>
                ) : null}
                {interested ? (
                  <p className="text-sm font-medium text-teal">
                    {t("✓ You're on the list — Mickey will reach out.")}
                  </p>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await submitClassInterest(e.id);
                    }}
                  >
                    <Button type="submit" variant="secondary">
                      {t("I'm interested")}
                    </Button>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}

      <Card>
        <div className="flex items-center justify-between">
          <Link
            href={`/client/schedule?month=${prevMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            {t("← Prev")}
          </Link>
          <p className="font-medium text-ink">
            {MONTH_LABEL_FMT.format(firstOfMonth)}
          </p>
          <Link
            href={`/client/schedule?month=${nextMonthKey}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            {t("Next →")}
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-gray">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {cells.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === todayStr;
            return (
              <Link
                key={cell.date}
                href={`/client/schedule?month=${monthKey}&date=${cell.date}`}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm ${
                  isSelected
                    ? "bg-rose text-white"
                    : isToday
                      ? "border border-rose text-ink"
                      : "text-ink hover:bg-bg"
                }`}
              >
                {cell.day}
                {cell.status ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : DOT_TONE[cell.status]
                    }`}
                  />
                ) : (
                  <span className="h-1.5 w-1.5" />
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      {!selectedCell ? (
        <EmptyState
          title={t("No session that day")}
          body={t("Tap a highlighted date on the calendar to see details.")}
        />
      ) : (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">
              {t(DAY_NAMES[new Date(`${selectedCell.date}T00:00:00Z`).getUTCDay()])},{" "}
              {selectedCell.date}
            </p>
            {selectedCell.status ? (
              <Badge
                tone={
                  selectedCell.status === "completed"
                    ? "green"
                    : selectedCell.status === "scheduled"
                      ? "teal"
                      : selectedCell.status === "needs_logging"
                        ? "purple"
                        : "gold"
                }
              >
                {selectedCell.status === "scheduled"
                  ? t("Scheduled")
                  : STATUS_LABEL[selectedCell.status]}
                {(selectedCell.status === "cancelled" ||
                  selectedCell.status === "late_cancelled") &&
                selectedOccurrence?.cancelled_by
                  ? selectedOccurrence.cancelled_by === "coach"
                    ? ` — ${t("Mickey cancelled")}`
                    : ` — ${t("you cancelled")}`
                  : ""}
              </Badge>
            ) : null}
          </div>

          {selectedCell.status === null ? (
            <p className="text-sm text-gray">{t("Nothing on the schedule this day.")}</p>
          ) : null}

          {selectedCell.status === "scheduled" &&
          (selectedOccurrence?.is_video_session ?? me.session_mode === "virtual") ? (
            businessSettings?.google_meet_link ? (
              <a
                href={businessSettings.google_meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t("Join video call →")}
              </a>
            ) : (
              <p className="text-sm text-gray">
                {t("This is a video session — Mickey will share the call link.")}
              </p>
            )
          ) : null}

          {selectedCell.status === "cancelled" &&
          selectedOccurrence?.cancelled_by === "coach" ? (
            <p className="text-sm text-gray">
              {t(
                "Mickey cancelled this one — no fee, and you've got a free reschedule whenever works for you."
              )}
            </p>
          ) : null}

          {selectedOccurrence?.status === "rescheduled" &&
          selectedOccurrence.rescheduled_to_date ? (
            <p className="text-sm text-gray">
              {t("Moved to {date}", { date: selectedOccurrence.rescheduled_to_date })}
            </p>
          ) : null}

          {selectedOccurrence?.status === "scheduled" &&
          selectedSchedules.length === 0 &&
          selectedOccurrence.notes ? (
            <p className="text-sm text-gray">{selectedOccurrence.notes}</p>
          ) : null}

          {selectedSchedules.map((s) => (
            <p key={s.id} className="text-sm text-gray">
              {formatTimeOfDayForClient(selectedCell.date, s.time_of_day, me.timezone)}
              {s.label ? ` · ${s.label}` : ""}
            </p>
          ))}

          {selectedCell.status === "scheduled" ? (
            (() => {
              // One-off confirmed requests have no recurring schedule --
              // the time they asked for (if any) is stashed in notes as
              // "Confirmed request — HH:MM" when setRequestStatus created
              // this row, so pull it back out for the late-cancel check.
              const oneOffTimeMatch = selectedOccurrence?.notes?.match(
                /Confirmed request — (\d{2}:\d{2})/
              );
              const timeOfDay =
                selectedSchedules[0]?.time_of_day ?? oneOffTimeMatch?.[1] ?? null;
              const scheduleId = selectedSchedules[0]?.id ?? null;

              const hours = timeOfDay
                ? hoursUntilOccurrence(selectedCell.date, timeOfDay)
                : null;
              const wouldBeLate = hours !== null && hours < LATE_CANCEL_NOTICE_HOURS;
              const isPast =
                hours !== null ? hours < -24 : selectedCell.date < todayStr;
              if (isPast) return null;

              return (
                <div className="flex flex-wrap items-center gap-2 border-t border-grayLt pt-3">
                  {wouldBeLate ? (
                    <p className="w-full text-xs text-pink">
                      {t(
                        "Cancelling now is under {hours} hours notice — this will count as a late cancellation.",
                        { hours: LATE_CANCEL_NOTICE_HOURS }
                      )}
                    </p>
                  ) : timeOfDay === null ? (
                    <p className="w-full text-xs text-gray">
                      {t(
                        "No exact time on file for this one — cancelling won't be checked against the 12-hour notice window."
                      )}
                    </p>
                  ) : null}
                  <form
                    action={async () => {
                      "use server";
                      await cancelMySession(scheduleId, selectedCell.date, timeOfDay);
                    }}
                  >
                    <ConfirmButton
                      variant="danger"
                      confirmText={t("Cancel this session? This can't be undone.")}
                    >
                      {t("Cancel")}
                    </ConfirmButton>
                  </form>
                  <Link href={`/client/request?reschedule_from=${selectedCell.date}`}>
                    <Button type="button" variant="secondary">
                      {t("Request reschedule")}
                    </Button>
                  </Link>
                </div>
              );
            })()
          ) : null}
        </Card>
      )}
    </div>
  );
}
