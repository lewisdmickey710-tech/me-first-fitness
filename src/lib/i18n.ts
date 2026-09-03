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

  // Check-in
  "Log a check-in": "Registrar un check-in",
  Sleep: "Sueño",
  "e.g. 7 hrs": "ej. 7 hrs",
  Water: "Agua",
  "e.g. 64 oz": "ej. 64 oz",
  Food: "Alimentación",
  "On track / off track": "En orden / fuera de orden",
  Energy: "Energía",
  "e.g. Good": "ej. Buena",
  Mood: "Ánimo",
  "e.g. Steady": "ej. Estable",
  "Anything else?": "¿Algo más?",
  "Totally optional": "Totalmente opcional",
  "Save check-in": "Guardar check-in",

  // Milestones
  "Things to look forward to, and things we've already celebrated together.":
    "Cosas por las que esperar, y cosas que ya hemos celebrado juntas.",
  "To look forward to": "Por venir",
  "Nothing set yet": "Aún no hay nada establecido",
  "Your coach will add milestones here for you to work toward.":
    "Tu entrenadora añadirá logros aquí para que trabajes hacia ellos.",
  "Target: {date}": "Meta: {date}",
  "Celebrated 🎉": "Celebrado 🎉",

  // FAQ
  "Using the app, what to expect from coaching with Mickey, and a few general fitness basics. Tap a question to expand it — for the full wellness education (movement, nutrition, mindset, recovery), see your":
    "Cómo usar la aplicación, qué esperar del entrenamiento con Mickey, y algunos conceptos básicos de fitness. Toca una pregunta para expandirla — para la educación completa de bienestar (movimiento, nutrición, mentalidad, recuperación), consulta tu",
  "Wellness Guide": "Guía de Bienestar",
  "Using the App": "Usando la Aplicación",
  "How do I log a workout?": "¿Cómo registro un entrenamiento?",
  "Program → open the day you did, enter what you used and how it felt as you go, then log the whole day at the bottom. It saves to your history and marks that day complete.":
    "Programa → abre el día que hiciste, anota lo que usaste y cómo te sentiste a medida que avanzas, y registra todo el día al final. Se guarda en tu historial y marca ese día como completo.",
  "How do I request a different session time, or reschedule?": "¿Cómo solicito un horario de sesión diferente, o reprogramo?",
  'Schedule → "Request time," or tap an upcoming session and choose "Request reschedule." Mickey will confirm or suggest another time — it\'s a request, not an automatic booking.':
    'Horario → "Solicitar horario," o toca una próxima sesión y elige "Solicitar reprogramación." Mickey confirmará o sugerirá otro horario — es una solicitud, no una reserva automática.',
  "How do I cancel a session?": "¿Cómo cancelo una sesión?",
  "Schedule → tap the day → Cancel. Please give at least 12 hours notice if you can — see the cancellation policy below for what happens if you can't.":
    "Horario → toca el día → Cancelar. Por favor avisa con al menos 12 horas de anticipación si puedes — consulta la política de cancelación abajo para saber qué pasa si no puedes.",
  "What counts as a late cancellation?": "¿Qué cuenta como una cancelación tardía?",
  "Cancelling with less than 12 hours notice, tracked on a rolling 16-week cycle. What happens next depends on your payment plan. Monthly: your first 2 in that window are just noted, no penalty — the 3rd adds a $10 fee. Pay-as-you-go: your first is noted, no penalty — the 2nd adds a $20 fee. Either way, your upcoming sessions pause until the fee is paid, and free cancellations don't roll over once a 16-week cycle passes with no late cancellation.":
    "Cancelar con menos de 12 horas de aviso, registrado en un ciclo continuo de 16 semanas. Lo que pasa después depende de tu plan de pago. Mensual: tus primeras 2 en esa ventana solo se anotan, sin penalización — la 3ª añade un cargo de $10. Pago por sesión: la primera se anota, sin penalización — la 2ª añade un cargo de $20. De cualquier forma, tus próximas sesiones se pausan hasta que se pague el cargo, y las cancelaciones gratuitas no se acumulan una vez que pasa un ciclo de 16 semanas sin ninguna cancelación tardía.",
  "Can I switch between monthly and pay-as-you-go?": "¿Puedo cambiar entre mensual y pago por sesión?",
  "Yes, any time — Profile → Payment plan. You'll read and agree to the terms of whichever plan you're switching to before it takes effect. A fee that's already been charged stays owed no matter which plan you switch to afterward. Switching from monthly to pay-as-you-go forfeits any free cancellation beyond pay-as-you-go's smaller allotment (an unused first one still carries over) and moves you to the $20 rate. Switching from pay-as-you-go to monthly never restores a free cancellation you've already used — only your future fee rate drops, to $10.":
    "Sí, en cualquier momento — Perfil → Plan de pago. Leerás y aceptarás los términos del plan al que te cambies antes de que entre en vigor. Un cargo que ya se haya generado permanece pendiente sin importar a qué plan te cambies después. Cambiar de mensual a pago por sesión hace que pierdas cualquier cancelación gratuita más allá del cupo menor de pago por sesión (una primera sin usar sí se traslada) y te mueve a la tarifa de $20. Cambiar de pago por sesión a mensual nunca restaura una cancelación gratuita que ya hayas usado — solo baja tu tarifa futura de cargo, a $10.",
  "What if Mickey has to cancel on me instead?": "¿Qué pasa si Mickey tiene que cancelarme a mí?",
  "You'll never be charged or lose anything for it — it's marked as her cancellation, you get a free reschedule, and no fee ever applies. You'll get an email as soon as it happens, and she'll usually follow up by text too.":
    "Nunca se te cobrará ni perderás nada por eso — se marca como su cancelación, obtienes una reprogramación gratuita, y nunca aplica ningún cargo. Recibirás un correo tan pronto como suceda, y ella normalmente también te escribirá por mensaje de texto.",
  "How do I track progress photos or measurements?": "¿Cómo hago seguimiento de fotos de progreso o medidas?",
  "Progress → add a photo any time (front/side/back, whatever you want) right from your phone. Measurements are logged by Mickey during your check-ins and show up on the same page with trend lines.":
    "Progreso → añade una foto en cualquier momento (de frente/lado/espalda, lo que quieras) directamente desde tu teléfono. Las medidas las registra Mickey durante tus controles y aparecen en la misma página con líneas de tendencia.",
  "What's the Community board?": "¿Qué es el tablero de Comunidad?",
  "An optional space to post wins, questions, or photos that every other client can see and support — not just Mickey. It asks you to read and sign a short agreement the first time you open it, since it's the one place your own posts are visible to people besides your coach. Nothing you track privately (progress photos, measurements, etc.) ever shows up there unless you choose to post it yourself.":
    "Un espacio opcional para publicar logros, preguntas o fotos que todos los demás clientes pueden ver y apoyar — no solo Mickey. Te pide que leas y firmes un breve acuerdo la primera vez que lo abres, ya que es el único lugar donde tus propias publicaciones son visibles para personas además de tu entrenadora. Nada de lo que registras en privado (fotos de progreso, medidas, etc.) aparece ahí a menos que decidas publicarlo tú misma/o.",
  "Can I get a copy of everything tracked about me?": "¿Puedo obtener una copia de todo lo registrado sobre mí?",
  'Yes — Profile → "Download my data" gives you a full export of your sessions, check-ins, measurements, documents, and everything else, any time you want it.':
    'Sí — Perfil → "Descargar mis datos" te da una exportación completa de tus sesiones, controles, medidas, documentos, y todo lo demás, cuando quieras.',
  "I train virtually — will session times show up in my own timezone?": "Entreno virtualmente — ¿los horarios de sesión aparecerán en mi propia zona horaria?",
  "Once your timezone is set on your Profile page, yes — your schedule, next-session card, and reminder emails all convert automatically. If a time still looks off, double check that field is set correctly.":
    "Una vez que tu zona horaria esté configurada en tu página de Perfil, sí — tu horario, la tarjeta de próxima sesión, y los correos de recordatorio se convierten automáticamente. Si un horario todavía se ve incorrecto, verifica que ese campo esté configurado correctamente.",
  "What's a check-in call?": "¿Qué es una llamada de seguimiento?",
  "A one-time, {minutes}-minute call for anything that needs more time than a quick message — getting a home setup or equipment situated, going deep on something specific, whatever comes up. Available whether you train in-person or virtually. Book one anytime from your dashboard.":
    "Una llamada única de {minutes} minutos para cualquier cosa que necesite más tiempo que un mensaje rápido — organizar tu configuración en casa o equipo, profundizar en algo específico, lo que surja. Disponible ya sea que entrenes en persona o virtualmente. Resérvala cuando quieras desde tu panel.",
  "Can I pause training without losing my spot?": "¿Puedo pausar el entrenamiento sin perder mi lugar?",
  "Yes — a membership hold. There's no session schedule while you're on hold, but a flat $10/week retainer keeps your app access active and reserves your spot rather than opening it up to someone else. Ask Mickey to start or end a hold for you.":
    "Sí — una pausa de membresía. No hay horario de sesiones mientras estás en pausa, pero un pago fijo semanal de $10 mantiene tu acceso a la aplicación activo y reserva tu lugar en vez de abrirlo a alguien más. Pídele a Mickey que active o termine una pausa para ti.",
  "Working With Mickey": "Trabajando con Mickey",
  "What's your training philosophy?": "¿Cuál es tu filosofía de entrenamiento?",
  "NASM-based strength and movement coaching built around four progressive phases — Stability, Strength, Size, and Speed — paired with Intuitive Eating nutrition guidance. Training with purpose and intention, not punishment or obsession.":
    "Entrenamiento de fuerza y movimiento basado en NASM, construido alrededor de cuatro fases progresivas — Estabilidad, Fuerza, Volumen y Velocidad — junto con orientación nutricional de Alimentación Intuitiva. Entrenar con propósito e intención, no como castigo u obsesión.",
  "What do the four phases mean?": "¿Qué significan las cuatro fases?",
  "Stability builds control and movement quality first. Strength adds load once that foundation is solid. Size focuses on muscle-building volume. Speed layers in power and athleticism. Everyone starts wherever makes sense for their body, not necessarily at phase one.":
    "Estabilidad primero construye control y calidad de movimiento. Fuerza añade carga una vez que esa base es sólida. Volumen se enfoca en el volumen de construcción muscular. Velocidad agrega potencia y capacidad atlética. Cada persona empieza donde tenga sentido para su cuerpo, no necesariamente en la fase uno.",
  "Why don't we count calories or talk about earning/burning food?": "¿Por qué no contamos calorías ni hablamos de ganar/quemar comida?",
  "Nutrition coaching here is based on Intuitive Eating — building body awareness and trusting your hunger and fullness cues instead of rules, guilt, or restriction. It's general wellness education, not medical nutrition therapy, and isn't a replacement for a licensed dietitian or physician if you need one.":
    "El coaching de nutrición aquí se basa en Alimentación Intuitiva — construir conciencia corporal y confiar en tus señales de hambre y saciedad en vez de reglas, culpa o restricción. Es educación general de bienestar, no terapia nutricional médica, y no reemplaza a un dietista o médico con licencia si lo necesitas.",
  "What certifications does Mickey hold?": "¿Qué certificaciones tiene Mickey?",
  "NASM-based training plus certified specializations in Pain-Free Movement, Glute Development, Behavior Change, Senior Fitness, Bodybuilding, Strength & Conditioning, and Nutrition.":
    "Entrenamiento basado en NASM más especializaciones certificadas en Movimiento Sin Dolor, Desarrollo de Glúteos, Cambio de Comportamiento, Fitness para Adultos Mayores, Fisicoculturismo, Fuerza y Acondicionamiento, y Nutrición.",
  "What's the difference between in-person and virtual?": "¿Cuál es la diferencia entre en persona y virtual?",
  "In-person means standing sessions with Mickey in person — hands-on support like assisted stretching, foam rolling, and Theragun work, billed per session. Virtual means your program is built and updated in the app on Mickey's own cadence, with no standing calls by default, for a flat $90/month. A standalone written program (no ongoing coaching at all) is also available.":
    "En persona significa sesiones fijas con Mickey en persona — apoyo práctico como estiramiento asistido, rodillo de espuma, y trabajo con Theragun, facturado por sesión. Virtual significa que tu programa se arma y actualiza en la aplicación a su propio ritmo, sin llamadas fijas por defecto, por una tarifa fija de $90/mes. También hay disponible un programa escrito independiente (sin coaching continuo).",
  "Can I add video sessions to either mode?": "¿Puedo añadir sesiones por video a cualquiera de los dos modos?",
  'Yes, if Mickey\'s turned the video session add-on on for your profile — check your dashboard for a "Book a video session" option. It works the same whether you\'re in-person or virtual: propose a time, pay the ${rate} balance via Cash App or Zelle, and Mickey confirms the timeslot once it clears. Sessions run {minutes} minutes. Once confirmed, a "Join video call" link shows up on your dashboard and schedule for that session.':
    'Sí, si Mickey activó la opción de sesión por video para tu perfil — revisa tu panel para ver la opción "Reservar una sesión por video." Funciona igual ya sea en persona o virtual: propón un horario, paga el saldo de ${rate} vía Cash App o Zelle, y Mickey confirma el horario una vez que se procese. Las sesiones duran {minutes} minutos. Una vez confirmado, aparecerá un enlace de "Unirse a la videollamada" en tu panel y horario para esa sesión.',
  "I'm on the virtual plan with no session booked — what happens?": "Estoy en el plan virtual sin ninguna sesión reservada — ¿qué pasa?",
  "Your dashboard shows when your program was last updated instead of a next-session time. Mickey updates it directly on her own cadence — nothing for you to schedule. Want dedicated time to talk something through? Book a check-in call, or a video session if you have the add-on.":
    "Tu panel muestra cuándo se actualizó tu programa por última vez en vez de un horario de próxima sesión. Mickey lo actualiza directamente a su propio ritmo — no hay nada que tengas que programar. ¿Quieres tiempo dedicado para hablar de algo? Reserva una llamada de seguimiento, o una sesión por video si tienes esa opción.",
  "What equipment do I need for a virtual session?": "¿Qué equipo necesito para una sesión virtual?",
  "Depends entirely on what that session is for. Prop your phone up somewhere Mickey can see you clearly — at home or at your own gym — with whatever the session calls for. A check-in or form-coaching conversation needs nothing special, but if you're working a movement like a heavy deadlift, you'll need to be somewhere with weight heavy enough to actually show it. Ask ahead of time if you're not sure what a given session needs.":
    "Depende totalmente de para qué sea esa sesión. Coloca tu teléfono en algún lugar donde Mickey pueda verte con claridad — en casa o en tu propio gimnasio — con lo que la sesión requiera. Una conversación de seguimiento o corrección de forma no necesita nada especial, pero si estás trabajando un movimiento como un peso muerto pesado, necesitarás estar en un lugar con peso suficiente para realmente mostrarlo. Pregunta con anticipación si no estás segura/o de qué necesita una sesión en particular.",
  "Do you work with injuries, chronic conditions, or older adults?": "¿Trabajas con lesiones, condiciones crónicas, o adultos mayores?",
  "Yes — programs are built around your actual health history and current limitations, not a generic template. Always tell Mickey about any condition, injury, or medication change as soon as it comes up, not just at intake.":
    "Sí — los programas se construyen alrededor de tu historial de salud real y limitaciones actuales, no una plantilla genérica. Siempre cuéntale a Mickey sobre cualquier condición, lesión, o cambio de medicamento tan pronto como surja, no solo en la admisión inicial.",
  "What's expected of me as a client?": "¿Qué se espera de mí como cliente?",
  "Honesty, mainly. Say when something hurts, when life gets in the way, when motivation dips. Mickey can only adjust to what you actually tell her — she can't feel what's happening in your body, so communicating your limits in the moment is your job, not something to push through quietly.":
    "Honestidad, principalmente. Di cuando algo duele, cuando la vida se interpone, cuando baja la motivación. Mickey solo puede ajustar según lo que realmente le digas — ella no puede sentir lo que pasa en tu cuerpo, así que comunicar tus límites en el momento es tu responsabilidad, no algo para aguantar en silencio.",
  "General Fitness Basics": "Conceptos Básicos de Fitness",
  "How often should I be training?": "¿Con qué frecuencia debería entrenar?",
  "Depends entirely on your program, goals, and recovery — that's exactly what your care track and phase are built around. Ask Mickey directly if you're ever unsure whether to add or pull back a session.":
    "Depende totalmente de tu programa, metas, y recuperación — eso es exactamente para lo que están construidos tu plan de cuidado y fase. Pregúntale directamente a Mickey si alguna vez no estás segura/o si añadir o reducir una sesión.",
  "Is it normal to be sore after a session?": "¿Es normal tener dolor muscular después de una sesión?",
  "Some soreness in the day or two after, especially with something new, is normal. Sharp pain, pain during the movement itself, or soreness that isn't easing up after a few days isn't — tell Mickey either way so she can adjust.":
    "Algo de dolor muscular en el día o dos siguientes, especialmente con algo nuevo, es normal. El dolor agudo, dolor durante el movimiento mismo, o dolor que no mejora después de unos días no lo es — dile a Mickey de cualquier forma para que pueda ajustar.",
  "What if an exercise feels like too much?": "¿Qué pasa si un ejercicio se siente como demasiado?",
  "Say so, right then. Every program is guidance, not a demand — you're always free to modify, scale back, or skip a movement based on how your body actually feels that day.":
    "Dilo, en ese momento. Todo programa es una guía, no una exigencia — siempre eres libre de modificar, reducir, o saltarte un movimiento según cómo se sienta realmente tu cuerpo ese día.",
  "I'm nervous about starting — is that normal?": "Estoy nerviosa/o por empezar — ¿es normal?",
  "Completely. Most people feel that way walking in. Sessions are built to meet you exactly where you are, not to prove anything.":
    "Totalmente. La mayoría de las personas se sienten así al entrar. Las sesiones están diseñadas para encontrarte exactamente donde estás, no para demostrar nada.",
  "Do I need to warm up or stretch on my own?": "¿Necesito calentar o estirar por mi cuenta?",
  "Your program accounts for warm-up as part of each session — you don't need a separate routine unless Mickey specifically gives you one.":
    "Tu programa incluye el calentamiento como parte de cada sesión — no necesitas una rutina separada a menos que Mickey te dé una específicamente.",
};
