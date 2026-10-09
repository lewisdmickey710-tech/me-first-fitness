import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBlockedDatesReminderEmail,
  sendClassReminderEmail,
  sendDigestReadyEmail,
  sendDocumentsPendingEmail,
  sendEventReminderEmail,
  sendInactivityNudgeEmail,
  sendPaymentReminderEmail,
  sendServiceCheckinDueEmail,
  sendSessionReminderEmail,
} from "@/lib/email";
import { getCoachEmail, getCoachUserId } from "@/lib/coach";
import { sendPushToUser } from "@/lib/push";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { formatTimeOfDay, formatTimeOfDayForClient } from "@/lib/schedule";
import { computeCancellationRisk, INACTIVITY_DAYS_THRESHOLD } from "@/lib/risk";
import { FREE_HOLD_DAYS, RETAINER_FEE_PER_WEEK } from "@/lib/retainer";
import { computeStreak, nextStreakCelebration } from "@/lib/streaks";
import { getTodaysNotableWeather } from "@/lib/weather";
import type { OccurrenceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAYMENT_LOOKAHEAD_DAYS = 3;
const PAYMENT_RESEND_COOLDOWN_DAYS = 7;
// Re-check (and re-nudge) no more than once per this many days, so a
// client who stays quiet doesn't get emailed daily forever.
const INACTIVITY_NUDGE_COOLDOWN_DAYS = INACTIVITY_DAYS_THRESHOLD;
const DOCUMENT_NUDGE_COOLDOWN_DAYS = 14;
const SERVICE_CHECKIN_NUDGE_COOLDOWN_DAYS = 14;
const BLOCKED_DATE_REMINDER_LOOKAHEAD_DAYS = 3;
const DIGEST_REVIEW_WINDOW_DAYS = 7;
// Matches the "This week" framing on /coach/digest -- Monday in business tz.
const DIGEST_NUDGE_DAY_OF_WEEK = 1;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const now = nowInBusinessTz();

  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDateStr = toDateString(tomorrow);
  const tomorrowDayOfWeek = tomorrow.getUTCDay();

  const todayDateStr = toDateString(now);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayDateStr = toDateString(yesterday);
  const paymentLookahead = new Date(now);
  paymentLookahead.setUTCDate(
    paymentLookahead.getUTCDate() + PAYMENT_LOOKAHEAD_DAYS
  );
  const paymentLookaheadStr = toDateString(paymentLookahead);
  const resendCooldownCutoff = new Date(now);
  resendCooldownCutoff.setUTCDate(
    resendCooldownCutoff.getUTCDate() - PAYMENT_RESEND_COOLDOWN_DAYS
  );

  const inactivityCutoff = new Date(now);
  inactivityCutoff.setUTCDate(inactivityCutoff.getUTCDate() - INACTIVITY_DAYS_THRESHOLD);
  const inactivityCutoffStr = toDateString(inactivityCutoff);
  const nudgeCooldownCutoff = new Date(now);
  nudgeCooldownCutoff.setUTCDate(
    nudgeCooldownCutoff.getUTCDate() - INACTIVITY_NUDGE_COOLDOWN_DAYS
  );
  const documentNudgeCooldownCutoff = new Date(now);
  documentNudgeCooldownCutoff.setUTCDate(
    documentNudgeCooldownCutoff.getUTCDate() - DOCUMENT_NUDGE_COOLDOWN_DAYS
  );
  const serviceCheckinNudgeCooldownCutoff = new Date(now);
  serviceCheckinNudgeCooldownCutoff.setUTCDate(
    serviceCheckinNudgeCooldownCutoff.getUTCDate() - SERVICE_CHECKIN_NUDGE_COOLDOWN_DAYS
  );
  const monthStartStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  let sessionReminders = 0;
  let paymentReminders = 0;
  let inactivityNudges = 0;
  let documentNudges = 0;
  let serviceCheckinNudges = 0;
  let blockedDateReminders = 0;
  let eventReminders = 0;
  let streakCelebrations = 0;
  const errors: string[] = [];

  // ---- Session reminders: schedules whose day falls tomorrow ----
  const { data: frozenClientRows } = await supabase
    .from("payments")
    .select("client_id")
    .eq("kind", "late_cancellation_fee")
    .is("paid_on", null);
  const { data: heldClientRows } = await supabase
    .from("clients")
    .select("id")
    .not("hold_started_at", "is", null);
  // A client on hold isn't training right now -- skip session reminders
  // the same way an unpaid late fee freezes them, even if an old
  // client_schedule row is still sitting there active.
  const frozenClientIds = new Set([
    ...(frozenClientRows ?? []).map((p) => p.client_id),
    ...(heldClientRows ?? []).map((c) => c.id),
  ]);

  const { data: schedules } = await supabase
    .from("client_schedules")
    .select("id, client_id, time_of_day, label, clients(name, user_id, timezone, language)")
    .eq("active", true)
    .eq("day_of_week", tomorrowDayOfWeek);

  for (const schedule of schedules ?? []) {
    const client = (schedule as unknown as {
      clients: { name: string; user_id: string | null; timezone: string; language: "en" | "es" } | null;
    }).clients;
    if (!client?.user_id) continue;
    // Sessions are paused app-wide while a late cancellation fee is
    // unpaid -- don't remind the client about a session while frozen.
    if (frozenClientIds.has(schedule.client_id)) continue;

    const { data: existingLog } = await supabase
      .from("session_reminders_log")
      .select("id")
      .eq("client_schedule_id", schedule.id)
      .eq("occurrence_date", tomorrowDateStr)
      .maybeSingle();
    if (existingLog) continue;

    const { data: userResult, error: userError } =
      await supabase.auth.admin.getUserById(client.user_id);
    if (userError || !userResult?.user?.email) {
      errors.push(`No email for client ${client.name}`);
      continue;
    }

    try {
      const whenText = `tomorrow at ${formatTimeOfDayForClient(tomorrowDateStr, schedule.time_of_day, client.timezone)}${
        schedule.label ? ` (${schedule.label})` : ""
      }`;
      await sendSessionReminderEmail(
        userResult.user.email,
        client.name,
        whenText,
        client.language
      );
      await sendPushToUser(supabase, client.user_id, {
        title: "Session reminder",
        body: whenText,
        url: "/client/schedule",
      });
      await supabase.from("session_reminders_log").insert({
        client_schedule_id: schedule.id,
        occurrence_date: tomorrowDateStr,
      });
      sessionReminders++;
    } catch (e) {
      errors.push(`Session email failed for ${client.name}: ${e}`);
    }
  }

  // ---- One-off session reminders: confirmed time requests (status =
  // 'scheduled', no backing recurring client_schedule) falling tomorrow.
  // Dedup tracked directly on the occurrence row since
  // session_reminders_log requires a client_schedule_id these don't have.
  const { data: oneOffOccurrences } = await supabase
    .from("session_occurrences")
    .select("id, client_id, notes, reminder_sent_at, clients(name, user_id, timezone, language)")
    .eq("status", "scheduled")
    .eq("occurrence_date", tomorrowDateStr)
    .is("reminder_sent_at", null);

  for (const occurrence of oneOffOccurrences ?? []) {
    const client = (occurrence as unknown as {
      clients: { name: string; user_id: string | null; timezone: string; language: "en" | "es" } | null;
    }).clients;
    if (!client?.user_id) continue;
    if (frozenClientIds.has(occurrence.client_id)) continue;

    const { data: userResult, error: userError } =
      await supabase.auth.admin.getUserById(client.user_id);
    if (userError || !userResult?.user?.email) {
      errors.push(`No email for client ${client.name}`);
      continue;
    }

    const rawTime = occurrence.notes?.startsWith("Confirmed request — ")
      ? occurrence.notes.replace("Confirmed request — ", "")
      : null;
    const timeText = rawTime
      ? ` at ${formatTimeOfDayForClient(tomorrowDateStr, rawTime, client.timezone)}`
      : "";

    try {
      await sendSessionReminderEmail(
        userResult.user.email,
        client.name,
        `tomorrow${timeText}`,
        client.language
      );
      await sendPushToUser(supabase, client.user_id, {
        title: "Session reminder",
        body: `tomorrow${timeText}`,
        url: "/client/schedule",
      });
      await supabase
        .from("session_occurrences")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", occurrence.id);
      sessionReminders++;
    } catch (e) {
      errors.push(`Session email failed for ${client.name}: ${e}`);
    }
  }

  // ---- Event reminders: shared classes/workshops happening tomorrow,
  // to the coach and to everyone who's marked interest in it ----
  const { data: tomorrowEvents } = await supabase
    .from("coach_events")
    .select("id, kind, title, start_time")
    .eq("event_date", tomorrowDateStr)
    .eq("visible_to_clients", true)
    .is("reminder_sent_at", null);

  for (const event of tomorrowEvents ?? []) {
    try {
      const { data: interested } = await supabase
        .from("requests")
        .select("clients(name, user_id, timezone, language)")
        .eq("event_id", event.id)
        .eq("request_type", "class_interest")
        .in("status", ["pending", "confirmed"]);

      const interestedClients = (interested ?? [])
        .map(
          (r) =>
            (r as unknown as {
              clients: { name: string; user_id: string | null; timezone: string; language: "en" | "es" } | null;
            }).clients
        )
        .filter((c): c is { name: string; user_id: string | null; timezone: string; language: "en" | "es" } => !!c);

      for (const client of interestedClients) {
        if (!client.user_id) continue;
        const { data: userResult } = await supabase.auth.admin.getUserById(client.user_id);
        const whenText = `tomorrow at ${formatTimeOfDayForClient(tomorrowDateStr, event.start_time, client.timezone)}`;
        if (userResult?.user?.email) {
          await sendClassReminderEmail(
            userResult.user.email,
            client.name,
            event.title,
            event.kind,
            whenText,
            client.language
          );
        }
        await sendPushToUser(supabase, client.user_id, {
          title: `${event.title} is tomorrow`,
          body: whenText,
          url: "/client/schedule",
        });
      }

      const coachWhenText = `tomorrow at ${formatTimeOfDay(event.start_time)}`;
      const [coachEmail, coachUserId] = await Promise.all([
        getCoachEmail(supabase),
        getCoachUserId(supabase),
      ]);
      if (coachEmail) {
        await sendEventReminderEmail(
          coachEmail,
          event.title,
          event.kind,
          coachWhenText,
          interestedClients.length
        );
      }
      if (coachUserId) {
        await sendPushToUser(supabase, coachUserId, {
          title: `${event.title} is tomorrow`,
          body: coachWhenText,
          url: "/coach/classes",
        });
      }

      await supabase
        .from("coach_events")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", event.id);
      eventReminders++;
    } catch (e) {
      errors.push(`Event reminder failed for ${event.title}: ${e}`);
    }
  }

  // ---- Payment reminders: due soon or overdue, not recently reminded ----
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, description, amount, due_date, reminder_sent_at, clients(name, user_id, pro_bono, language)"
    )
    .is("paid_on", null)
    .lte("due_date", paymentLookaheadStr);

  for (const payment of payments ?? []) {
    const client = (payment as unknown as {
      clients: { name: string; user_id: string | null; pro_bono: boolean; language: "en" | "es" } | null;
    }).clients;
    if (!client?.user_id || client.pro_bono) continue;

    if (
      payment.reminder_sent_at &&
      payment.reminder_sent_at > resendCooldownCutoff.toISOString()
    ) {
      continue;
    }

    const { data: userResult, error: userError } =
      await supabase.auth.admin.getUserById(client.user_id);
    if (userError || !userResult?.user?.email) {
      errors.push(`No email for client ${client.name}`);
      continue;
    }

    try {
      await sendPaymentReminderEmail(
        userResult.user.email,
        client.name,
        payment.description,
        Number(payment.amount),
        payment.due_date,
        payment.due_date < todayDateStr,
        client.language
      );
      await supabase
        .from("payments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", payment.id);
      paymentReminders++;
    } catch (e) {
      errors.push(`Payment email failed for ${client.name}: ${e}`);
    }
  }

  // ---- Inactivity nudges: no self-logged check-in/activity in a while ----
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, user_id, last_inactivity_nudge_sent_at, language, notify_tracking_reminders")
    .not("user_id", "is", null);

  const activeClients = (clients ?? []).filter(
    (c) =>
      !c.last_inactivity_nudge_sent_at ||
      c.last_inactivity_nudge_sent_at < nudgeCooldownCutoff.toISOString()
  );

  if (activeClients.length > 0) {
    const activeClientIds = activeClients.map((c) => c.id);
    const [{ data: recentCheckins }, { data: recentActivities }] = await Promise.all([
      supabase
        .from("checkins")
        .select("client_id, date")
        .in("client_id", activeClientIds)
        .gte("date", inactivityCutoffStr),
      supabase
        .from("activities")
        .select("client_id, date")
        .in("client_id", activeClientIds)
        .gte("date", inactivityCutoffStr),
    ]);
    const trackedRecentlyIds = new Set(
      [...(recentCheckins ?? []), ...(recentActivities ?? [])].map(
        (r) => r.client_id
      )
    );

    for (const client of activeClients) {
      if (trackedRecentlyIds.has(client.id)) continue;
      if (!client.user_id) continue;

      const { data: userResult } = await supabase.auth.admin.getUserById(client.user_id);
      if (!userResult?.user?.email) {
        errors.push(`No email for client ${client.name}`);
      }

      try {
        if (userResult?.user?.email) {
          await sendInactivityNudgeEmail(userResult.user.email, client.name, client.language);
        }
        if (client.notify_tracking_reminders) {
          await sendPushToUser(supabase, client.user_id, {
            title: "Haven't seen you track in a bit",
            body: "No pressure -- just a nudge to log a check-in or activity when you get a chance.",
            url: "/client/dashboard",
          });
        }
        await supabase
          .from("clients")
          .update({ last_inactivity_nudge_sent_at: new Date().toISOString() })
          .eq("id", client.id);
        inactivityNudges++;
      } catch (e) {
        errors.push(`Inactivity nudge failed for ${client.name}: ${e}`);
      }
    }
  }

  // ---- Streak celebrations: daily habit-tracking streaks that hit a
  // fresh milestone as of yesterday. Only clients who logged a habit
  // yesterday can possibly be mid-streak -- anyone else's streak already
  // broke, and resets naturally the next time they log again. ----
  const { data: loggedYesterday } = await supabase
    .from("client_habit_logs")
    .select("client_id")
    .eq("log_date", yesterdayDateStr);
  const streakCandidateIds = [...new Set((loggedYesterday ?? []).map((r) => r.client_id))];

  if (streakCandidateIds.length > 0) {
    const { data: streakClients } = await supabase
      .from("clients")
      .select("id, name, user_id, notify_streaks, last_celebrated_streak_length")
      .in("id", streakCandidateIds)
      .eq("notify_streaks", true)
      .not("user_id", "is", null);

    for (const client of streakClients ?? []) {
      if (!client.user_id) continue;
      try {
        const { data: habitLogDates } = await supabase
          .from("client_habit_logs")
          .select("log_date")
          .eq("client_id", client.id)
          .gte("log_date", toDateString(new Date(yesterday.getTime() - 366 * 86400000)));
        const loggedDates = new Set((habitLogDates ?? []).map((r) => r.log_date));

        const currentStreak = computeStreak(loggedDates, yesterdayDateStr);
        const { celebrate, newLastCelebrated } = nextStreakCelebration(
          currentStreak,
          client.last_celebrated_streak_length
        );

        if (celebrate) {
          await sendPushToUser(supabase, client.user_id, {
            title: `🔥 ${currentStreak}-day streak!`,
            body: `You've tracked a habit ${currentStreak} days in a row. Keep it going!`,
            url: "/client/habits",
          });
          streakCelebrations++;
        }
        if (newLastCelebrated !== client.last_celebrated_streak_length) {
          await supabase
            .from("clients")
            .update({ last_celebrated_streak_length: newLastCelebrated })
            .eq("id", client.id);
        }
      } catch (e) {
        errors.push(`Streak celebration failed for ${client.name}: ${e}`);
      }
    }
  }

  // ---- Documents pending: any assigned legal document not yet
  // acknowledged at its current version. A document only counts against a
  // client if it's assigned_to_all, or the coach specifically assigned it
  // to that client (client_document_assignments). Minor Consent is never
  // assigned_to_all and is tracked separately (client_minor_consent.signed_at
  // instead of a generic acknowledgment) since it's a fillable form. ----
  const { data: documents } = await supabase
    .from("legal_documents")
    .select("id, key, version, assigned_to_all");

  if (documents && documents.length > 0) {
    const { data: docClients } = await supabase
      .from("clients")
      .select("id, name, user_id, last_document_nudge_sent_at, language")
      .not("user_id", "is", null);

    const eligibleClients = (docClients ?? []).filter(
      (c) =>
        !c.last_document_nudge_sent_at ||
        c.last_document_nudge_sent_at < documentNudgeCooldownCutoff.toISOString()
    );

    if (eligibleClients.length > 0) {
      const eligibleClientIds = eligibleClients.map((c) => c.id);
      const [{ data: acks }, { data: assignments }, { data: minorConsents }] =
        await Promise.all([
          supabase
            .from("client_document_acknowledgments")
            .select("client_id, document_id, document_version")
            .in("client_id", eligibleClientIds),
          supabase
            .from("client_document_assignments")
            .select("client_id, document_id")
            .in("client_id", eligibleClientIds),
          supabase
            .from("client_minor_consent")
            .select("client_id, signed_at")
            .in("client_id", eligibleClientIds),
        ]);

      const ackedKeys = new Set(
        (acks ?? []).map(
          (a) => `${a.client_id}:${a.document_id}:${a.document_version}`
        )
      );
      const assignedKeys = new Set(
        (assignments ?? []).map((a) => `${a.client_id}:${a.document_id}`)
      );
      const signedMinorConsentClientIds = new Set(
        (minorConsents ?? []).filter((c) => c.signed_at).map((c) => c.client_id)
      );

      const minorConsentDoc = documents.find((d) => d.key === "minor_consent");
      const otherDocuments = documents.filter((d) => d.key !== "minor_consent");

      for (const client of eligibleClients) {
        const hasPendingOther = otherDocuments.some((d) => {
          const isAssigned =
            d.assigned_to_all || assignedKeys.has(`${client.id}:${d.id}`);
          return isAssigned && !ackedKeys.has(`${client.id}:${d.id}:${d.version}`);
        });
        const hasPendingMinorConsent =
          !!minorConsentDoc &&
          assignedKeys.has(`${client.id}:${minorConsentDoc.id}`) &&
          !signedMinorConsentClientIds.has(client.id);
        const hasPending = hasPendingOther || hasPendingMinorConsent;
        if (!hasPending || !client.user_id) continue;

        const { data: userResult, error: userError } =
          await supabase.auth.admin.getUserById(client.user_id);
        if (userError || !userResult?.user?.email) {
          errors.push(`No email for client ${client.name}`);
          continue;
        }

        try {
          await sendDocumentsPendingEmail(userResult.user.email, client.name, client.language);
          await supabase
            .from("clients")
            .update({ last_document_nudge_sent_at: new Date().toISOString() })
            .eq("id", client.id);
          documentNudges++;
        } catch (e) {
          errors.push(`Documents email failed for ${client.name}: ${e}`);
        }
      }
    }
  }

  // ---- Service check-in due: a measurement was logged this month but no
  // service check-in yet -- was previously just a passive dashboard card
  // clients could easily miss (confirmed: happened), so this reaches out
  // the same way a pending document does. ----
  const { data: checkinClients } = await supabase
    .from("clients")
    .select("id, name, user_id, last_service_checkin_nudge_sent_at, language")
    .not("user_id", "is", null);

  const serviceCheckinEligible = (checkinClients ?? []).filter(
    (c) =>
      !c.last_service_checkin_nudge_sent_at ||
      c.last_service_checkin_nudge_sent_at <
        serviceCheckinNudgeCooldownCutoff.toISOString()
  );

  if (serviceCheckinEligible.length > 0) {
    const eligibleIds = serviceCheckinEligible.map((c) => c.id);
    const [{ data: measurementsThisMonth }, { data: checkinsThisMonth }] =
      await Promise.all([
        supabase
          .from("measurements")
          .select("client_id")
          .in("client_id", eligibleIds)
          .gte("date", monthStartStr),
        supabase
          .from("service_checkins")
          .select("client_id")
          .in("client_id", eligibleIds)
          .gte("date", monthStartStr),
      ]);

    const hasMeasurementThisMonth = new Set(
      (measurementsThisMonth ?? []).map((m) => m.client_id)
    );
    const hasCheckinThisMonth = new Set(
      (checkinsThisMonth ?? []).map((c) => c.client_id)
    );

    for (const client of serviceCheckinEligible) {
      if (
        !hasMeasurementThisMonth.has(client.id) ||
        hasCheckinThisMonth.has(client.id) ||
        !client.user_id
      )
        continue;

      const { data: userResult, error: userError } =
        await supabase.auth.admin.getUserById(client.user_id);
      if (userError || !userResult?.user?.email) {
        errors.push(`No email for client ${client.name}`);
        continue;
      }

      try {
        await sendServiceCheckinDueEmail(userResult.user.email, client.name, client.language);
        await supabase
          .from("clients")
          .update({ last_service_checkin_nudge_sent_at: new Date().toISOString() })
          .eq("id", client.id);
        serviceCheckinNudges++;
      } catch (e) {
        errors.push(`Service check-in email failed for ${client.name}: ${e}`);
      }
    }
  }

  // ---- Blocked-date reminders: a heads-up as a blocked day approaches,
  // for any client whose active recurring schedule falls on it -- on top
  // of the immediate email blockDate already sends when the day is first
  // blocked. Sent once per (client, date) via blocked_date_reminders_log
  // so it doesn't repeat every day within the lookahead window, and
  // consolidated into one email per client covering every qualifying date
  // found in this run rather than one email per date. ----
  const blockedDateLookahead = new Date(now);
  blockedDateLookahead.setUTCDate(
    blockedDateLookahead.getUTCDate() + BLOCKED_DATE_REMINDER_LOOKAHEAD_DAYS
  );
  const blockedDateLookaheadStr = toDateString(blockedDateLookahead);

  const { data: upcomingBlocks } = await supabase
    .from("coach_blocked_dates")
    .select("blocked_date, start_time, end_time")
    .gte("blocked_date", todayDateStr)
    .lte("blocked_date", blockedDateLookaheadStr);

  if (upcomingBlocks && upcomingBlocks.length > 0) {
    const { data: allActiveSchedules } = await supabase
      .from("client_schedules")
      .select("client_id, day_of_week, time_of_day")
      .eq("active", true);

    const { data: alreadyRemindedRows } = await supabase
      .from("blocked_date_reminders_log")
      .select("client_id, blocked_date");
    const alreadyReminded = new Set(
      (alreadyRemindedRows ?? []).map((r) => `${r.client_id}:${r.blocked_date}`)
    );

    const datesByClient = new Map<string, string[]>();
    for (const block of upcomingBlocks) {
      const dayOfWeek = new Date(`${block.blocked_date}T00:00:00Z`).getUTCDay();
      const isPartial = !!(block.start_time && block.end_time);
      const startNorm = block.start_time?.slice(0, 5) ?? null;
      const endNorm = block.end_time?.slice(0, 5) ?? null;

      for (const s of allActiveSchedules ?? []) {
        if (s.day_of_week !== dayOfWeek) continue;
        if (isPartial) {
          const norm = s.time_of_day.slice(0, 5);
          if (!(norm >= startNorm! && norm < endNorm!)) continue;
        }
        const key = `${s.client_id}:${block.blocked_date}`;
        if (alreadyReminded.has(key)) continue;
        const list = datesByClient.get(s.client_id) ?? [];
        list.push(block.blocked_date);
        datesByClient.set(s.client_id, list);
      }
    }

    for (const [clientId, dates] of datesByClient) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, user_id, language")
        .eq("id", clientId)
        .single();
      if (!client?.user_id) continue;

      const { data: userResult, error: userError } =
        await supabase.auth.admin.getUserById(client.user_id);
      if (userError || !userResult?.user?.email) {
        errors.push(`No email for client ${client.name}`);
        continue;
      }

      try {
        await sendBlockedDatesReminderEmail(userResult.user.email, client.name, dates, client.language);
        await supabase
          .from("blocked_date_reminders_log")
          .insert(dates.map((d) => ({ client_id: clientId, blocked_date: d })));
        blockedDateReminders++;
      } catch (e) {
        errors.push(`Blocked-date reminder failed for ${client.name}: ${e}`);
      }
    }
  }

  // ---- Weekly retainer billing: the first FREE_HOLD_DAYS of a hold are
  // free (no payment created in startClientHold), so the first retainer
  // payment is only due once a hold has run longer than that -- every
  // week after, it rolls a new payment forward one week after the last
  // one's due date, same as before. ----
  let retainerPayments = 0;
  const { data: onHoldClients } = await supabase
    .from("clients")
    .select("id, hold_started_at")
    .not("hold_started_at", "is", null);

  for (const client of onHoldClients ?? []) {
    const { data: lastRetainer } = await supabase
      .from("payments")
      .select("due_date")
      .eq("client_id", client.id)
      .eq("kind", "retainer")
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextDueStr: string;
    if (lastRetainer) {
      const nextDue = new Date(`${lastRetainer.due_date}T00:00:00Z`);
      nextDue.setUTCDate(nextDue.getUTCDate() + 7);
      nextDueStr = toDateString(nextDue);
    } else {
      const firstDue = new Date(client.hold_started_at!);
      firstDue.setUTCDate(firstDue.getUTCDate() + FREE_HOLD_DAYS);
      nextDueStr = toDateString(firstDue);
    }

    if (nextDueStr <= todayDateStr) {
      try {
        await supabase.from("payments").insert({
          client_id: client.id,
          description: "Weekly hold retainer",
          amount: RETAINER_FEE_PER_WEEK,
          due_date: nextDueStr,
          kind: "retainer",
        });
        retainerPayments++;
      } catch (e) {
        errors.push(`Retainer billing failed for client ${client.id}: ${e}`);
      }
    }
  }

  // ---- Weekly digest nudge: once a week (Monday), point the coach at
  // /coach/digest if any virtual client hasn't been reviewed in the last
  // DIGEST_REVIEW_WINDOW_DAYS days. business_settings.last_digest_email_sent_on
  // is the dedup guard -- this cron runs daily, so without it a Monday
  // that gets hit more than once (a retry, a manual trigger) could nudge
  // her twice in the same week. ----
  let digestNudgeSent = false;
  if (now.getUTCDay() === DIGEST_NUDGE_DAY_OF_WEEK) {
    const { data: settings } = await supabase
      .from("business_settings")
      .select("last_digest_email_sent_on")
      .eq("id", true)
      .maybeSingle();

    if (settings?.last_digest_email_sent_on !== todayDateStr) {
      try {
        const digestCutoff = new Date(now);
        digestCutoff.setUTCDate(digestCutoff.getUTCDate() - DIGEST_REVIEW_WINDOW_DAYS);
        const digestCutoffStr = toDateString(digestCutoff);

        const { data: virtualClients } = await supabase
          .from("clients")
          .select("id, digest_reviewed_at")
          .eq("session_mode", "virtual")
          .eq("is_test", false)
          .is("archived_at", null);

        const needsReviewCount = (virtualClients ?? []).filter(
          (c) => !c.digest_reviewed_at || c.digest_reviewed_at.slice(0, 10) < digestCutoffStr
        ).length;

        if (needsReviewCount > 0) {
          const to = await getCoachEmail(supabase);
          if (to) {
            await sendDigestReadyEmail(to, needsReviewCount);
            digestNudgeSent = true;
          }
        }

        await supabase
          .from("business_settings")
          .update({ last_digest_email_sent_on: todayDateStr })
          .eq("id", true);
      } catch (e) {
        errors.push(`Digest nudge failed: ${e}`);
      }
    }
  }

  // ---- Morning digest: a single push to the coach, once a day, with
  // today's schedule and what needs her attention -- dedup'd the same
  // way as the weekly digest email, just daily instead of weekly and
  // push instead of email. ----
  let morningDigestSent = false;
  {
    const { data: morningSettings } = await supabase
      .from("business_settings")
      .select("last_morning_digest_sent_on, weather_zip")
      .eq("id", true)
      .maybeSingle();

    if (morningSettings?.last_morning_digest_sent_on !== todayDateStr) {
      try {
        const todayDayOfWeek = now.getUTCDay();
        const yesterdayDayOfWeek = yesterday.getUTCDay();
        const riskLookback = toDateString(new Date(now.getTime() - 90 * 86400000));

        const [
          { data: todaySchedules },
          { data: todayOneOffs },
          { data: todayEvents },
          { data: pendingRequests },
          { data: overduePayments },
          { data: pendingSlidingScale },
          { data: readyLeads },
          { data: activeClients },
          { data: recentOccurrences },
          { data: recentCheckins },
          { data: recentActivities },
          { data: recentSessions },
          { data: overdueByClientRows },
          { data: latestServiceCheckins },
          { data: highRiskOverrides },
          { data: yesterdaySchedules },
          { data: paymentsYesterday },
        ] = await Promise.all([
          supabase
            .from("client_schedules")
            .select("client_id, clients(name, user_id, session_mode)")
            .eq("active", true)
            .eq("day_of_week", todayDayOfWeek),
          supabase
            .from("session_occurrences")
            .select("client_id, clients(name, user_id, session_mode)")
            .eq("status", "scheduled")
            .eq("occurrence_date", todayDateStr),
          supabase.from("coach_events").select("title").eq("event_date", todayDateStr),
          supabase
            .from("requests")
            .select("id")
            .eq("status", "pending")
            .neq("request_type", "class_interest"),
          supabase
            .from("payments")
            .select("id")
            .is("paid_on", null)
            .lt("due_date", todayDateStr),
          supabase.from("sliding_scale_applications").select("id").eq("status", "pending"),
          supabase
            .from("leads")
            .select("id")
            .eq("ready_to_transition", true)
            .neq("status", "converted")
            .neq("status", "archived"),
          supabase
            .from("clients")
            .select("id, name, days_per_week")
            .eq("is_test", false)
            .is("archived_at", null)
            .is("hold_started_at", null),
          supabase
            .from("session_occurrences")
            .select("client_id, status, occurrence_date")
            .gte("occurrence_date", riskLookback)
            .lte("occurrence_date", todayDateStr)
            .order("occurrence_date", { ascending: false }),
          supabase.from("checkins").select("client_id, date").gte("date", riskLookback),
          supabase.from("activities").select("client_id, date").gte("date", riskLookback),
          supabase
            .from("sessions")
            .select("client_id, date, coached")
            .gte("date", riskLookback),
          supabase.from("payments").select("client_id").is("paid_on", null),
          supabase
            .from("service_checkins")
            .select("client_id, satisfaction, date")
            .order("date", { ascending: false }),
          supabase.from("client_flag_overrides").select("client_id, until_date").eq("flag_key", "high_risk"),
          supabase
            .from("client_schedules")
            .select("client_id, clients(name)")
            .eq("active", true)
            .eq("day_of_week", yesterdayDayOfWeek),
          supabase
            .from("payments")
            .select("id, amount")
            .eq("paid_on", yesterdayDateStr),
        ]);

        const todayClientNames = new Set<string>();
        const todayInPersonUserIds = new Set<string>();
        for (const row of [...(todaySchedules ?? []), ...(todayOneOffs ?? [])]) {
          if (frozenClientIds.has(row.client_id)) continue;
          const c = (row as unknown as {
            clients: { name: string; user_id: string | null; session_mode: string | null } | null;
          }).clients;
          if (c?.name) todayClientNames.add(c.name);
          if (c?.user_id && c.session_mode !== "virtual") todayInPersonUserIds.add(c.user_id);
        }

        // ---- At-risk clients: same risk heuristic as the roster board,
        // same flag-override mechanism too -- a client she's already
        // marked "not tracking by choice, don't flag" there stays quiet
        // here as well, so there's exactly one place to tell the app
        // "this client just isn't going to use it that way" rather than
        // a second, redundant setting. ----
        const nameById = new Map((activeClients ?? []).map((c) => [c.id, c.name]));
        const overriddenHighRiskIds = new Set(
          (highRiskOverrides ?? [])
            .filter((o) => !o.until_date || o.until_date >= todayDateStr)
            .map((o) => o.client_id)
        );
        const occurrencesByClient = new Map<string, string[]>();
        for (const o of recentOccurrences ?? []) {
          if (o.status === "scheduled") continue;
          const list = occurrencesByClient.get(o.client_id) ?? [];
          list.push(o.status);
          occurrencesByClient.set(o.client_id, list);
        }
        const lastTrackedByClient = new Map<string, string>();
        for (const r of [...(recentCheckins ?? []), ...(recentActivities ?? [])]) {
          const existing = lastTrackedByClient.get(r.client_id);
          if (!existing || r.date > existing) lastTrackedByClient.set(r.client_id, r.date);
        }
        const overdueClientIds = new Set((overdueByClientRows ?? []).map((p) => p.client_id));
        const coachedCountByClient = new Map<string, number>();
        const twentyEightDaysAgo = toDateString(new Date(now.getTime() - 28 * 86400000));
        for (const s of recentSessions ?? []) {
          if (!s.coached || s.date < twentyEightDaysAgo) continue;
          coachedCountByClient.set(s.client_id, (coachedCountByClient.get(s.client_id) ?? 0) + 1);
        }
        const satisfactionByClient = new Map<string, number>();
        for (const sc of latestServiceCheckins ?? []) {
          if (sc.satisfaction == null) continue;
          if (!satisfactionByClient.has(sc.client_id)) {
            satisfactionByClient.set(sc.client_id, sc.satisfaction);
          }
        }

        const atRiskNames: string[] = [];
        for (const c of activeClients ?? []) {
          if (overriddenHighRiskIds.has(c.id)) continue;
          const lastTracked = lastTrackedByClient.get(c.id);
          const daysSince = lastTracked
            ? Math.floor((new Date(todayDateStr).getTime() - new Date(lastTracked).getTime()) / 86400000)
            : null;
          const expectedCount = (c.days_per_week ?? 3) * 4;
          const consistencyPct =
            expectedCount > 0
              ? Math.min(100, Math.round(((coachedCountByClient.get(c.id) ?? 0) / expectedCount) * 100))
              : null;
          const { level } = computeCancellationRisk({
            recentOccurrenceStatuses: (occurrencesByClient.get(c.id) ?? []) as OccurrenceStatus[],
            daysSinceLastCheckinOrActivity: daysSince,
            hasOverduePayment: overdueClientIds.has(c.id),
            consistencyPct,
            latestServiceCheckinSatisfaction: satisfactionByClient.get(c.id) ?? null,
          });
          if (level === "high") atRiskNames.push(c.name);
        }

        // ---- Yesterday recap: late cancellations, sessions nobody ever
        // logged either way, and what came in. ----
        const lateCancelledYesterdayNames = new Set<string>();
        const resolvedYesterdayClientIds = new Set<string>();
        for (const o of recentOccurrences ?? []) {
          if (o.occurrence_date !== yesterdayDateStr) continue;
          resolvedYesterdayClientIds.add(o.client_id);
          if (o.status === "late_cancelled") {
            const name = nameById.get(o.client_id);
            if (name) lateCancelledYesterdayNames.add(name);
          }
        }
        const loggedYesterdayClientIds = new Set(
          (recentSessions ?? []).filter((s) => s.date === yesterdayDateStr).map((s) => s.client_id)
        );
        const notLoggedYesterdayNames = new Set<string>();
        for (const row of yesterdaySchedules ?? []) {
          if (frozenClientIds.has(row.client_id)) continue;
          if (loggedYesterdayClientIds.has(row.client_id)) continue;
          if (resolvedYesterdayClientIds.has(row.client_id)) continue;
          const name = (row as unknown as { clients: { name: string } | null }).clients?.name;
          if (name) notLoggedYesterdayNames.add(name);
        }
        const paidYesterdayCount = (paymentsYesterday ?? []).length;
        const paidYesterdayTotal = (paymentsYesterday ?? []).reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );

        const recapParts = [
          notLoggedYesterdayNames.size > 0
            ? `${notLoggedYesterdayNames.size} not logged (${[...notLoggedYesterdayNames].join(", ")})`
            : null,
          lateCancelledYesterdayNames.size > 0
            ? `${lateCancelledYesterdayNames.size} late cancel (${[...lateCancelledYesterdayNames].join(", ")})`
            : null,
          paidYesterdayCount > 0 ? `$${paidYesterdayTotal.toFixed(0)} collected (${paidYesterdayCount})` : null,
        ].filter(Boolean);

        // ---- Weather: best-effort, silent if no zip is set or either
        // free API has a hiccup -- never worth failing the whole digest
        // over. ----
        let weatherLine: string | null = null;
        if (morningSettings?.weather_zip) {
          const weather = await getTodaysNotableWeather(morningSettings.weather_zip);
          if (weather?.isNotable) {
            weatherLine = weather.summary;
            await Promise.all(
              [...todayInPersonUserIds].map((userId) =>
                sendPushToUser(supabase, userId, {
                  title: "Weather heads up",
                  body: `${weather.summary} — today's your session with Mickey.`,
                  url: "/client/schedule",
                }).catch((err) => console.error("Weather push failed", err))
              )
            );
          }
        }

        const sessionCount = todayClientNames.size;
        const classCount = (todayEvents ?? []).length;
        const scheduleLine =
          sessionCount === 0 && classCount === 0
            ? "Nothing on the calendar today"
            : [
                sessionCount > 0 ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}` : null,
                classCount > 0 ? `${classCount} class${classCount === 1 ? "" : "es"}` : null,
              ]
                .filter(Boolean)
                .join(", ");
        const namesArr = [...todayClientNames];
        const namesPart =
          namesArr.length === 0
            ? ""
            : namesArr.length <= 4
              ? ` — ${namesArr.join(", ")}`
              : ` — ${namesArr.slice(0, 3).join(", ")} and ${namesArr.length - 3} more`;

        const adminParts = [
          (pendingRequests ?? []).length > 0
            ? `${(pendingRequests ?? []).length} request${(pendingRequests ?? []).length === 1 ? "" : "s"}`
            : null,
          (overduePayments ?? []).length > 0
            ? `${(overduePayments ?? []).length} overdue payment${(overduePayments ?? []).length === 1 ? "" : "s"}`
            : null,
          (pendingSlidingScale ?? []).length > 0
            ? `${(pendingSlidingScale ?? []).length} sliding-scale app${(pendingSlidingScale ?? []).length === 1 ? "" : "s"}`
            : null,
          (readyLeads ?? []).length > 0
            ? `${(readyLeads ?? []).length} lead${(readyLeads ?? []).length === 1 ? "" : "s"} ready`
            : null,
          atRiskNames.length > 0
            ? `${atRiskNames.length} at risk (${atRiskNames.join(", ")})`
            : null,
        ].filter(Boolean);
        const adminLine = adminParts.length > 0 ? adminParts.join(", ") : "nothing pending";

        const bodyLines = [`Today: ${scheduleLine}${namesPart}.`, `Admin: ${adminLine}.`];
        if (recapParts.length > 0) bodyLines.push(`Yesterday: ${recapParts.join(", ")}.`);
        if (weatherLine) bodyLines.push(`Weather: ${weatherLine}.`);

        const coachUserId = await getCoachUserId(supabase);
        if (coachUserId) {
          await sendPushToUser(supabase, coachUserId, {
            title: "Good morning ☀️",
            body: bodyLines.join(" "),
            url: "/coach/dashboard",
          });
          morningDigestSent = true;
        }

        await supabase
          .from("business_settings")
          .update({ last_morning_digest_sent_on: todayDateStr })
          .eq("id", true);
      } catch (e) {
        errors.push(`Morning digest failed: ${e}`);
      }
    }
  }

  return Response.json({
    ok: true,
    sessionReminders,
    paymentReminders,
    inactivityNudges,
    documentNudges,
    serviceCheckinNudges,
    blockedDateReminders,
    eventReminders,
    streakCelebrations,
    retainerPayments,
    digestNudgeSent,
    morningDigestSent,
    errors,
  });
}
