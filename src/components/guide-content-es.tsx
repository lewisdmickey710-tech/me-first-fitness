import { Card, Collapsible, Heart } from "@/components/ui";

// Spanish translation of guide-content.tsx -- kept as a full sibling
// component rather than wrapped string-by-string, since this is a real
// document translation (dense educational prose transcribed from the
// same take-home packet), not a UI-string dictionary. Keep this in sync
// with guide-content.tsx by hand when that file changes.

export function GuideContentEs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Tu Guía Personal de Bienestar
        </h1>
        <p className="mt-2 text-sm text-gray">
          Esta es la misma guía que le entrego a cada cliente en su
          evaluación — mi educación sobre movimiento, alimentación,
          mentalidad y recuperación, todo en un solo lugar. Es tuya, ya sea
          que terminemos entrenando juntas/os o no. Vuelve a ella cuando
          quieras.
        </p>
      </div>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Movimiento y Postura: lo básico</SectionHeading>
        <div>
          <p className="font-medium">Por qué importa la postura</p>
          <p className="mt-1 text-gray">
            La postura no se trata de pararse &quot;perfectamente
            derecha/o.&quot; Se trata de cómo tu cuerpo distribuye la carga.
            Cuando las articulaciones están desalineadas, algunos músculos
            trabajan de más y otros se apagan — lo que lleva a dolor,
            compensación, y lesiones con el tiempo. La buena noticia: la
            postura responde bien al entrenamiento específico.
          </p>
        </div>
        <div>
          <p className="font-medium">
            Los 3 patrones más comunes con los que trabajo
          </p>
          <ul className="mt-1 list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Postura de cabeza adelantada:
              </span>{" "}
              la cabeza se desplaza hacia adelante de los hombros — común
              por el tiempo frente a pantallas. Tensiona el cuello, los
              trapecios superiores, y puede causar dolores de cabeza. Se
              corrige con retracciones de mentón, activación de flexores
              profundos del cuello, y trabajo de movilidad torácica.
            </li>
            <li>
              <span className="font-medium text-ink">
                Inclinación pélvica anterior:
              </span>{" "}
              las caderas se inclinan hacia adelante, causando arqueo de la
              espalda baja y glúteos débiles. Extremadamente común. Se
              corrige con estiramiento de flexores de cadera, activación de
              glúteos, y entrenamiento de estabilidad del core.
            </li>
            <li>
              <span className="font-medium text-ink">
                Valgo de rodilla (rodillas hacia adentro):
              </span>{" "}
              las rodillas colapsan hacia adentro durante sentadillas y
              zancadas — a menudo señal de glúteos débiles y sobrepronación.
              Se corrige con fortalecimiento del glúteo medio y trabajo de
              estabilidad del pie.
            </li>
          </ul>
        </div>
        <Collapsible label="Reinicio postural rápido que puedes hacer en cualquier lugar">
          <p className="text-gray">
            Párate con los pies separados al ancho de la cadera. Retrae
            suavemente el mentón (haz &quot;doble mentón&quot;). Lleva los
            hombros hacia atrás y abajo — no hacia arriba. Activa tu core
            ligeramente (como si te prepararas para un toque suave).
            Mantén 30 segundos. Repite cada hora si trabajas sentada/o.
          </p>
        </Collapsible>
        <div>
          <p className="font-medium">
            Los 6 patrones de movimiento funcional — por qué importan
          </p>
          <p className="mt-1 text-gray">
            Todo movimiento humano proviene de 6 patrones básicos.
            Entrenar los 6 crea un cuerpo equilibrado y resiliente que
            funciona bien en la vida real — no solo en el gimnasio.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Sentadilla (sentarse en una silla, levantarse del suelo):
              </span>{" "}
              desarrolla fuerza de cuádriceps, glúteos y core — protege
              rodillas y espalda baja.
            </li>
            <li>
              <span className="font-medium text-ink">
                Bisagra de cadera / peso muerto (recoger algo, agacharse):
              </span>{" "}
              entrena la cadena posterior — el área más desentrenada en la
              mayoría de las personas.
            </li>
            <li>
              <span className="font-medium text-ink">
                Zancada (escaleras, dar pasos, estabilidad en una pierna):
              </span>{" "}
              desarrolla fuerza unilateral y equilibrio — revela y corrige
              asimetrías.
            </li>
            <li>
              <span className="font-medium text-ink">
                Empuje (flexiones, presión por encima de la cabeza):
              </span>{" "}
              fuerza de pecho, hombro y tríceps — y estabilidad escapular.
            </li>
            <li>
              <span className="font-medium text-ink">
                Plancha / core (plancha, sostenes anti-rotación):
              </span>{" "}
              estabiliza la columna — la base sobre la que se construye
              cualquier otro movimiento.
            </li>
            <li>
              <span className="font-medium text-ink">
                Remo / jalón (remos, movimientos de tracción):
              </span>{" "}
              fuerza de espalda alta — el antídoto para la cabeza
              adelantada y los hombros redondeados.
            </li>
          </ul>
        </div>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, evaluamos tus patrones específicos a fondo en
          cada sesión y construimos una rutina de ejercicio correctivo
          dirigida exactamente a tus hallazgos. Cada fase incluye trabajo
          postural integrado en el calentamiento y el enfriamiento.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>
          Tu Hoja de Ruta de Entrenamiento — El Método NASM
        </SectionHeading>
        <p className="text-gray">
          Saltar directo a levantar pesado sin construir una base es la
          razón #1 por la que la gente se lesiona o se estanca. El sistema
          de fases de NASM construye cada capa sobre la anterior — así que
          cuando llegues a levantar pesado o moverte rápido, tu cuerpo
          realmente está listo para eso.
        </p>
        <div className="space-y-2">
          <PhaseRow
            name="Fase 1 — Estabilidad"
            detail="1–3 series | 12–20 repeticiones | Tempo lento y controlado"
            body="La base. Entrenamos tu sistema nervioso para activar los músculos correctos en el orden correcto. Esta fase corrige patrones de compensación, desarrolla estabilidad articular, y le enseña a tu cuerpo a moverse bien antes de pedirle que se mueva pesado. La mayoría de las personas nota menos dolor y mejor conciencia corporal rápidamente."
          />
          <PhaseRow
            name="Fase 2 — Fuerza"
            detail="3–5 series | 6–12 repeticiones | Tempo moderado"
            body="Ahora cargamos los patrones que construimos. Los músculos principales se fortalecen — glúteos, espalda, piernas, core. Aquí es donde a menudo comienza el cambio visible real. La sobrecarga progresiva aplicada de forma constante aquí construye la base de fuerza de la que depende todo lo demás."
          />
          <PhaseRow
            name="Fase 3 — Volumen (Hipertrofia)"
            detail="3–5 series | 6–12 repeticiones | Mayor volumen"
            body="Maximizar el desarrollo muscular. El volumen aumenta mientras seguimos construyendo fuerza. Esta fase es para clientes que quieren más definición y tamaño muscular. Combina muy bien con el trabajo de nutrición — alimentarse para crecer es parte del plan."
          />
          <PhaseRow
            name="Fase 4 — Velocidad y Potencia"
            detail="3–5 series | 1–10 repeticiones | Explosivo, velocidad máxima"
            body="Potencia explosiva, agilidad, y rendimiento atlético. Pliometría, trabajo de velocidad, y movimientos de potencia. En esta fase tu cuerpo es una máquina bien afinada — fuerte, estable, y lista para moverse rápido."
          />
        </div>
        <Collapsible label="Cómo se ve realmente la Fase 1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead>
                <tr className="text-gray">
                  <th className="py-1 pr-2 font-medium">Ejercicio</th>
                  <th className="py-1 pr-2 font-medium">Series</th>
                  <th className="py-1 pr-2 font-medium">Repeticiones</th>
                  <th className="py-1 pr-2 font-medium">Tempo</th>
                  <th className="py-1 font-medium">Indicación de coaching</th>
                </tr>
              </thead>
              <tbody className="text-ink">
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Sentadilla con peso corporal</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">15</td>
                  <td className="py-1 pr-2">3-1-2</td>
                  <td className="py-1">Rodillas siguen la línea de los dedos, pecho arriba</td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Puente de glúteos</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">15</td>
                  <td className="py-1 pr-2">2-1-3</td>
                  <td className="py-1">
                    Aprieta los glúteos arriba, sin arquear la espalda baja
                  </td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Bird Dog</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">10/lado</td>
                  <td className="py-1 pr-2">Lento</td>
                  <td className="py-1">
                    Brazo y pierna opuestos, caderas niveladas
                  </td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Plancha</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">20 seg</td>
                  <td className="py-1 pr-2">Mantener</td>
                  <td className="py-1">
                    Columna neutra, respira — no aguantes la respiración
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-gray">
            Nota lo que falta: nada de pesos pesados, nada de agotarte,
            nada de perseguir el &quot;quemón.&quot; Solo movimiento limpio
            y controlado — porque el objetivo de la Fase 1 es enseñarle a
            tu cuerpo a moverse bien, no probar qué tan duro puedes
            esforzarte.
          </p>
        </Collapsible>
        <Collapsible label="Tus fases de entrenamiento reflejan tu cambio de estilo de vida">
          <p className="mb-2 text-gray">
            Esto no es coincidencia — el cambio real y duradero en tu
            cuerpo y en tus hábitos sigue el mismo arco.
          </p>
          <ul className="space-y-2 text-gray">
            <li>
              <span className="font-medium text-ink">
                Fase 1 — Estabilidad → Precontemplación/Preparación:
              </span>{" "}
              así como tu cuerpo necesita reaprender patrones básicos de
              movimiento antes de añadir carga, tu mentalidad necesita una
              base antes de añadir grandes cambios de hábito.
            </li>
            <li>
              <span className="font-medium text-ink">
                Fase 2 — Fuerza → Acción:
              </span>{" "}
              una vez que la base es sólida, empiezas a construir
              activamente — añadiendo carga en el gimnasio, añadiendo
              nuevos hábitos en la vida. Aquí es donde se construye un
              impulso real y visible.
            </li>
            <li>
              <span className="font-medium text-ink">
                Fase 3 — Volumen → Mantenimiento:
              </span>{" "}
              el volumen y la constancia se acumulan aquí. Los nuevos
              hábitos empiezan a sentirse como &quot;simplemente quién
              eres&quot; en vez de algo que tienes que forzar con pura
              voluntad.
            </li>
            <li>
              <span className="font-medium text-ink">
                Fase 4 — Velocidad y Potencia → Cambio de crecimiento/identidad:
              </span>{" "}
              tu cuerpo se mueve con potencia porque la base es
              inquebrantable. Tus hábitos se sienten automáticos porque
              ahora son parte de tu identidad, no una lista de reglas que
              sigues.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, construyo tu plan de 3 días y ajusto la
          progresión de fases según tus hallazgos específicos de
          movimiento, tu estilo de vida, y cómo responde tu cuerpo. Nunca
          apresuramos una fase — nos la ganamos.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Alimentación Intuitiva</SectionHeading>
        <div>
          <p className="font-medium">Lo que la Alimentación Intuitiva NO es</p>
          <p className="mt-1 text-gray">
            No es &quot;comer lo que sea.&quot; No va en contra de la
            salud. No ignora la nutrición. La Alimentación Intuitiva es un
            marco respaldado por la ciencia que te ayuda a reconectar con
            las señales de tu cuerpo — hambre, saciedad, satisfacción — y
            eliminar el miedo, la culpa, y la obsesión que crean las
            dietas. La investigación muestra que lleva a mejores resultados
            de salud a largo plazo que hacer dieta.
          </p>
        </div>
        <Collapsible label="Los 10 principios — un resumen rápido">
          <ol className="list-decimal space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Rechaza la mentalidad de dieta:
              </span>{" "}
              suelta la idea de que una dieta finalmente te &quot;arreglará.&quot;
              Hacer dieta crónicamente daña el metabolismo, aumenta la
              preocupación por la comida, y erosiona la confianza en tu
              cuerpo.
            </li>
            <li>
              <span className="font-medium text-ink">Honra tu hambre:</span>{" "}
              come cuando tengas hambre. Ignorar las señales de hambre
              lleva a comer en exceso después. El hambre es información —
              no algo para aguantar a la fuerza.
            </li>
            <li>
              <span className="font-medium text-ink">
                Haz las paces con la comida:
              </span>{" "}
              cuando ninguna comida está prohibida, la obsesión se
              desvanece. El permiso incondicional para comer — no atracarte
              — es el objetivo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Desafía a la policía de la comida:
              </span>{" "}
              la voz interior que etiqueta la comida como &quot;mala&quot;
              o te hace sentir culpable es cultura de dieta, no salud.
              Aprender a silenciarla es parte del trabajo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Descubre el factor de satisfacción:
              </span>{" "}
              comer alimentos satisfactorios en un ambiente agradable no es
              un lujo. Es el mecanismo que previene comer en exceso.
            </li>
            <li>
              <span className="font-medium text-ink">
                Siente tu saciedad:
              </span>{" "}
              revisa a mitad de la comida. ¿Cómo se siente tu cuerpo? Pausa
              y observa — esta habilidad se desarrolla con el tiempo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Enfrenta tus emociones con amabilidad:
              </span>{" "}
              la comida no es un defecto de carácter. Si comes por
              emociones, el objetivo es entender — no la vergüenza.
              Encontramos otras herramientas juntas/os.
            </li>
            <li>
              <span className="font-medium text-ink">
                Respeta tu cuerpo:
              </span>{" "}
              tu cuerpo merece cuidado básico sin importar su tamaño.
              Rechazar tu cuerpo hace que sea más difícil — no más fácil —
              cuidarlo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Movimiento — siente la diferencia:
              </span>{" "}
              muévete porque se siente bien, te energiza, y desarrolla
              fuerza — no para quemar lo que comiste.
            </li>
            <li>
              <span className="font-medium text-ink">
                Honra tu salud con nutrición amable:
              </span>{" "}
              una comida no hace ni deshace tu salud. Lo que importa es el
              patrón general — y no tiene que ser perfecto.
            </li>
          </ol>
        </Collapsible>
        <Collapsible label="La escala de hambre / saciedad">
          <p className="mb-2 text-gray">
            Una de las herramientas más poderosas en la Alimentación
            Intuitiva. Califícate antes y después de las comidas — no para
            juzgar, sino para recopilar información sobre tu cuerpo.
          </p>
          <div className="grid grid-cols-5 gap-1 text-center text-xs text-gray sm:grid-cols-10">
            {[
              "1 · Voraz",
              "2 · Muy hambrienta/o",
              "3 · Hambrienta/o",
              "4 · Ligero hambre",
              "5 · Neutral",
              "6 · Satisfecha/o",
              "7 · Llena/o",
              "8 · Muy llena/o",
              "9 · Repleta/o",
              "10 · Dolor/náusea",
            ].map((s) => (
              <div key={s} className="rounded-lg bg-cream px-1 py-2">
                {s}
              </div>
            ))}
          </div>
          <p className="mt-2 font-medium text-rose">
            <Heart className="mr-1" />
            Punto ideal: come alrededor de 3–4. Detente alrededor de 6–7.
          </p>
          <p className="mt-2 text-gray">
            Prueba esto por una semana: antes de comer, pausa y califica tu
            hambre del 1 al 10. Después de comer, pausa y califica tu
            saciedad. No juzgues lo que encuentres — solo observa. Surgirán
            patrones increíblemente útiles para entender tu relación con la
            comida.
          </p>
        </Collapsible>
        <Collapsible label="Un día de ejemplo de Alimentación Intuitiva">
          <p className="mb-2 text-gray">
            Esto no es un plan de comidas. Es un ejemplo de cómo se ve
            comer con conciencia corporal.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">Mañana:</span> nota el
              hambre antes de elegir la comida. Come lo que suene
              satisfactorio y llenador — no lo que &quot;deberías&quot;
              comer. Califica la saciedad después, apuntando a 6–7.
            </li>
            <li>
              <span className="font-medium text-ink">Media mañana:</span> si
              tienes hambre de nuevo, come. El hambre en 3–4 es la señal.
              Ignora el reloj — honra el cuerpo.
            </li>
            <li>
              <span className="font-medium text-ink">Almuerzo:</span> come
              con atención cuando sea posible. Suelta el teléfono. Nota el
              sabor, la textura, la satisfacción. Revisa a la mitad —
              ¿necesitas más?
            </li>
            <li>
              <span className="font-medium text-ink">Tarde:</span> el
              hambre de la tarde es real y válida. Una merienda en hambre
              3–4 evita llegar a la cena voraz (1–2) y comer en exceso.
            </li>
            <li>
              <span className="font-medium text-ink">Cena:</span> come con
              intención. Sin reglas sobre lo que está &quot;permitido.&quot;
              Detente en una saciedad cómoda — no repleta/o.
            </li>
            <li>
              <span className="font-medium text-ink">Noche:</span> si
              tienes hambre después de la cena, come. Si comes por
              aburrimiento o emoción, ten curiosidad — ¿qué es lo que
              realmente necesitas?
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, trabajamos los principios uno a la vez según
          dónde estés. No prescribo planes de comida ni conteo de
          calorías — construimos conciencia y confianza a través de
          conversaciones, diarios, y las herramientas en tu carpeta de
          cliente.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Construyendo un Plato Equilibrado</SectionHeading>
        <p className="text-gray">
          Esto es una guía, no una regla. La Alimentación Intuitiva no
          significa ignorar lo básico de la nutrición — significa usar
          herramientas simples que construyen conciencia sin obsesión.
        </p>
        <div>
          <p className="font-medium">El método de porciones con la mano</p>
          <p className="mt-1 text-gray">
            Un punto de partida simple para un plato equilibrado. Ajusta
            hacia arriba o abajo según el hambre, el nivel de actividad, y
            cómo se siente tu cuerpo — no una prescripción fija.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Proteína — 1 porción del tamaño de tu palma:
              </span>{" "}
              pollo, pescado, huevos, tofu, frijoles, yogur griego —
              apoya la reparación muscular y la saciedad.
            </li>
            <li>
              <span className="font-medium text-ink">
                Verduras / fruta — 1 porción del tamaño de tu puño (¡o más!):
              </span>{" "}
              cualquier producto colorido — fibra, micronutrientes, y
              volumen que ayuda a la saciedad.
            </li>
            <li>
              <span className="font-medium text-ink">
                Carbohidratos — 1 porción del tamaño de tu mano ahuecada:
              </span>{" "}
              arroz, papas, avena, fruta, granos enteros — la fuente de
              combustible preferida de tu cuerpo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Grasas — 1 porción del tamaño de tu pulgar:
              </span>{" "}
              aceite de oliva, nueces, aguacate, mantequilla — apoya
              hormonas y absorción de nutrientes.
            </li>
          </ul>
        </div>
        <Collapsible label="Si quieres más estructura: opciones de reparto de macros">
          <p className="mb-2 text-gray">
            Para clientes a quienes les gusta un poco más de estructura,
            aquí hay filosofías comunes de reparto de macros. Ninguna es
            &quot;correcta&quot; — la adecuada es la que apoye cómo te
            sientes y vives.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Equilibrado / salud general — ~40% carbohidratos · 30%
                proteína · 30% grasa:
              </span>{" "}
              un reparto flexible del día a día que apoya la energía, el
              entrenamiento, y la recuperación sin ser restrictivo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Más proteína (enfoque en fuerza y composición corporal) —
                ~35% carbohidratos · 35% proteína · 30% grasa:
              </span>{" "}
              popular para clientes en la Fase 2–3 enfocados en fuerza y
              desarrollo muscular.
            </li>
            <li>
              <span className="font-medium text-ink">
                Más carbohidratos (enfoque en rendimiento y energía) — ~50%
                carbohidratos · 25% proteína · 25% grasa:
              </span>{" "}
              bueno para clientes que entrenan frecuentemente o se enfocan
              en potencia y rendimiento de la Fase 4.
            </li>
            <li>
              <span className="font-medium text-ink">
                Menos carbohidratos (preferencia personal / comodidad) —
                ~25% carbohidratos · 35% proteína · 40% grasa:
              </span>{" "}
              para clientes que simplemente se sienten mejor con menos
              carbohidratos — nunca impuesto, solo ofrecido si se ajusta a
              tu cuerpo y preferencia.
            </li>
          </ul>
        </Collapsible>
        <Collapsible label="Elige tu estilo de coaching de nutrición">
          <p className="mb-2 text-gray">
            El coaching de nutrición puede verse muy diferente de persona a
            persona — y eso es bueno. Esto es cómo se ve cada enfoque en
            la práctica.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Conteo de macros / calorías:
              </span>{" "}
              para clientes a quienes les gustan los datos y los números.
              Estableceremos juntas/os un rango objetivo flexible — nunca
              rígido, nunca punitivo. Tú registras en la app que prefieras
              y revisamos tendencias, no perfección.
            </li>
            <li>
              <span className="font-medium text-ink">
                Diario de comida y estado de ánimo:
              </span>{" "}
              menos sobre números, más sobre patrones. Anotas lo que
              comiste, tu hambre/saciedad, y tu estado de ánimo. Hablamos
              juntas/os sobre lo que notas.
            </li>
            <li>
              <span className="font-medium text-ink">
                Enviar fotos de comida:
              </span>{" "}
              bajo esfuerzo, alta información. Toma una foto rápida de tus
              comidas cuando se te ocurra y envíamela. No necesitas
              descripciones.
            </li>
            <li>
              <span className="font-medium text-ink">
                Simplemente conversarlo en sesión:
              </span>{" "}
              sin tarea, sin registro. Simplemente hablamos de cómo ha
              estado yendo la alimentación en cada sesión — ideal si
              registrar cualquier cosa traería de vuelta el estrés de la
              cultura de dieta.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, nunca te impongo un reparto de macros. Si la
          estructura se siente útil, encontraremos el marco que se ajuste
          a tus metas y estilo de vida. Si se siente restrictivo, nos
          quedamos con las porciones con la mano y las señales del cuerpo.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Cambio de Comportamiento y Mentalidad</SectionHeading>
        <div>
          <p className="font-medium">La verdad sobre la motivación</p>
          <p className="mt-1 text-gray">
            La motivación no es la base del cambio duradero — es una
            visitante. Va y viene. Lo que realmente funciona es construir
            pequeños sistemas, eliminar obstáculos, y crear hábitos basados
            en identidad.
          </p>
        </div>
        <Collapsible label="Las etapas del cambio — ¿dónde estás?">
          <ul className="space-y-2 text-gray">
            <li>
              <span className="font-medium text-ink">
                Precontemplación:
              </span>{" "}
              todavía no piensas en cambiar. &quot;No tengo realmente un
              problema.&quot; Presionar fuerte aquí resulta contraproducente
              — lo que ayuda es información y compasión.
            </li>
            <li>
              <span className="font-medium text-ink">Contemplación:</span>{" "}
              consciente de que algo necesita cambiar pero aún no lista/o.
              &quot;Sé que debería, pero...&quot; La ambivalencia es normal
              aquí.
            </li>
            <li>
              <span className="font-medium text-ink">Preparación:</span>{" "}
              preparándose. Haciendo planes, reuniendo recursos. Este es el
              mejor momento para actuar — se está construyendo impulso.
            </li>
            <li>
              <span className="font-medium text-ink">Acción:</span>{" "}
              haciendo cambios activamente. Trabajo duro. Alto riesgo de
              recaída. La estructura y el apoyo importan más aquí — es
              donde el coaching tiene el mayor impacto.
            </li>
            <li>
              <span className="font-medium text-ink">Mantenimiento:</span>{" "}
              sosteniendo el cambio. Los hábitos se están formando. El
              objetivo cambia de &quot;hacer&quot; a &quot;ser.&quot; La
              identidad empieza a cambiar — &quot;soy alguien que...&quot;
            </li>
          </ul>
        </Collapsible>
        <div>
          <p className="font-medium">3 cosas que realmente impulsan el cambio duradero</p>
          <ul className="mt-1 list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Identidad antes que acción:
              </span>{" "}
              no digas &quot;estoy tratando de hacer más ejercicio.&quot;
              Di &quot;me estoy convirtiendo en alguien que mueve su
              cuerpo.&quot; La identidad precede al comportamiento — no al
              revés.
            </li>
            <li>
              <span className="font-medium text-ink">
                Reduce el cambio:
              </span>{" "}
              el error más grande es empezar demasiado grande. Una
              caminata de 5 minutos diaria supera a un entrenamiento de
              una hora abandonado después de 2 semanas. Empieza más
              pequeño de lo que se sienta significativo.
            </li>
            <li>
              <span className="font-medium text-ink">
                Diseño del ambiente:
              </span>{" "}
              la fuerza de voluntad es finita. Diseña tu ambiente para que
              la opción saludable sea también la opción fácil. Prepara la
              ropa la noche anterior. Mantén el agua visible. Elimina la
              fricción.
            </li>
          </ul>
        </div>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          Mi certificación de especialista en cambio de comportamiento
          significa que no solo escribimos programas — descubrimos qué
          está realmente en el camino y construimos estrategias alrededor
          de tu vida real. Eso es lo que hace que el coaching se mantenga.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Movimiento Sin Dolor</SectionHeading>
        <p className="text-gray">
          El dolor es información, no una sentencia de por vida. Soy
          especialista certificada en Movimiento Sin Dolor — el
          entrenamiento nunca es &quot;aguanta a la fuerza.&quot; El dolor
          durante el ejercicio es una señal de que algo necesita
          modificarse, no una prueba de resistencia. Trabajar alrededor de
          limitaciones no es debilidad. Es entrenamiento inteligente.
        </p>
        <div>
          <p className="font-medium">Las reglas de oro del entrenamiento sin dolor</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              Entrena en un nivel de 0–2 en una escala de dolor durante el
              ejercicio. Si es un 3 o más, modifica o detén ese movimiento.
            </li>
            <li>
              Distingue entre fatiga muscular (normal, productiva) y dolor
              articular (detente de inmediato).
            </li>
            <li>
              Nunca entrenes hacia un dolor agudo, punzante, o tipo
              nervioso. Eso es el cuerpo pidiendo descanso o evaluación.
            </li>
            <li>
              Calienta a fondo — los músculos y articulaciones fríos son
              más propensos a lesiones. 5–10 minutos no son negociables.
            </li>
            <li>
              La recuperación es entrenamiento. El sueño, la hidratación,
              y los días de descanso son cuando ocurre la adaptación — no
              en el gimnasio.
            </li>
            <li>
              La hinchazón, los moretones, o el dolor que empeora después
              de 48 horas necesitan atención médica — no más ejercicio.
            </li>
          </ul>
        </div>
        <Collapsible label="Hábitos simples de movimiento diario para un cuerpo sin dolor">
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              Estiramiento de flexor de cadera diario (90 segundos cada
              lado) — deshace horas de estar sentada/o y reduce el dolor
              de espalda baja.
            </li>
            <li>
              Rotación torácica (sentada/o o de pie): 10 repeticiones cada
              lado — mejora la movilidad de hombro y cuello.
            </li>
            <li>
              Activación de glúteos antes de cualquier sesión de tren
              inferior: puentes o almejas — previene problemas de rodilla
              y cadera.
            </li>
            <li>
              Colgarse (o estiramiento en el marco de una puerta) 30
              segundos diarios — descomprime la columna y mejora la salud
              del hombro.
            </li>
            <li>
              Camina 10 minutos después de las comidas cuando sea posible
              — mejora la regulación del azúcar en la sangre y la
              digestión.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, cada sesión comienza con una rutina de
          preparación de movimiento construida alrededor de tus patrones
          específicos. El estiramiento asistido, el rodillo de espuma, y
          la terapia con Theragun están disponibles en persona para
          acelerar la recuperación y la movilidad entre sesiones.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Sueño, Recuperación y Estrés</SectionHeading>
        <p className="text-gray">
          El sueño no es opcional — es el programa. El músculo se
          construye durante el sueño, no en el gimnasio. La regulación del
          cortisol, el equilibrio de hormonas del hambre (grelina y
          leptina), el estado de ánimo, la motivación, y el riesgo de
          lesión están directamente ligados a la calidad del sueño. Ningún
          programa de entrenamiento supera la privación crónica de sueño.
        </p>
        <Collapsible label="Qué le pasa a tu cuerpo cuando duermes">
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              La hormona del crecimiento alcanza su punto máximo durante el
              sueño profundo — es cuando los músculos se reparan y crecen
              a partir de tu entrenamiento.
            </li>
            <li>
              La leptina (hormona de saciedad) sube y la grelina (hormona
              del hambre) baja — dormir mal te da más hambre al día
              siguiente, particularmente por alimentos altos en calorías.
            </li>
            <li>
              El cerebro consolida los patrones motores durante el sueño —
              la habilidad de movimiento que practicaste en el gimnasio se
              &quot;guarda&quot; durante la noche.
            </li>
            <li>
              El cortisol debería estar más bajo en la noche. El sueño
              interrumpido mantiene el cortisol elevado, lo que aumenta el
              almacenamiento de grasa (especialmente grasa abdominal) y
              descompone el músculo.
            </li>
          </ul>
        </Collapsible>
        <div>
          <p className="font-medium">
            Mejoras prácticas de sueño (empieza con una)
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              Establece una hora de dormir y despertar consistente —
              incluso los fines de semana. La consistencia circadiana
              mejora la calidad del sueño profundo más que cualquier
              suplemento.
            </li>
            <li>
              Sin pantallas 30–60 minutos antes de dormir. La luz azul
              suprime la melatonina. Incluso atenuar tu teléfono ayuda.
            </li>
            <li>
              Mantén tu habitación fresca (18–20°C es óptimo). La
              temperatura corporal debe bajar para iniciar y mantener el
              sueño.
            </li>
            <li>
              Evita el alcohol 3 horas antes de dormir. Puede ayudarte a
              conciliar el sueño pero fragmenta severamente tu arquitectura
              de sueño.
            </li>
            <li>
              El glicinato de magnesio (200–400mg antes de dormir) es uno
              de los suplementos con más evidencia respaldando la calidad
              del sueño.
            </li>
          </ul>
        </div>
        <Collapsible label="Estrés, cortisol y tu entrenamiento">
          <p className="mb-2 text-gray">
            El cortisol es tu hormona principal de estrés. En ráfagas
            cortas es saludable — impulsa la adaptación del entrenamiento.
            El cortisol crónicamente elevado (por estrés de vida, mal
            sueño, comer muy poco, o sobreentrenamiento) descompone el
            músculo, aumenta el almacenamiento de grasa, agota la
            motivación, y hace todo más difícil. Manejar el estrés no es
            algo blando — es literalmente parte del programa de
            entrenamiento.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              El entrenamiento debería reducir el cortisol — no dispararlo.
              El sobreentrenamiento sin recuperación hace lo contrario.
            </li>
            <li>
              El cardio lento y sostenido (caminatas, ciclismo suave) baja
              activamente el cortisol. Inclúyelo.
            </li>
            <li>
              Trabajo de respiración: 5 minutos de respiración 4-7-8 antes
              de dormir (inhala 4, sostén 7, exhala 8) reduce el cortisol
              de forma medible.
            </li>
            <li>
              Escribir 3 cosas por las que estás agradecida/o antes de
              dormir ha demostrado reducir las hormonas de estrés durante
              la noche.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, reviso el sueño y el estrés en cada sesión — no
          como plática casual, sino porque informan directamente cómo
          entrenamos ese día. Una semana de mucho estrés significa que
          ajustamos la carga. La recuperación se planea, no se deja al
          azar.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Hidratación y Nutrición Amable</SectionHeading>
        <div>
          <p className="font-medium">Por qué la hidratación es una herramienta de rendimiento</p>
          <p className="mt-1 text-gray">
            Una reducción del 2% en el agua corporal lleva a disminuciones
            medibles en fuerza, resistencia, y función cognitiva. Para
            cuando sientes sed, ya estás ligeramente deshidratada/o. La
            mayoría de las personas están crónicamente subhidratadas sin
            saberlo.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              Meta general: la mitad de tu peso corporal en onzas de agua
              al día como base. Añade 16oz por cada 30 minutos de ejercicio.
            </li>
            <li>
              Empieza tu día con 16oz de agua antes del café — despiertas
              deshidratada/o después de 7–8 horas sin líquidos.
            </li>
            <li>
              El color de la orina es tu mejor indicador de hidratación:
              amarillo pálido = bien. Amarillo oscuro = bebe más. Clara =
              puedes reducir un poco.
            </li>
            <li>
              Los electrolitos importan — especialmente si sudas mucho.
              Una pizca de sal en el agua o un electrolito de calidad (sin
              azúcar) marca una diferencia significativa.
            </li>
            <li>
              El hambre y la sed usan señales que se superponen en el
              cerebro. Antes de buscar una merienda, bebe 8oz de agua y
              espera 10 minutos.
            </li>
          </ul>
        </div>
        <Collapsible label="Nutrición amable — lo que creo">
          <p className="mb-2 text-gray">
            Mi enfoque de nutrición se basa en la Alimentación Intuitiva,
            no en el conteo de macros o calorías. Dicho esto, hay algunos
            principios fundamentales de nutrición que vale la pena conocer
            — no como reglas, sino como información.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              La proteína apoya la reparación muscular y te mantiene
              llena/o por más tiempo. Apunta a una porción del tamaño de
              tu palma en la mayoría de las comidas — pollo, pescado,
              huevos, frijoles, yogur griego, tofu. No se necesita contar
              gramos.
            </li>
            <li>
              Comer cada 3–5 horas generalmente evita llegar a las comidas
              con hambre voraz (lo que lleva a comer más allá de la
              saciedad). Esto varía por persona — las señales del cuerpo
              anulan el reloj.
            </li>
            <li>
              Las verduras no son un castigo. Encuentra 3–4 que
              genuinamente te gusten y construye desde ahí. La fibra
              alimenta tu microbioma intestinal, lo que afecta el estado
              de ánimo, la energía, y la inmunidad.
            </li>
            <li>
              Los carbohidratos son combustible — no el enemigo. Tu
              cerebro funciona exclusivamente con glucosa. Las personas
              atléticas y activas los necesitan. El miedo a los
              carbohidratos es cultura de dieta, no ciencia.
            </li>
            <li>
              La grasa es esencial. Las hormonas se hacen de grasa. El
              aguacate, el aceite de oliva, las nueces, y el pescado graso
              apoyan desde la función cerebral hasta la salud articular.
            </li>
            <li>
              Ninguna comida es moralmente superior a otra. Comer una
              galleta no es un defecto de carácter. Una comida no define
              un patrón de salud — la tendencia general sí.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          En el coaching, la nutrición está entretejida en cada sesión —
          no como un complemento separado. Uso la Rueda de Sentimientos,
          la Rueda de Necesidades, el diario de comida-estado de ánimo, y
          el rastreador de principios de AI para construir conciencia con
          el tiempo. Es un proceso, no una prescripción.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Cómo Es Realmente Entrenar Conmigo</SectionHeading>
        <ul className="list-disc space-y-1 pl-5 text-gray">
          <li>
            Un programa totalmente personalizado basado en NASM,
            construido alrededor de tus hallazgos de movimiento, metas, y
            vida.
          </li>
          <li>Fases progresivas — te ganas cada una y nunca te apresuran.</li>
          <li>
            Coaching de nutrición a través de la Alimentación Intuitiva —
            sanando tu relación con la comida junto con el fitness.
          </li>
          <li>
            Herramientas de cambio de comportamiento para que la
            motivación deje de ser lo que se interpone entre tú y el
            progreso.
          </li>
          <li>
            Movimiento sin dolor integrado — calentamientos,
            enfriamientos, y programación que respeta tu cuerpo.
          </li>
          <li>
            En persona: estiramiento asistido, rodillo de espuma, y
            terapia con Theragun incluidos.
          </li>
          <li>
            Virtual: corrección de forma, programación, y apoyo completo
            de nutrición desde donde estés.
          </li>
          <li>Una entrenadora que te ve como una persona completa — no solo como una meta de fitness.</li>
        </ul>
        <p className="text-sm italic text-ink">
          Ya sea que terminemos entrenando juntas/os o no, quiero que te
          vayas con herramientas reales — no solo inspiración. Esta guía
          es tuya. Úsala. Vuelve a ella. Compártela si le sirve a alguien.
          Cuando sea el momento indicado, aquí estoy. — Mickey
        </p>
      </Card>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-rose">{children}</h2>;
}

function PhaseRow({
  name,
  detail,
  body,
}: {
  name: string;
  detail: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-grayLt p-3">
      <p className="font-medium text-ink">{name}</p>
      <p className="text-xs text-gray">{detail}</p>
      <p className="mt-1 text-gray">{body}</p>
    </div>
  );
}
