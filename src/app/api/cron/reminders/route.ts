import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendDocumentsPendingEmail,
  sendInactivityNudgeEmail,
  sendPaymentReminderEmail,
  sendSessionReminderEmail,
} from "@/lib/email";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { formatTimeOfDay } from "@/lib/schedule";
import { INACTIVITY_DAYS_THRESHOLD } from "@/lib/risk";

export const dynamic = "force-dynamic";

const PAYMENT_LOOKAHEAD_DAYS = 3;
const PAYMENT_RESEND_COOLDOWN_DAYS = 7;
// Re-check (and re-nudge) no more than once per this many days, so a
// client who stays quiet doesn't get emailed daily forever.
const INACTIVITY_NUDGE_COOLDOWN_DAYS = INACTIVITY_DAYS_THRESHOLD;
const DOCUMENT_NUDGE_COOLDOWN_DAYS = 14;

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

  let sessionReminders = 0;
  let paymentReminders = 0;
  let inactivityNudges = 0;
  let documentNudges = 0;
  const errors: string[] = [];

  // ---- Session reminders: schedules whose day falls tomorrow ----
  const { data: schedules } = await supabase
    .from("client_schedules")
    .select("id, client_id, time_of_day, label, clients(name, user_id)")
    .eq("active", true)
    .eq("day_of_week", tomorrowDayOfWeek);

  for (const schedule of schedules ?? []) {
    const client = (schedule as unknown as {
      clients: { name: string; user_id: string | null } | null;
    }).clients;
    if (!client?.user_id) continue;

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
        `tomorrow at ${formatTimeOfDay(schedule.time_of_day)}${
          schedule.label ? ` (${schedule.label})` : ""
        }`
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

  // ---- Payment reminders: due soon or overdue, not recently reminded ----
  const { data: payments } = await supabase
    .from("payments")
    .select("id, description, amount, due_date, reminder_sent_at, clients(name, user_id)")
    .is("paid_on", null)
    .lte("due_date", paymentLookaheadStr);

  for (const payment of payments ?? []) {
    const client = (payment as unknown as {
      clients: { name: string; user_id: string | null } | null;
    }).clients;
    if (!client?.user_id) continue;

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
        payment.due_date < todayDateStr
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
    .select("id, name, user_id, last_inactivity_nudge_sent_at")
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
        await sendInactivityNudgeEmail(userResult.user.email, client.name);
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

  // ---- Documents pending: any legal document not yet acknowledged at its
  // current version ----
  const { data: documents } = await supabase
    .from("legal_documents")
    .select("id, version");

  if (documents && documents.length > 0) {
    const { data: docClients } = await supabase
      .from("clients")
      .select("id, name, user_id, last_document_nudge_sent_at")
      .not("user_id", "is", null);

    const eligibleClients = (docClients ?? []).filter(
      (c) =>
        !c.last_document_nudge_sent_at ||
        c.last_document_nudge_sent_at < documentNudgeCooldownCutoff.toISOString()
    );

    if (eligibleClients.length > 0) {
      const eligibleClientIds = eligibleClients.map((c) => c.id);
      const { data: acks } = await supabase
        .from("client_document_acknowledgments")
        .select("client_id, document_id, document_version")
        .in("client_id", eligibleClientIds);

      const ackedKeys = new Set(
        (acks ?? []).map(
          (a) => `${a.client_id}:${a.document_id}:${a.document_version}`
        )
      );

      for (const client of eligibleClients) {
        const hasPending = documents.some(
          (d) => !ackedKeys.has(`${client.id}:${d.id}:${d.version}`)
        );
        if (!hasPending || !client.user_id) continue;

        const { data: userResult, error: userError } =
          await supabase.auth.admin.getUserById(client.user_id);
        if (userError || !userResult?.user?.email) {
          errors.push(`No email for client ${client.name}`);
          continue;
        }

        try {
          await sendDocumentsPendingEmail(userResult.user.email, client.name);
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

  return Response.json({
    ok: true,
    sessionReminders,
    paymentReminders,
    inactivityNudges,
    documentNudges,
    errors,
  });
}
