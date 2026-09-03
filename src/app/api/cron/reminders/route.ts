import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBlockedDatesReminderEmail,
  sendDocumentsPendingEmail,
  sendInactivityNudgeEmail,
  sendPaymentReminderEmail,
  sendServiceCheckinDueEmail,
  sendSessionReminderEmail,
} from "@/lib/email";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { formatTimeOfDayForClient } from "@/lib/schedule";
import { INACTIVITY_DAYS_THRESHOLD } from "@/lib/risk";
import { FREE_HOLD_DAYS, RETAINER_FEE_PER_WEEK } from "@/lib/retainer";

export const dynamic = "force-dynamic";

const PAYMENT_LOOKAHEAD_DAYS = 3;
const PAYMENT_RESEND_COOLDOWN_DAYS = 7;
// Re-check (and re-nudge) no more than once per this many days, so a
// client who stays quiet doesn't get emailed daily forever.
const INACTIVITY_NUDGE_COOLDOWN_DAYS = INACTIVITY_DAYS_THRESHOLD;
const DOCUMENT_NUDGE_COOLDOWN_DAYS = 14;
const SERVICE_CHECKIN_NUDGE_COOLDOWN_DAYS = 14;
const BLOCKED_DATE_REMINDER_LOOKAHEAD_DAYS = 3;

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
      await sendSessionReminderEmail(
        userResult.user.email,
        client.name,
        `tomorrow at ${formatTimeOfDayForClient(tomorrowDateStr, schedule.time_of_day, client.timezone)}${
          schedule.label ? ` (${schedule.label})` : ""
        }`,
        client.language
      );
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
      await supabase
        .from("session_occurrences")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", occurrence.id);
      sessionReminders++;
    } catch (e) {
      errors.push(`Session email failed for ${client.name}: ${e}`);
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
    .select("id, name, user_id, last_inactivity_nudge_sent_at, language")
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

      const { data: userResult, error: userError } =
        await supabase.auth.admin.getUserById(client.user_id);
      if (userError || !userResult?.user?.email) {
        errors.push(`No email for client ${client.name}`);
        continue;
      }

      try {
        await sendInactivityNudgeEmail(userResult.user.email, client.name, client.language);
        await supabase
          .from("clients")
          .update({ last_inactivity_nudge_sent_at: new Date().toISOString() })
          .eq("id", client.id);
        inactivityNudges++;
      } catch (e) {
        errors.push(`Inactivity email failed for ${client.name}: ${e}`);
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

  return Response.json({
    ok: true,
    sessionReminders,
    paymentReminders,
    inactivityNudges,
    documentNudges,
    serviceCheckinNudges,
    blockedDateReminders,
    retainerPayments,
    errors,
  });
}
