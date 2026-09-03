import { Resend } from "resend";
import { LATE_CANCEL_NOTICE_HOURS } from "@/lib/cancellation";
import type { Locale } from "@/lib/i18n";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "MeFirstFitness <onboarding@resend.dev>";

const BLOCKED_DATE_FMT_EN = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const BLOCKED_DATE_FMT_ES = new Intl.DateTimeFormat("es", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
function formatBlockedDate(dateStr: string, locale: Locale = "en"): string {
  const fmt = locale === "es" ? BLOCKED_DATE_FMT_ES : BLOCKED_DATE_FMT_EN;
  return fmt.format(new Date(`${dateStr}T00:00:00Z`));
}

const KIND_LABEL_ES: Record<string, string> = {
  "video session": "sesión por video",
  "check-in call": "llamada de seguimiento",
  session: "sesión",
};

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

// Sent from our own Resend pipeline rather than through Supabase Auth's
// built-in email sender -- that one hits a very low, silent rate limit on
// the free tier and was failing real lead signups outright ("Error
// sending invite email"). The link itself still comes from Supabase
// (admin.generateLink), just delivered through infrastructure that
// actually works.
export async function sendLeadInviteEmail(
  to: string,
  name: string,
  actionLink: string
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping lead invite email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Set up your MeFirstFitness login",
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Thanks for requesting a free assessment! Tap the link below to set up your login — you'll be able to fill out a bit more before we meet.</p>
      <p><a href="${actionLink}" style="color: #E75480; font-weight: 600;">Set up your login →</a></p>
      <p style="font-size: 13px; color: #8A8078;">This link works once and expires after a while — if it's stopped working, just request a new assessment and I'll send a fresh one.</p>
    `),
  });
}

// Same reasoning as sendLeadInviteEmail -- delivered through Resend
// instead of Supabase Auth's own (rate-limited, silently unreliable)
// email sender.
export async function sendClientLoginLinkEmail(to: string, actionLink: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping client login link email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your MeFirstFitness login link",
    html: wrapper(`
      <p>Here&apos;s your one-time login link:</p>
      <p><a href="${actionLink}" style="color: #E75480; font-weight: 600;">Log in →</a></p>
      <p style="font-size: 13px; color: #8A8078;">This link works once and expires after a while — if it's stopped working, just request a new one.</p>
    `),
  });
}

export async function sendSessionReminderEmail(
  to: string,
  clientName: string,
  whenText: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping session reminder email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: locale === "es" ? "Tu sesión se acerca" : "Your session is coming up",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Solo un aviso — tu próxima sesión es <strong>${whenText}</strong>. ¡Nos vemos entonces!</p>
      <p style="font-size: 13px; color: #8A8078;">¿Necesitas cancelar? Recuerda que avisar con menos de ${LATE_CANCEL_NOTICE_HOURS} horas cuenta como una cancelación tardía según nuestra política.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>Just a heads up — your next session is <strong>${whenText}</strong>. See you then!</p>
      <p style="font-size: 13px; color: #8A8078;">Need to cancel? Just a reminder that under ${LATE_CANCEL_NOTICE_HOURS} hours' notice counts as a late cancellation under our policy.</p>
    `
    ),
  });
}

