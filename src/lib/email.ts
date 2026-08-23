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

export async function sendWelcomeToClientEmail(to: string, clientName: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping welcome email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome aboard!",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>You're officially signed on — so excited to keep working with you. A couple of things to knock out in the app before your next session:</p>
      <ul style="padding-left: 20px;">
        <li>A quick intake questionnaire (health history, goals, how you like to be coached) — takes a few minutes and helps me build your program around you specifically.</li>
        <li>Your contract and a couple of other documents, ready for your review and sign-off.</li>
      </ul>
      <p>Log in and you'll be walked through it. Let me know if anything comes up!</p>
    `),
  });
}

export async function sendServiceCheckinDueEmail(to: string, clientName: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping service check-in email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Quick check-in — how's it going overall?",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>Now that this month's measurements are in, it's a good time for your quick service check-in — how coaching's feeling overall, what's working, what's not.</p>
      <p>Log in and you'll see it waiting on your dashboard. Takes just a minute.</p>
    `),
  });
}

export async function sendDocumentsPendingEmail(to: string, clientName: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping documents pending email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "A document needs your attention",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>You've got at least one document waiting for your review in the app — nothing urgent, just wanted to flag it so it doesn't get lost.</p>
      <p>Log in and check your Documents tab whenever you get a chance.</p>
    `),
  });
}

export async function sendCoachCancelledSessionEmail(
  to: string,
  clientName: string,
  whenText: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping coach-cancelled session email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "I had to cancel your upcoming session",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>I need to cancel your session on <strong>${whenText}</strong> — I'll follow up by text to get you rescheduled.</p>
      <p>This one's on me, so there's no cancellation fee and you've got a free reschedule waiting whenever works for you.</p>
    `),
  });
}

export async function sendDayBlockedEmail(
  to: string,
  clientName: string,
  whenText: string,
  reason: string | null
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping day-blocked email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "I'm unavailable that day — your session moved",
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p>I'm unavailable on <strong>${whenText}</strong>${reason ? ` (${reason})` : ""}, so I had to cancel your session that day.</p>
      <p>This one's on me, so there's no cancellation fee and you've got a free reschedule waiting whenever works for you. I'll follow up to get you set up on a new time.</p>
    `),
  });
}

export async function sendMilestoneAchievedEmail(
  to: string,
  clientName: string,
  milestoneTitle: string,
  achievedNote: string | null
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping milestone email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 You hit a milestone — ${milestoneTitle}`,
    html: wrapper(`
      <p>Hi ${clientName},</p>
      <p><strong>${milestoneTitle}</strong> — done. I'm genuinely proud of you, and I wanted you to hear it directly from me, not just see a checkmark in the app.</p>
      ${achievedNote ? `<p>${achievedNote}</p>` : ""}
      <p>Log in to see it marked on your milestones — and let's keep going.</p>
      <p>— Mickey</p>
    `),
  });
}
