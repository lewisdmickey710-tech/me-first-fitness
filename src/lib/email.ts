import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "MeFirstFitness <onboarding@resend.dev>";

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2B2320;">
      <p style="font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #E75480; font-weight: 600; margin-bottom: 4px;">
        &hearts; MeFirstFitness
      </p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #8A8078;">
        Mind &amp; Muscle Mechanics
      </p>
    </div>
  `;
}

export async function sendSessionReminderEmail(
  to: string,
  clientName: string,
  whenText: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping session reminder email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your session is coming up",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>Just a heads up — your next session is <strong>${whenText}</strong>. See you then!</p>
    `),
  });
}

export async function sendInactivityNudgeEmail(to: string, clientName: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping inactivity nudge email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Haven't seen you check in",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>Just checking in — I haven't seen a check-in or activity log from you in a bit. No pressure at all, just wanted you to know I noticed and I'm here if anything's come up.</p>
      <p>Whenever you get a chance, log a quick check-in in the app so I can see how things are going.</p>
    `),
  });
}

export async function sendPaymentReminderEmail(
  to: string,
  clientName: string,
  description: string,
  amount: number,
  dueDateText: string,
  isOverdue: boolean
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping payment reminder email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: isOverdue ? "Payment past due" : "Payment reminder",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>${
        isOverdue
          ? "This is a friendly reminder that a payment is past due:"
          : "This is a friendly reminder about an upcoming payment:"
      }</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${description}</strong><br/>
        $${amount.toFixed(2)} — due ${dueDateText}
      </p>
      <p>Let me know if you have any questions!</p>
    `),
  });
}