export async function sendInactivityNudgeEmail(
  to: string,
  clientName: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping inactivity nudge email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es" ? "No te he visto registrar un check-in" : "Haven't seen you check in",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Solo quería saludar — no he visto un check-in o registro de actividad tuyo en un tiempo. Sin ninguna presión, solo quería que supieras que lo noté y que estoy aquí si algo ha surgido.</p>
      <p>Cuando tengas oportunidad, registra un check-in rápido en la aplicación para que pueda ver cómo van las cosas.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>Just checking in — I haven't seen a check-in or activity log from you in a bit. No pressure at all, just wanted you to know I noticed and I'm here if anything's come up.</p>
      <p>Whenever you get a chance, log a quick check-in in the app so I can see how things are going.</p>
    `
    ),
  });
}

export async function sendPaymentReminderEmail(
  to: string,
  clientName: string,
  description: string,
  amount: number,
  dueDateText: string,
  isOverdue: boolean,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping payment reminder email");
    return;
  }
  const isEs = locale === "es";
  await resend.emails.send({
    from: FROM,
    to,
    subject: isEs
      ? isOverdue
        ? "Pago vencido"
        : "Recordatorio de pago"
      : isOverdue
        ? "Payment past due"
        : "Payment reminder",
    html: wrapper(
      isEs
        ? `
      <p>Hola ${clientName},</p>
      <p>${
        isOverdue
          ? "Este es un recordatorio amistoso de que un pago está vencido:"
          : "Este es un recordatorio amistoso sobre un próximo pago:"
      }</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${description}</strong><br/>
        $${amount.toFixed(2)} — vence el ${dueDateText}
      </p>
      <p>¡Avísame si tienes alguna pregunta!</p>
    `
        : `
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
    `
    ),
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

export async function sendServiceCheckinDueEmail(
  to: string,
  clientName: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping service check-in email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es"
        ? "Check-in rápido — ¿cómo va todo en general?"
        : "Quick check-in — how's it going overall?",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Ahora que las medidas de este mes ya están registradas, es un buen momento para tu check-in rápido de servicio — cómo se siente el coaching en general, qué está funcionando, qué no.</p>
      <p>Inicia sesión y lo verás esperando en tu panel. Toma solo un minuto.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>Now that this month's measurements are in, it's a good time for your quick service check-in — how coaching's feeling overall, what's working, what's not.</p>
      <p>Log in and you'll see it waiting on your dashboard. Takes just a minute.</p>
    `
    ),
  });
}

export async function sendDocumentsPendingEmail(
  to: string,
  clientName: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping documents pending email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: locale === "es" ? "Un documento necesita tu atención" : "A document needs your attention",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Tienes al menos un documento esperando tu revisión en la aplicación — nada urgente, solo quería mencionarlo para que no se pierda.</p>
      <p>Inicia sesión y revisa tu pestaña de Documentos cuando tengas oportunidad.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>You've got at least one document waiting for your review in the app — nothing urgent, just wanted to flag it so it doesn't get lost.</p>
      <p>Log in and check your Documents tab whenever you get a chance.</p>
    `
    ),
  });
}

export async function sendCoachCancelledSessionEmail(
  to: string,
  clientName: string,
  whenText: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping coach-cancelled session email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es"
        ? "Tuve que cancelar tu próxima sesión"
        : "I had to cancel your upcoming session",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Necesito cancelar tu sesión el <strong>${whenText}</strong> — te escribiré por mensaje de texto para reprogramarte.</p>
      <p>Esta cancelación es mía, así que no hay cargo por cancelación y tienes una reprogramación gratuita esperando para cuando te convenga.</p>
      <p>Ya que no tendremos nuestra sesión, trata de todas formas de meter algo de movimiento por tu cuenta hoy — una caminata, algo de estiramiento, lo que tengas tiempo de hacer.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>I need to cancel your session on <strong>${whenText}</strong> — I'll follow up by text to get you rescheduled.</p>
      <p>This one's on me, so there's no cancellation fee and you've got a free reschedule waiting whenever works for you.</p>
      <p>Since we won't get our session in, try to still sneak in some movement on your own today — a walk, some stretching, whatever you've got time for.</p>
    `
    ),
  });
}

