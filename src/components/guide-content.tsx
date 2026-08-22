import { Card, Collapsible, Heart } from "@/components/ui";

// Real educational content transcribed from "MeFirstFitness TakeHomePacket
// Tabbed.pdf" (the "Your Personal Wellness Guide" Mickey hands out at
// assessments) — the generic educational sections only. The personalized
// "Your Results" / assessment-summary sections from that packet are
// per-client data entered during an actual assessment, not static content,
// so they aren't reproduced here.

export function GuideContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Your Personal Wellness Guide
        </h1>
        <p className="mt-2 text-sm text-gray">
          This is the same guide I hand every client at their assessment —
          my education on movement, food, mindset, and recovery, all in one
          place. It&apos;s yours whether or not we end up training together.
          Come back to it any time.
        </p>
      </div>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Movement &amp; Posture Basics</SectionHeading>
        <div>
          <p className="font-medium">Why posture matters</p>
          <p className="mt-1 text-gray">
            Posture isn&apos;t about standing &quot;perfectly straight.&quot;
            It&apos;s about how your body distributes load. When joints are
            misaligned, some muscles overwork and others switch off — leading
            to pain, compensation, and injury over time. The good news:
            posture responds well to targeted training.
          </p>
        </div>
        <div>
          <p className="font-medium">
            The 3 most common patterns I work with
          </p>
          <ul className="mt-1 list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Forward head posture:
              </span>{" "}
              Head drifts forward of the shoulders — common from screen time.
              Strains the neck, upper traps, and can cause headaches.
              Corrected through chin tucks, deep neck flexor activation, and
              thoracic mobility work.
            </li>
            <li>
              <span className="font-medium text-ink">
                Anterior pelvic tilt:
              </span>{" "}
              Hips tip forward, causing lower back arch and weak glutes.
              Extremely common. Corrected through hip flexor stretching,
              glute activation, and core stability training.
            </li>
            <li>
              <span className="font-medium text-ink">
                Knee valgus (knees cave in):
              </span>{" "}
              Knees collapse inward during squats and lunges — often a sign
              of weak glutes and overpronation. Corrected through glute med
              strengthening and foot stability work.
            </li>
          </ul>
        </div>
        <Collapsible label="Quick posture reset you can do anywhere">
          <p className="text-gray">
            Stand with feet hip-width apart. Gently tuck your chin (make a
            &quot;double chin&quot;). Roll shoulders back and down — not up.
            Engage your core lightly (like you&apos;re bracing for a gentle
            tap). Hold 30 seconds. Repeat hourly if you sit at a desk.
          </p>
        </Collapsible>
        <div>
          <p className="font-medium">
            The 6 functional movement patterns — why they matter
          </p>
          <p className="mt-1 text-gray">
            Every human movement comes from 6 basic patterns. Training all 6
            creates a balanced, resilient body that functions well in real
            life — not just in the gym.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Squat (chair sit, getting up from floor):
              </span>{" "}
              builds quad, glute, and core strength — protects knees and
              lower back.
            </li>
            <li>
              <span className="font-medium text-ink">
                Hip hinge / deadlift (picking something up, bending over):
              </span>{" "}
              trains the posterior chain — the most undertrained area in
              most people.
            </li>
            <li>
              <span className="font-medium text-ink">
                Lunge (stairs, stepping, single-leg stability):
              </span>{" "}
              builds unilateral strength and balance — reveals and corrects
              asymmetry.
            </li>
            <li>
              <span className="font-medium text-ink">
                Push (push-up, pressing overhead):
              </span>{" "}
              chest, shoulder, tricep strength — and scapular stability.
            </li>
            <li>
              <span className="font-medium text-ink">
                Plank / core (plank, anti-rotation holds):
              </span>{" "}
              stabilizes the spine — the foundation every other movement is
              built on.
            </li>
            <li>
              <span className="font-medium text-ink">
                Row / pull (rows, pulling movements):
              </span>{" "}
              upper back strength — the antidote to forward head and rounded
              shoulders.
            </li>
          </ul>
        </div>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, we&apos;d assess your specific patterns in depth each
          session and build a corrective exercise routine targeted exactly
          to your findings. Every phase includes posture work baked into
          the warm-up and cool-down.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>
          Your Training Roadmap — The NASM Method
        </SectionHeading>
        <p className="text-gray">
          Jumping into heavy lifting without building a foundation is the #1
          reason people get hurt or plateau. NASM&apos;s phase system builds
          each layer on top of the last — so by the time you&apos;re lifting
          heavy or moving fast, your body is truly ready for it.
        </p>
        <div className="space-y-2">
          <PhaseRow
            name="Phase 1 — Stability"
            detail="1–3 sets | 12–20 reps | Slow, controlled tempo"
            body="The foundation. We train your nervous system to activate the right muscles in the right order. This phase fixes compensation patterns, builds joint stability, and teaches your body to move well before we ask it to move heavy. Most people notice less pain and better body awareness quickly."
          />
          <PhaseRow
            name="Phase 2 — Strength"
            detail="3–5 sets | 6–12 reps | Moderate tempo"
            body="Now we load the patterns we built. Prime movers get stronger — glutes, back, legs, core. This is where real visible change often begins. Progressive overload applied consistently here builds the strength base that everything else depends on."
          />
          <PhaseRow
            name="Phase 3 — Size (Hypertrophy)"
            detail="3–5 sets | 6–12 reps | Higher volume"
            body="Maximize muscle development. Volume increases while we continue building strength. This phase is for clients who want more muscle definition and size. Pairs beautifully with the nutrition work — fueling for growth is part of the plan."
          />
          <PhaseRow
            name="Phase 4 — Speed & Power"
            detail="3–5 sets | 1–10 reps | Explosive, max velocity"
            body="Explosive power, agility, and athletic performance. Plyometrics, speed work, and power movements. By this phase your body is a well-oiled machine — strong, stable, and ready to move fast."
          />
        </div>
        <Collapsible label="What Phase 1 actually looks like">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead>
                <tr className="text-gray">
                  <th className="py-1 pr-2 font-medium">Exercise</th>
                  <th className="py-1 pr-2 font-medium">Sets</th>
                  <th className="py-1 pr-2 font-medium">Reps</th>
                  <th className="py-1 pr-2 font-medium">Tempo</th>
                  <th className="py-1 font-medium">Coaching cue</th>
                </tr>
              </thead>
              <tbody className="text-ink">
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Bodyweight Squat</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">15</td>
                  <td className="py-1 pr-2">3-1-2</td>
                  <td className="py-1">Knees track toes, chest stays tall</td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Glute Bridge</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">15</td>
                  <td className="py-1 pr-2">2-1-3</td>
                  <td className="py-1">
                    Squeeze glutes at top, no lower back arch
                  </td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Bird Dog</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">10/side</td>
                  <td className="py-1 pr-2">Slow</td>
                  <td className="py-1">
                    Opposite arm + leg, hips stay level
                  </td>
                </tr>
                <tr className="border-t border-grayLt">
                  <td className="py-1 pr-2">Plank Hold</td>
                  <td className="py-1 pr-2">2</td>
                  <td className="py-1 pr-2">20 sec</td>
                  <td className="py-1 pr-2">Hold</td>
                  <td className="py-1">
                    Neutral spine, breathe — don&apos;t hold your breath
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-gray">
            Notice what&apos;s missing: no heavy weights, no exhausting
            yourself, no chasing a burn. Just clean, controlled movement —
            because the goal of Phase 1 is teaching your body to move well,
            not testing how hard you can push.
          </p>
        </Collapsible>
        <Collapsible label="Your training phases mirror your lifestyle change">
          <p className="mb-2 text-gray">
            This isn&apos;t a coincidence — real, lasting change in your body
            and in your habits follows the same arc.
          </p>
          <ul className="space-y-2 text-gray">
            <li>
              <span className="font-medium text-ink">
                Phase 1 — Stability → Precontemplation/Preparation:
              </span>{" "}
              just like your body needs to relearn basic movement patterns
              before adding load, your mindset needs a foundation before
              adding big habit changes.
            </li>
            <li>
              <span className="font-medium text-ink">
                Phase 2 — Strength → Action:
              </span>{" "}
              once the foundation is solid, you start actively building —
              adding load in the gym, adding new habits in life. This is
              where real, visible momentum builds.
            </li>
            <li>
              <span className="font-medium text-ink">
                Phase 3 — Size → Maintenance:
              </span>{" "}
              volume and consistency compound here. New habits start to feel
              like &quot;just who you are&quot; rather than something you
              have to white-knuckle through.
            </li>
            <li>
              <span className="font-medium text-ink">
                Phase 4 — Speed &amp; Power → Growth/Identity shift:
              </span>{" "}
              your body moves with power because the foundation is
              unshakeable. Your habits feel automatic because they&apos;re
              now part of your identity, not a list of rules you&apos;re
              following.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, I build your 3-day plan and adjust phase progression
          based on your specific movement findings, lifestyle, and how your
          body responds. We never rush a phase — we earn each one.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Intuitive Eating</SectionHeading>
        <div>
          <p className="font-medium">What Intuitive Eating is NOT</p>
          <p className="mt-1 text-gray">
            It is not &quot;eat whatever you want.&quot; It is not
            anti-health. It is not ignoring nutrition. Intuitive Eating is a
            science-backed framework that helps you reconnect with your
            body&apos;s signals — hunger, fullness, satisfaction — and
            remove the fear, guilt, and obsession that dieting creates.
            Research shows it leads to better long-term health outcomes
            than dieting.
          </p>
        </div>
        <Collapsible label="The 10 principles — a quick overview">
          <ol className="list-decimal space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Reject the diet mentality:
              </span>{" "}
              let go of the idea that a diet will finally &quot;fix&quot;
              you. Chronic dieting damages metabolism, increases food
              preoccupation, and erodes body trust.
            </li>
            <li>
              <span className="font-medium text-ink">Honor your hunger:</span>{" "}
              eat when you&apos;re hungry. Ignoring hunger cues leads to
              overeating later. Hunger is information — not something to
              white-knuckle through.
            </li>
            <li>
              <span className="font-medium text-ink">
                Make peace with food:
              </span>{" "}
              when no food is forbidden, the obsession fades. Unconditional
              permission to eat — not bingeing — is the goal.
            </li>
            <li>
              <span className="font-medium text-ink">
                Challenge the food police:
              </span>{" "}
              the inner voice that labels food as &quot;bad&quot; or makes
              you feel guilty is diet culture, not health. Learning to
              quiet it is part of the work.
            </li>
            <li>
              <span className="font-medium text-ink">
                Discover the satisfaction factor:
              </span>{" "}
              eating satisfying food in a pleasant environment is not a
              luxury. It&apos;s the mechanism that prevents overeating.
            </li>
            <li>
              <span className="font-medium text-ink">
                Feel your fullness:
              </span>{" "}
              check in mid-meal. How does your body feel? Pause and notice —
              this skill builds over time.
            </li>
            <li>
              <span className="font-medium text-ink">
                Cope with emotions with kindness:
              </span>{" "}
              food is not a character flaw. If you eat emotionally, the goal
              is understanding — not shame. We find other tools together.
            </li>
            <li>
              <span className="font-medium text-ink">
                Respect your body:
              </span>{" "}
              your body deserves basic care regardless of size. Rejecting
              your body makes it harder — not easier — to care for it.
            </li>
            <li>
              <span className="font-medium text-ink">
                Movement — feel the difference:
              </span>{" "}
              move because it feels good, energizes you, and builds
              strength — not to burn off what you ate.
            </li>
            <li>
              <span className="font-medium text-ink">
                Honor your health with gentle nutrition:
              </span>{" "}
              one meal doesn&apos;t make or break your health. What matters
              is the overall pattern — and it doesn&apos;t have to be
              perfect.
            </li>
          </ol>
        </Collapsible>
        <Collapsible label="The hunger / fullness scale">
          <p className="mb-2 text-gray">
            One of the most powerful tools in Intuitive Eating. Rate
            yourself before and after meals — not to judge, but to collect
            information about your body.
          </p>
          <div className="grid grid-cols-5 gap-1 text-center text-xs text-gray sm:grid-cols-10">
            {[
              "1 · Ravenous",
              "2 · Very hungry",
              "3 · Hungry",
              "4 · Slight hunger",
              "5 · Neutral",
              "6 · Satisfied",
              "7 · Full",
              "8 · Very full",
              "9 · Stuffed",
              "10 · Pain/nausea",
            ].map((s) => (
              <div key={s} className="rounded-lg bg-cream px-1 py-2">
                {s}
              </div>
            ))}
          </div>
          <p className="mt-2 font-medium text-rose">
            <Heart className="mr-1" />
            Sweet spot: eat around 3–4. Stop around 6–7.
          </p>
          <p className="mt-2 text-gray">
            Try this for one week: before eating, pause and rate your hunger
            1–10. After eating, pause and rate your fullness. Don&apos;t
            judge what you find — just notice. Patterns will emerge that are
            incredibly useful for understanding your relationship with food.
          </p>
        </Collapsible>
        <Collapsible label="A sample Intuitive Eating day">
          <p className="mb-2 text-gray">
            This is not a meal plan. It&apos;s an example of what eating
            with body awareness looks like.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">Morning:</span> notice
              hunger before making food choices. Eat what sounds satisfying
              and filling — not what you &quot;should&quot; eat. Rate
              fullness afterward, aiming for 6–7.
            </li>
            <li>
              <span className="font-medium text-ink">Mid-morning:</span> if
              hungry again, eat. Hunger at 3–4 is the cue. Ignore the clock —
              honor the body.
            </li>
            <li>
              <span className="font-medium text-ink">Lunch:</span> eat with
              attention when possible. Put the phone down. Notice flavor,
              texture, satisfaction. Check in at halfway — do you need more?
            </li>
            <li>
              <span className="font-medium text-ink">Afternoon:</span>{" "}
              afternoon hunger is real and valid. A snack at hunger 3–4
              prevents arriving at dinner ravenous (1–2) and overeating.
            </li>
            <li>
              <span className="font-medium text-ink">Dinner:</span> eat with
              intention. No rules about what is &quot;allowed.&quot; Stop at
              comfortable fullness — not stuffed.
            </li>
            <li>
              <span className="font-medium text-ink">Evening:</span> if
              hungry after dinner, eat. If eating out of boredom or emotion,
              get curious — what do you actually need?
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, we work through the principles one at a time based
          on where you are. I don&apos;t prescribe meal plans or calorie
          counts — we build awareness and trust through conversations,
          journaling, and the tools in your client folder.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Building a Balanced Plate</SectionHeading>
        <p className="text-gray">
          This is a guide, not a rule. Intuitive Eating doesn&apos;t mean
          ignoring nutrition basics — it means using simple tools that build
          awareness without obsession.
        </p>
        <div>
          <p className="font-medium">The hand portion method</p>
          <p className="mt-1 text-gray">
            A simple starting point for a balanced plate. Adjust up or down
            based on hunger, activity level, and how your body feels — not a
            fixed prescription.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Protein — 1 palm-sized portion:
              </span>{" "}
              chicken, fish, eggs, tofu, beans, Greek yogurt — supports
              muscle repair and satiety.
            </li>
            <li>
              <span className="font-medium text-ink">
                Vegetables / fruit — 1 fist-sized portion (or more!):
              </span>{" "}
              any colorful produce — fiber, micronutrients, and volume that
              helps fullness.
            </li>
            <li>
              <span className="font-medium text-ink">
                Carbohydrates — 1 cupped-hand portion:
              </span>{" "}
              rice, potatoes, oats, fruit, whole grains — your body&apos;s
              preferred fuel source.
            </li>
            <li>
              <span className="font-medium text-ink">
                Fats — 1 thumb-sized portion:
              </span>{" "}
              olive oil, nuts, avocado, butter — supports hormones and
              nutrient absorption.
            </li>
          </ul>
        </div>
        <Collapsible label="If you want more structure: macro framing options">
          <p className="mb-2 text-gray">
            For clients who like a bit more structure, here are common
            macro split philosophies. None is &quot;correct&quot; — the
            right one is whichever supports how you feel and live.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Balanced / general health — ~40% carbs · 30% protein · 30%
                fat:
              </span>{" "}
              a flexible everyday split that supports energy, training, and
              recovery without being restrictive.
            </li>
            <li>
              <span className="font-medium text-ink">
                Higher protein (strength &amp; body composition focus) —
                ~35% carbs · 35% protein · 30% fat:
              </span>{" "}
              popular for clients in Phase 2–3 focused on strength and
              muscle development.
            </li>
            <li>
              <span className="font-medium text-ink">
                Higher carb (performance &amp; energy focus) — ~50% carbs ·
                25% protein · 25% fat:
              </span>{" "}
              good for clients training frequently or focused on Phase 4
              power and performance.
            </li>
            <li>
              <span className="font-medium text-ink">
                Lower carb (personal preference / comfort) — ~25% carbs ·
                35% protein · 40% fat:
              </span>{" "}
              for clients who simply feel better with fewer carbs — never
              imposed, only offered if it fits your body and preference.
            </li>
          </ul>
        </Collapsible>
        <Collapsible label="Choose your nutrition coaching style">
          <p className="mb-2 text-gray">
            Nutrition coaching can look really different from person to
            person — and that&apos;s a good thing. Here&apos;s what each
            approach actually looks like in practice.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Macro / calorie counting:
              </span>{" "}
              for clients who like data and numbers. We&apos;ll set a
              flexible target range together — never rigid, never
              punishing. You track in an app of your choice and we review
              trends, not perfection.
            </li>
            <li>
              <span className="font-medium text-ink">
                Food &amp; mood journaling:
              </span>{" "}
              less about numbers, more about patterns. You jot down what
              you ate, your hunger/fullness, and your mood. We talk through
              what you notice together.
            </li>
            <li>
              <span className="font-medium text-ink">
                Sending food pictures:
              </span>{" "}
              low-effort, high-insight. Snap a quick photo of meals when you
              think of it and send it over. No descriptions needed.
            </li>
            <li>
              <span className="font-medium text-ink">
                Just chatting about it in session:
              </span>{" "}
              no homework, no tracking. We simply talk through how eating
              has been going at each session — ideal if logging anything
              would bring back diet culture stress.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, I never force a macro split on you. If structure
          feels supportive, we&apos;ll find the framing that fits your
          goals and lifestyle. If it feels restrictive, we stick with hand
          portions and body cues instead.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Behavior Change &amp; Mindset</SectionHeading>
        <div>
          <p className="font-medium">The truth about motivation</p>
          <p className="mt-1 text-gray">
            Motivation is not the foundation of lasting change — it&apos;s a
            visitor. It comes and goes. What actually works is building
            small systems, removing barriers, and creating identity-based
            habits.
          </p>
        </div>
        <Collapsible label="The stages of change — where are you?">
          <ul className="space-y-2 text-gray">
            <li>
              <span className="font-medium text-ink">
                Precontemplation:
              </span>{" "}
              not yet thinking about changing. &quot;I don&apos;t really
              have a problem.&quot; Pushing hard here backfires — what
              helps is information and compassion.
            </li>
            <li>
              <span className="font-medium text-ink">Contemplation:</span>{" "}
              aware something needs to change but not yet ready. &quot;I
              know I should, but...&quot; Ambivalence is normal here.
            </li>
            <li>
              <span className="font-medium text-ink">Preparation:</span>{" "}
              getting ready. Making plans, gathering resources. This is the
              best time to take action — momentum is building.
            </li>
            <li>
              <span className="font-medium text-ink">Action:</span> actively
              making changes. Hard work. High relapse risk. Structure and
              support matter most here — this is where coaching has the
              most impact.
            </li>
            <li>
              <span className="font-medium text-ink">Maintenance:</span>{" "}
              sustaining the change. Habits are forming. The goal shifts
              from &quot;doing&quot; to &quot;being.&quot; Identity starts to
              shift — &quot;I am someone who...&quot;
            </li>
          </ul>
        </Collapsible>
        <div>
          <p className="font-medium">3 things that actually drive lasting change</p>
          <ul className="mt-1 list-disc space-y-2 pl-5 text-gray">
            <li>
              <span className="font-medium text-ink">
                Identity before action:
              </span>{" "}
              don&apos;t say &quot;I&apos;m trying to exercise more.&quot;
              Say &quot;I&apos;m becoming someone who moves their
              body.&quot; Identity precedes behavior — not the other way
              around.
            </li>
            <li>
              <span className="font-medium text-ink">
                Shrink the change:
              </span>{" "}
              the biggest mistake is starting too big. A 5-minute walk done
              daily beats an hour workout abandoned after 2 weeks. Start
              smaller than feels significant.
            </li>
            <li>
              <span className="font-medium text-ink">
                Environment design:
              </span>{" "}
              willpower is finite. Design your environment so the healthy
              choice is also the easy choice. Prep clothes the night
              before. Keep water visible. Remove friction.
            </li>
          </ul>
        </div>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          My behavior change specialist certification means we don&apos;t
          just write programs — we figure out what&apos;s really in the way
          and build strategies around your actual life. That&apos;s what
          makes coaching stick.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Pain-Free Movement</SectionHeading>
        <p className="text-gray">
          Pain is information, not a life sentence. I&apos;m a certified
          Pain-Free Movement Specialist — training is never &quot;push
          through it.&quot; Pain during exercise is a signal that something
          needs modifying, not a test of toughness. Working around
          limitations is not weakness. It&apos;s smart training.
        </p>
        <div>
          <p className="font-medium">The golden rules of pain-free training</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              Train to a 0–2 on a pain scale during exercise. If it&apos;s a
              3 or above, modify or stop that movement.
            </li>
            <li>
              Distinguish between muscle fatigue (normal, productive) and
              joint pain (stop immediately).
            </li>
            <li>
              Never train into a sharp, shooting, or nerve-type pain.
              That&apos;s the body asking for rest or assessment.
            </li>
            <li>
              Warm up thoroughly — cold muscles and joints are more
              injury-prone. 5–10 minutes is non-negotiable.
            </li>
            <li>
              Recovery is training. Sleep, hydration, and rest days are
              when adaptation happens — not in the gym.
            </li>
            <li>
              Swelling, bruising, or pain that worsens after 48 hours needs
              medical attention — not more exercise.
            </li>
          </ul>
        </div>
        <Collapsible label="Simple daily movement habits for a pain-free body">
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              Hip flexor stretch daily (90 seconds each side) — undoes
              hours of sitting and reduces lower back pain.
            </li>
            <li>
              Thoracic rotation (seated or standing): 10 reps each side —
              improves shoulder and neck mobility.
            </li>
            <li>
              Glute activation before any lower body session: bridges or
              clamshells — prevents knee and hip issues.
            </li>
            <li>
              Dead hang (or doorframe stretch) 30 seconds daily —
              decompresses the spine and improves shoulder health.
            </li>
            <li>
              Walk 10 minutes after meals when possible — improves blood
              sugar regulation and digestion.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, every session starts with a movement prep routine
          built around your specific patterns. Assisted stretching, foam
          rolling, and Theragun therapy are available in-person to
          accelerate recovery and mobility between sessions.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Sleep, Recovery &amp; Stress</SectionHeading>
        <p className="text-gray">
          Sleep is not optional — it is the program. Muscle is built during
          sleep, not in the gym. Cortisol regulation, hunger hormone balance
          (ghrelin and leptin), mood, motivation, and injury risk are all
          directly tied to sleep quality. No training program outperforms
          chronic sleep deprivation.
        </p>
        <Collapsible label="What happens to your body when you sleep">
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              Growth hormone peaks during deep sleep — this is when muscles
              repair and grow from your training.
            </li>
            <li>
              Leptin (fullness hormone) rises and ghrelin (hunger hormone)
              falls — poor sleep makes you hungrier the next day,
              particularly for high-calorie foods.
            </li>
            <li>
              The brain consolidates motor patterns during sleep — the
              movement skill you practiced in the gym gets &quot;saved&quot;
              overnight.
            </li>
            <li>
              Cortisol should be lowest at night. Disrupted sleep keeps
              cortisol elevated, which increases fat storage (especially
              belly fat) and breaks down muscle.
            </li>
          </ul>
        </Collapsible>
        <div>
          <p className="font-medium">
            Practical sleep improvements (start with one)
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              Set a consistent bedtime and wake time — even on weekends.
              Circadian consistency improves deep sleep quality more than
              any supplement.
            </li>
            <li>
              No screens 30–60 minutes before bed. Blue light suppresses
              melatonin. Even dimming your phone helps.
            </li>
            <li>
              Keep your bedroom cool (65–68°F is optimal). Body temperature
              must drop to initiate and maintain sleep.
            </li>
            <li>
              Avoid alcohol within 3 hours of bed. It may help you fall
              asleep but fragments your sleep architecture severely.
            </li>
            <li>
              Magnesium glycinate (200–400mg before bed) is one of the most
              evidence-backed supplements for sleep quality.
            </li>
          </ul>
        </div>
        <Collapsible label="Stress, cortisol & your training">
          <p className="mb-2 text-gray">
            Cortisol is your primary stress hormone. In short bursts
            it&apos;s healthy — it fuels training adaptation. Chronically
            elevated cortisol (from life stress, poor sleep, under-eating,
            or overtraining) breaks down muscle, increases fat storage,
            tanks motivation, and makes everything harder. Managing stress
            is not soft — it is literally part of the training program.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              Training should reduce cortisol — not spike it. Overtraining
              without recovery does the opposite.
            </li>
            <li>
              Slow, steady-state cardio (walks, gentle cycling) actively
              lowers cortisol. Build this in.
            </li>
            <li>
              Breathwork: 5 minutes of 4-7-8 breathing before bed (inhale
              4, hold 7, exhale 8) reduces cortisol measurably.
            </li>
            <li>
              Journaling 3 things you&apos;re grateful for before sleep has
              been shown to reduce stress hormones overnight.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, I check in on sleep and stress every session — not
          as small talk, but because they directly inform how we train
          that day. A high-stress week means we adjust load. Recovery is
          planned, not left to chance.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>Hydration &amp; Gentle Nutrition</SectionHeading>
        <div>
          <p className="font-medium">Why hydration is a performance tool</p>
          <p className="mt-1 text-gray">
            A 2% reduction in body water leads to measurable decreases in
            strength, endurance, and cognitive function. By the time you
            feel thirsty, you are already mildly dehydrated. Most people are
            chronically under-hydrated without knowing it.
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray">
            <li>
              General target: half your bodyweight in ounces of water per
              day as a baseline. Add 16oz for every 30 minutes of exercise.
            </li>
            <li>
              Start your day with 16oz of water before coffee — you wake up
              dehydrated after 7–8 hours without fluids.
            </li>
            <li>
              Urine color is your best hydration gauge: pale yellow = good.
              Dark yellow = drink more. Clear = you can ease up.
            </li>
            <li>
              Electrolytes matter — especially if you sweat heavily. A pinch
              of salt in water or a quality electrolyte (no sugar) makes a
              significant difference.
            </li>
            <li>
              Hunger and thirst use overlapping signals in the brain.
              Before reaching for a snack, drink 8oz of water and wait 10
              minutes.
            </li>
          </ul>
        </div>
        <Collapsible label="Gentle nutrition — what I believe">
          <p className="mb-2 text-gray">
            My nutrition approach is Intuitive Eating-based, not
            macro-tracking or calorie-counting. That said, there are some
            foundational nutrition principles worth knowing — not as rules,
            but as information.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-gray">
            <li>
              Protein supports muscle repair and keeps you full longer. Aim
              for a palm-sized serving at most meals — chicken, fish, eggs,
              beans, Greek yogurt, tofu. No gram-counting required.
            </li>
            <li>
              Eating every 3–5 hours generally prevents arriving at meals
              ravenous (which leads to eating past fullness). This varies
              by person — body cues override the clock.
            </li>
            <li>
              Vegetables are not punishment. Find 3–4 you genuinely like and
              build from there. Fiber feeds your gut microbiome, which
              affects mood, energy, and immunity.
            </li>
            <li>
              Carbohydrates are fuel — not the enemy. Your brain runs
              exclusively on glucose. Athletes and active people need them.
              Fear of carbs is diet culture, not science.
            </li>
            <li>
              Fat is essential. Hormones are made from fat. Avocado, olive
              oil, nuts, and fatty fish support everything from brain
              function to joint health.
            </li>
            <li>
              No food is morally superior to another. Eating a cookie is
              not a character flaw. One meal does not define a health
              pattern — the overall trend does.
            </li>
          </ul>
        </Collapsible>
        <p className="text-xs text-gray">
          <Heart className="mr-1" />
          In coaching, nutrition is woven into every session — not as a
          separate add-on. I use the Feelings Wheel, Needs Wheel,
          food-mood journaling, and the IE principles tracker to build
          awareness over time. It&apos;s a process, not a prescription.
        </p>
      </Card>

      <Card className="space-y-3 text-sm text-ink">
        <SectionHeading>What Coaching With Me Actually Looks Like</SectionHeading>
        <ul className="list-disc space-y-1 pl-5 text-gray">
          <li>
            A fully personalized NASM-based program built around your
            movement findings, goals, and life.
          </li>
          <li>Progressive phases — you earn each one and never get rushed through.</li>
          <li>
            Nutrition coaching through Intuitive Eating — healing your
            relationship with food alongside fitness.
          </li>
          <li>
            Behavior change tools so that motivation stops being the thing
            standing between you and progress.
          </li>
          <li>
            Pain-free movement built in — warm-ups, cool-downs, and
            programming that respects your body.
          </li>
          <li>
            In-person: assisted stretching, foam rolling, and Theragun
            therapy included.
          </li>
          <li>
            Virtual: form coaching, programming, and full nutrition support
            from wherever you are.
          </li>
          <li>A coach who sees you as a whole person — not just a fitness goal.</li>
        </ul>
        <p className="text-sm italic text-ink">
          Whether we end up coaching together or not, I want you to leave
          with real tools — not just inspiration. This guide is yours. Use
          it. Come back to it. Share it if it helps someone. When the time
          is right, I&apos;m here. — Mickey
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
