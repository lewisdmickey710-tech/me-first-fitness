// Lightweight, dependency-free i18n: rather than extracting every string
// to an invented key name (a huge, error-prone rewrite across an app this
// size), t() is called with the literal English text as its own key. The
// Spanish dictionary below maps that exact English string to its
// translation; anything not yet in the dictionary just falls back to
// English, so a missing entry degrades gracefully instead of crashing or
// showing a raw key. {placeholders} in a string are substituted from the
// `vars` object -- use this for any text that wraps a name, date, or
// other dynamic value, since word order differs between languages.
export type Locale = "en" | "es";

export function makeT(locale: Locale | null | undefined) {
  const dict = locale === "es" ? ES : null;
  return function t(key: string, vars?: Record<string, string | number>): string {
    let s = dict?.[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(String(v));
      }
    }
    return s;
  };
}

export const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

// ---- Spanish dictionary -----------------------------------------------
// Organized loosely by the page it's first used on, since that's how it
// gets built up and reviewed -- not meant as a strict namespace boundary,
// a handful of common words (Save, Cancel, Date...) are intentionally
// reused across many pages.
const ES: Record<string, string> = {
  // Shared nav / chrome
  Settings: "Configuración",
  FAQ: "Preguntas frecuentes",
  "Sign out": "Cerrar sesión",

  // Common actions/words reused across many pages
  Save: "Guardar",
  "Save changes": "Guardar cambios",
  Cancel: "Cancelar",
  Delete: "Eliminar",
  Add: "Añadir",
  Edit: "Editar",
  Date: "Fecha",
  Notes: "Notas",
  Optional: "Opcional",
  "(optional)": "(opcional)",
  Back: "Atrás",
  Loading: "Cargando",
  Yes: "Sí",
  No: "No",
  Today: "Hoy",

  // Profile page
  "Let's start with the basics": "Empecemos con lo básico",
  "Your profile": "Tu perfil",
  "Just your contact info to start — quick and easy. You can update any of this any time it changes.":
    "Solo tu información de contacto para empezar — rápido y fácil. Puedes actualizar esto cuando cambie.",
  "Update any of this any time it changes.": "Actualiza esta información cuando cambie.",
  "Full name": "Nombre completo",
  "Preferred name / nickname": "Nombre preferido / apodo",
  "Date of birth": "Fecha de nacimiento",
  Phone: "Teléfono",
  Email: "Correo electrónico",
  "Your timezone": "Tu zona horaria",
  "For virtual sessions — this is what session times get shown in for you.":
    "Para sesiones virtuales — así es como se te mostrarán los horarios de las sesiones.",
  "App language": "Idioma de la aplicación",
  "Emergency contact": "Contacto de emergencia",
  Name: "Nombre",
  "Physician / provider": "Médico / proveedor",
  Continue: "Continuar",
  "Signed documents": "Documentos firmados",
  "View all →": "Ver todo →",
  "Nothing assigned yet.": "Nada asignado todavía.",
  signed: "firmado",
  read: "leído",
  "needs review": "necesita revisión",
  "Payment history": "Historial de pagos",
  "No payments recorded yet.": "Aún no hay pagos registrados.",
  "Training history": "Historial de entrenamiento",
  "{count} session logged": "{count} sesión registrada",
  "{count} sessions logged": "{count} sesiones registradas",
  "View →": "Ver →",
  "Your data": "Tus datos",
  "Download everything tracked here for you — sessions, check-ins, measurements, documents you've signed, all of it — for your own records any time, including if you ever stop training with Mickey.":
    "Descarga todo lo registrado aquí para ti — sesiones, controles, medidas, documentos que has firmado, todo — para tus propios registros en cualquier momento, incluso si algún día dejas de entrenar con Mickey.",
  "Download my data": "Descargar mis datos",

  // Shared across many client pages
  "No profile linked yet": "Perfil aún no vinculado",
  "Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out.":
    "Tu entrenadora todavía no ha vinculado tu cuenta a un perfil de cliente. Vuelve a revisar pronto, o contáctala.",

  // Dashboard
  "+{n} snacks today": "+{n} meriendas hoy",
  "+{n} snack today": "+{n} merienda hoy",
  "meals today": "comidas hoy",
  "Week {week} of this phase · Cycle {cycle}": "Semana {week} de esta fase · Ciclo {cycle}",
  "Hey, {name}": "Hola, {name}",
  "You hit milestones!": "¡Alcanzaste logros!",
  "You hit a milestone!": "¡Alcanzaste un logro!",
  "View your milestones →": "Ver tus logros →",
  "Needs your review": "Necesita tu revisión",
  "{count} documents to review": "{count} documentos por revisar",
  "{count} document to review": "{count} documento por revisar",
  "Review →": "Revisar →",
  "{amount} overdue": "{amount} vencido",
  "since {date} — training is on hold until it's paid.":
    "desde {date} — el entrenamiento está en pausa hasta que se pague.",
  "Your spot is on hold": "Tu lugar está en pausa",
  "You're not currently scheduled for sessions — the weekly $10 retainer keeps your app access and reserves your spot for whenever you're ready to come back. Reach out to Mickey when you want to resume.":
    "Actualmente no tienes sesiones programadas — el pago semanal de $10 mantiene tu acceso a la aplicación y reserva tu lugar para cuando estés listo/a para volver. Contacta a Mickey cuando quieras retomar.",
  "Sessions paused": "Sesiones en pausa",
  "A late cancellation fee is outstanding — your upcoming sessions are paused until it's paid. Send it using one of the methods below, then your schedule picks back up right away.":
    "Tienes un cargo pendiente por cancelación tardía — tus próximas sesiones están en pausa hasta que se pague. Envíalo usando uno de los métodos abajo, y tu horario se reanudará de inmediato.",
  "Next session": "Próxima sesión",
  "Join video call →": "Unirse a la videollamada →",
  "This is a video session — Mickey will share the call link.":
    "Esta es una sesión por video — Mickey compartirá el enlace de la llamada.",
  "Cancelling now is under {hours} hours notice — this will count as a late cancellation.":
    "Cancelar ahora es con menos de {hours} horas de aviso — esto contará como una cancelación tardía.",
  "Cancelling now is under {hours} hours notice and will count as a late cancellation. Cancel anyway?":
    "Cancelar ahora es con menos de {hours} horas de aviso y contará como una cancelación tardía. ¿Cancelar de todas formas?",
  "Cancel this session? This can't be undone.": "¿Cancelar esta sesión? Esto no se puede deshacer.",
  "Request reschedule": "Solicitar reprogramación",
  "View your schedule →": "Ver tu horario →",
  Program: "Programa",
  "Last updated {date}": "Última actualización: {date}",
  "Not updated yet": "Aún no actualizado",
  "No session booked right now — Mickey updates your program directly on her own cadence.":
    "No tienes ninguna sesión reservada en este momento — Mickey actualiza tu programa directamente a su propio ritmo.",
  "Want a video session or a check-in call? Book one above.":
    "¿Quieres una sesión por video o una llamada de seguimiento? Reserva una arriba.",
  "Need dedicated time to talk something through? Book a check-in call above.":
    "¿Necesitas tiempo dedicado para hablar de algo? Reserva una llamada de seguimiento arriba.",
  "View your program →": "Ver tu programa →",
  "Payment due": "Pago pendiente",
  "{description}, due {date}": "{description}, vence el {date}",
  "Your goals": "Tus metas",
  "Programmed Days": "Días programados",
  "Sessions with Mickey": "Sesiones con Mickey",
  "Pending requests": "Solicitudes pendientes",
  "Mickey proposed a different time:": "Mickey propuso otro horario:",
  "at {time}": "a las {time}",
  "(you asked for {date}{time})": "(pediste {date}{time})",
  "Works for me": "Me funciona",
  "Doesn't work": "No me funciona",
  "Check-in call": "Llamada de seguimiento",
  pending: "pendiente",
  "My program": "Mi programa",
  "This week's exercises & cues": "Ejercicios y señales de esta semana",
  "My schedule": "Mi horario",
  "View & manage your sessions": "Ver y administrar tus sesiones",
  Nutrition: "Nutrición",
  "Goal: {n} cal/day": "Meta: {n} cal/día",
  "Log meals, hunger & fullness": "Registra comidas, hambre y saciedad",
  Habits: "Hábitos",
  "Track your daily habits": "Da seguimiento a tus hábitos diarios",
  "My progress": "Mi progreso",
  "Photos, measurements & trends": "Fotos, medidas y tendencias",
  Community: "Comunidad",
  "See what the group's up to": "Mira qué está haciendo el grupo",
  More: "Más",
  "Log a daily check-in": "Registrar un check-in diario",
  "Symptom log": "Registro de síntomas",
  Milestones: "Logros",
  "Wellness guide": "Guía de bienestar",
  Documents: "Documentos",
  "{n} new": "{n} nuevos",
  "Payment plan": "Plan de pago",
  "Book a check-in call": "Reservar una llamada de seguimiento",
  "Book a video session": "Reservar una sesión por video",
  "Recent sessions": "Sesiones recientes",
  "No sessions yet": "Aún no hay sesiones",
  "Once your coach logs a session, it'll show up here.":
    "Cuando tu entrenadora registre una sesión, aparecerá aquí.",
  "Rating: {n}/5": "Calificación: {n}/5",
  "Want to support the work?": "¿Quieres apoyar este trabajo?",

  // Schedule
  "Your schedule": "Tu horario",
  "A ${amount} late cancellation fee is outstanding. Your upcoming sessions are paused until it's paid — send it using one of the methods below, and your schedule will pick back up right away.":
    "Tienes un cargo pendiente de ${amount} por cancelación tardía. Tus próximas sesiones están en pausa hasta que se pague — envíalo usando uno de los métodos abajo, y tu horario se reanudará de inmediato.",
  Completed: "Completada",
  Cancelled: "Cancelada",
  "Late cancelled": "Cancelada tarde",
  Rescheduled: "Reprogramada",
  "Cancellation policy": "Política de cancelación",
  "Cancelling with less than {hours} hours notice counts as a late cancellation. A first one is just noted — every one after that within 16 weeks brings a $10 fee and pauses your sessions until it's paid.":
    "Cancelar con menos de {hours} horas de aviso cuenta como una cancelación tardía. La primera solo se anota — cada una después de esa dentro de 16 semanas trae un cargo de $10 y pausa tus sesiones hasta que se pague.",
  'Want more "me time"?': "¿Quieres más tiempo para ti?",
  "Ask for an extra session or a different time.": "Pide una sesión extra o un horario diferente.",
  "Request time": "Solicitar horario",
  "← Prev": "← Anterior",
  "Next →": "Siguiente →",
  "No session that day": "No hay sesión ese día",
  "Tap a highlighted date on the calendar to see details.":
    "Toca una fecha resaltada en el calendario para ver los detalles.",
  Sunday: "Domingo",
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Scheduled: "Programada",
  "Mickey cancelled": "Mickey canceló",
  "you cancelled": "tú cancelaste",
  "Nothing on the schedule this day.": "No hay nada programado este día.",
  "Mickey cancelled this one — no fee, and you've got a free reschedule whenever works for you.":
    "Mickey canceló esta — sin cargo, y tienes una reprogramación gratuita para cuando te convenga.",
  "Moved to {date}": "Movida al {date}",
  "No exact time on file for this one — cancelling won't be checked against the 12-hour notice window.":
    "No hay una hora exacta registrada para esta — cancelar no se verificará contra la ventana de aviso de 12 horas.",
};