export async function sendEmergencyCancelledSessionEmail(
  to: string,
  clientName: string,
  whenText: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping emergency-cancelled session email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es"
        ? "Tu sesión está cancelada — atiende lo que necesites"
        : "Your session is cancelled — take care of what you need to",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>He cancelado tu sesión el <strong>${whenText}</strong> — sin cargo, sin preocupaciones. Atiende lo que necesites.</p>
      <p>Cuando estés lista/o, busquemos un nuevo horario.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>I've cancelled your session on <strong>${whenText}</strong> — no charge, no worries at all. Take care of what you need to.</p>
      <p>Whenever you're ready, let's find a new time.</p>
    `
    ),
  });
}

export async function sendDayBlockedEmail(
  to: string,
  clientName: string,
  whenText: string,
  reason: string | null,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping day-blocked email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es"
        ? "No estoy disponible ese día — tu sesión se movió"
        : "I'm unavailable that day — your session moved",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>No estoy disponible el <strong>${whenText}</strong>${reason ? ` (${reason})` : ""}, así que tuve que cancelar tu sesión ese día.</p>
      <p>Esta cancelación es mía, así que no hay cargo por cancelación y tienes una reprogramación gratuita esperando para cuando te convenga. Te escribiré para ponerte en un nuevo horario.</p>
      <p>Ya que no tendremos nuestra sesión, trata de todas formas de meter algo de movimiento por tu cuenta ese día — una caminata, algo de estiramiento, lo que tengas tiempo de hacer.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>I'm unavailable on <strong>${whenText}</strong>${reason ? ` (${reason})` : ""}, so I had to cancel your session that day.</p>
      <p>This one's on me, so there's no cancellation fee and you've got a free reschedule waiting whenever works for you. I'll follow up to get you set up on a new time.</p>
      <p>Since we won't get our session in, try to still sneak in some movement on your own that day — a walk, some stretching, whatever you've got time for.</p>
    `
    ),
  });
}

export async function sendPacketEmail(
  to: string,
  leadName: string,
  trackName: string,
  phaseLinks: { phase: string; url: string }[]
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping packet email");
    return;
  }
  const linksHtml = phaseLinks
    .sort((a, b) => a.phase.localeCompare(b.phase))
    .map(
      (l) =>
        `<li><a href="${l.url}" style="color: #E75480; font-weight: 600;">Phase ${l.phase} →</a></li>`
    )
    .join("");
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${trackName} packet is ready`,
    html: wrapper(`
      <p>Hi ${leadName},</p>
      <p>Thanks for grabbing the <strong>${trackName}</strong> packet! Here's all 4 phases:</p>
      <ul style="padding-left: 20px;">${linksHtml}</ul>
      <p style="font-size: 13px; color: #8A8078;">These links expire in a week — if any have stopped working, just let me know and I'll send fresh ones.</p>
      <p>One thing worth saying: this doesn't replace your free assessment. I still like to actually meet before handing over a full program — let's find time for that too.</p>
    `),
  });
}

export async function sendBlockedDatesReminderEmail(
  to: string,
  clientName: string,
  dates: string[],
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping blocked-date reminder email");
    return;
  }
  const isEs = locale === "es";
  const sorted = [...dates].sort();
  const dateListHtml = sorted
    .map((d) => `<li>${formatBlockedDate(d, locale)}</li>`)
    .join("");
  await resend.emails.send({
    from: FROM,
    to,
    subject: isEs
      ? sorted.length > 1
        ? "Próximas fechas en las que no tendré sesión"
        : "Próxima fecha en la que no tendré sesión"
      : sorted.length > 1
        ? "Upcoming dates I won't be in session"
        : "Upcoming date I won't be in session",
    html: wrapper(
      isEs
        ? `
      <p>Hola ${clientName},</p>
      <p>Solo un aviso — no olvides que no tendré sesión el:</p>
      <ul style="padding-left: 20px;">${dateListHtml}</ul>
      <p>Cualquier cosa que normalmente caería en ${sorted.length > 1 ? "estas fechas" : "esta fecha"} ya está resuelta de mi lado — no necesitas hacer nada.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>Just a heads up — don't forget I won't be in session on:</p>
      <ul style="padding-left: 20px;">${dateListHtml}</ul>
      <p>Anything that would normally fall on ${sorted.length > 1 ? "these dates" : "this date"} is already taken care of on my end — no action needed from you.</p>
    `
    ),
  });
}

export async function sendSessionRescheduledEmail(
  to: string,
  clientName: string,
  fromDateStr: string,
  toWhenText: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping session-rescheduled email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: locale === "es" ? "Tu horario de sesión cambió" : "Your session time has changed",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Moví tu sesión del <strong>${formatBlockedDate(fromDateStr, locale)}</strong> a:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${toWhenText}</strong>
      </p>
      <p>No necesitas hacer nada — solo quería que tuvieras el nuevo horario. Contáctame si no te funciona.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>I moved your session on <strong>${formatBlockedDate(fromDateStr, locale)}</strong> to:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${toWhenText}</strong>
      </p>
      <p>Nothing you need to do — just wanted you to have the new time. Reach out if it doesn't work for you.</p>
    `
    ),
  });
}

