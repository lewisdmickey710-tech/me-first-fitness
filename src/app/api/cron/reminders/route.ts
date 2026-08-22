import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentReminderEmail, sendSessionReminderEmail } from "@/lib/email";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { formatTimeOfDay } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const PAYMENT_LOOKAHEAD_DAYS = 3;
const PAYMENT_RESEND_COOLDOWN_DAYS = 7;

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

  let sessionReminders = 0;
  let paymentReminders = 0;
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

  return Response.json({ ok: true, sessionReminders, paymentReminders, errors });
}
