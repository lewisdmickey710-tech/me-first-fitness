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

  // Phase names (PHASES in lib/constants.ts) -- shown via PhaseBanner
  "Phase 1 — Stability": "Fase 1 — Estabilidad",
  "Phase 2 — Strength": "Fase 2 — Fuerza",
  "Phase 3 — Size": "Fase 3 — Volumen",
  "Phase 4 — Power": "Fase 4 — Potencia",
  "N/A": "N/D",

  // Program
  "Your program": "Tu programa",
  "View past workouts →": "Ver entrenamientos pasados →",
  "No program assigned yet": "Aún no hay un programa asignado",
  "Once your coach builds out your care profile's program, it'll show up here.":
    "Cuando tu entrenadora arme el programa de tu perfil, aparecerá aquí.",
  "Day {n}: {label}": "Día {n}: {label}",
  "Forgot to log it the same day? Change the date to when you actually did it — logging it late is totally fine.":
    "¿Se te olvidó registrarlo el mismo día? Cambia la fecha a cuando realmente lo hiciste — registrarlo tarde está totalmente bien.",
  "Before you start — how was your day outside the gym?":
    "Antes de empezar — ¿cómo estuvo tu día fuera del gimnasio?",
  "Sleep — e.g. 7 hrs": "Sueño — ej. 7 hrs",
  "Water — e.g. 64 oz": "Agua — ej. 64 oz",
  "Food — on track / off track": "Alimentación — en orden / fuera de orden",
  "Energy — e.g. Good": "Energía — ej. Buena",
  "Mood — e.g. Steady": "Ánimo — ej. Estable",
  "Enter what you used and how it felt as you go, then log the whole day at the bottom.":
    "Anota lo que usaste y cómo te sentiste a medida que avanzas, y registra todo el día al final.",
  "Swapped from {name}": "Cambiado de {name}",
  "About this movement": "Sobre este movimiento",
  "▶ Watch demo": "▶ Ver demostración",
  "Back to prescribed: {name}": "Volver al prescrito: {name}",
  "Swap this movement": "Cambiar este movimiento",
  "Easier: {name}": "Más fácil: {name}",
  "Harder: {name}": "Más difícil: {name}",
  "Weight used": "Peso usado",
  "Notes (optional)": "Notas (opcional)",
  "Photo or video of your form (optional)": "Foto o video de tu forma (opcional)",
  "Anything else about how this session felt?": "¿Algo más sobre cómo se sintió esta sesión?",
  "Rate this workout to complete it": "Califica este entrenamiento para completarlo",
  "Log this workout": "Registrar este entrenamiento",
  "Did something else active?": "¿Hiciste algo más activo?",
  "A class, a walk, a workout with friends — log it from the Activity tab instead of here, so it doesn't get counted as one of your prescribed program days.":
    "Una clase, una caminata, un entrenamiento con amigos — regístralo desde la pestaña de Actividad en vez de aquí, para que no cuente como uno de tus días de programa prescritos.",
  "Go to Activity log →": "Ir al registro de actividad →",

  // Habits
  "Tap a day to cycle it through a level —": "Toca un día para cambiar entre niveles —",
  teal: "verde azulado",
  gold: "dorado",
  pink: "rosa",
  "→ clear. Use it however makes sense to you — done/not done, or how mild to severe something was.":
    "→ vacío. Úsalo como te tenga sentido — hecho/no hecho, o qué tan leve a severo fue algo.",
  "← Prev week": "← Semana anterior",
  "Next week →": "Semana siguiente →",
  "No habits yet": "Aún no hay hábitos",
  "Add something you want to build consistency on — a stretch, a med, a walk, anything.":
    "Añade algo en lo que quieras ser constante — un estiramiento, un medicamento, una caminata, lo que sea.",
  "Delete {name}": "Eliminar {name}",
  "Level {n} — tap to change": "Nivel {n} — toca para cambiar",
  "Tap to log": "Toca para registrar",
  "New habit (e.g. stretch before bed)": "Nuevo hábito (ej. estirar antes de dormir)",

  // Symptoms
  "Not turned on for your account": "No está activado para tu cuenta",
  "This one's optional and off by default — ask your coach if you'd like it enabled.":
    "Esto es opcional y está desactivado por defecto — pídele a tu entrenadora que lo active si lo deseas.",
  "A private place to keep track of anything you might want to bring up with a doctor or physical therapist. Tap a day to cycle it through a level —":
    "Un espacio privado para llevar registro de cualquier cosa que quieras mencionar a un médico o fisioterapeuta. Toca un día para cambiar entre niveles —",
  "→ clear. Sharing with your coach is entirely up to you, day by day.":
    "→ vacío. Compartir con tu entrenadora depende totalmente de ti, día a día.",
  "Nothing tracked yet": "Aún no hay nada registrado",
  "Add something you want to keep an eye on — a joint, a symptom, anything.":
    "Añade algo que quieras vigilar — una articulación, un síntoma, lo que sea.",
  "New symptom (e.g. right knee ache)": "Nuevo síntoma (ej. dolor en la rodilla derecha)",
  "Notes & sharing this week": "Notas y compartidos esta semana",
  "shared with coach": "compartido con la entrenadora",
  "Optional — when it happens, what helps, etc.": "Opcional — cuándo sucede, qué ayuda, etc.",
  "Share this entry with my coach": "Compartir esta entrada con mi entrenadora",

  // Nutrition
  "Nutrition log": "Registro de nutrición",
  "Use whatever style fits you — a quick photo, hunger/fullness and satisfaction notes, numbers, or any mix. Nothing here is required.":
    "Usa el estilo que mejor te funcione — una foto rápida, notas de hambre/saciedad y satisfacción, números, o cualquier combinación. Nada aquí es obligatorio.",
  "Your daily calorie goal": "Tu meta diaria de calorías",
  cal: "cal",
  Meal: "Comida",
  "e.g. Lunch": "ej. Almuerzo",
  Photo: "Foto",
  "(easiest option — just snap it, no description needed)":
    "(la opción más fácil — solo tómala, no necesitas describirla)",
  "What did you eat?": "¿Qué comiste?",
  "Hunger before (1–10)": "Hambre antes (1–10)",
  "Fullness after (1–10)": "Saciedad después (1–10)",
  "Satisfaction (1–5)": "Satisfacción (1–5)",
  Calories: "Calorías",
  "Protein (g)": "Proteína (g)",
  "Carbs (g)": "Carbohidratos (g)",
  "Fat (g)": "Grasa (g)",
  "Save entry": "Guardar entrada",
  "Food photo": "Foto de comida",
  "hunger {n}/10": "hambre {n}/10",
  "fullness {n}/10": "saciedad {n}/10",
  "satisfaction {n}/5": "satisfacción {n}/5",
  "{n} cal": "{n} cal",
  "{n}g protein": "{n}g proteína",
  "{n}g carbs": "{n}g carbohidratos",
  "{n}g fat": "{n}g grasa",
};