export async function sendSessionBookedEmail(
  to: string,
  clientName: string,
  whenText: string,
  kindLabel: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping session-booked email");
    return;
  }
  const isEs = locale === "es";
  const label = isEs ? KIND_LABEL_ES[kindLabel] ?? kindLabel : kindLabel;
  await resend.emails.send({
    from: FROM,
    to,
    subject: isEs ? "¡Estás reservada/o!" : "You're booked!",
    html: wrapper(
      isEs
        ? `
      <p>Hola ${clientName},</p>
      <p>Fui adelante y te reservé para <strong>${label}</strong>:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${whenText}</strong>
      </p>
      <p>¡Nos vemos entonces! Contáctame si este horario no te funciona.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>I went ahead and got you booked in for a <strong>${label}</strong>:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${whenText}</strong>
      </p>
      <p>See you then! Reach out if this time doesn't work for you.</p>
    `
    ),
  });
}

export async function sendRequestCounteredEmail(
  to: string,
  clientName: string,
  proposedText: string,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping request-countered email");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject:
      locale === "es"
        ? "Un horario diferente para tu solicitud de sesión"
        : "A different time for your session request",
    html: wrapper(
      locale === "es"
        ? `
      <p>Hola ${clientName},</p>
      <p>Tu horario solicitado no funciona del todo — me gustaría proponer en su lugar:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${proposedText}</strong>
      </p>
      <p>Inicia sesión y lo verás esperando en tu panel — acéptalo, o envía una nueva solicitud si no te funciona.</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p>Your requested time doesn't quite work — I'd like to propose instead:</p>
      <p style="background: #F3EEF0; border-radius: 12px; padding: 12px 16px;">
        <strong>${proposedText}</strong>
      </p>
      <p>Log in and you'll see it waiting on your dashboard — accept it, or send a new request if it doesn't work.</p>
    `
    ),
  });
}

export async function sendMilestoneAchievedEmail(
  to: string,
  clientName: string,
  milestoneTitle: string,
  achievedNote: string | null,
  locale: Locale = "en"
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping milestone email");
    return;
  }
  const isEs = locale === "es";
  await resend.emails.send({
    from: FROM,
    to,
    subject: isEs
      ? `🎉 Alcanzaste un logro — ${milestoneTitle}`
      : `🎉 You hit a milestone — ${milestoneTitle}`,
    html: wrapper(
      isEs
        ? `
      <p>Hola ${clientName},</p>
      <p><strong>${milestoneTitle}</strong> — hecho. Estoy genuinamente orgullosa de ti, y quería que lo escucharas directamente de mí, no solo ver una marca en la aplicación.</p>
      ${achievedNote ? `<p>${achievedNote}</p>` : ""}
      <p>Inicia sesión para verlo marcado en tus logros — y sigamos adelante.</p>
      <p>— Mickey</p>
    `
        : `
      <p>Hi ${clientName},</p>
      <p><strong>${milestoneTitle}</strong> — done. I'm genuinely proud of you, and I wanted you to hear it directly from me, not just see a checkmark in the app.</p>
      ${achievedNote ? `<p>${achievedNote}</p>` : ""}
      <p>Log in to see it marked on your milestones — and let's keep going.</p>
      <p>— Mickey</p>
    `
    ),
  });
}
