import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { Card, Collapsible, Heart } from "@/components/ui";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-rose">{title}</h2>
      <Card className="divide-y divide-grayLt">{children}</Card>
    </div>
  );
}

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <Collapsible label={q}>
        <div className="text-sm text-gray">{children}</div>
      </Collapsible>
    </div>
  );
}

export default function ClientFaqPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          FAQ
        </h1>
        <p className="mt-1 text-sm text-gray">
          Using the app, what to expect from coaching with Mickey, and a
          few general fitness basics. Tap a question to expand it — for
          the full wellness education (movement, nutrition, mindset,
          recovery), see your{" "}
          <Link href="/client/guide" className="text-rose hover:underline">
            Wellness Guide
          </Link>
          .
        </p>
      </div>

      <Section title="Using the App">
        <Q q="How do I log a workout?">
          Program → open the day you did, enter what you used and how it
          felt as you go, then log the whole day at the bottom. It saves
          to your history and marks that day complete.
        </Q>
        <Q q="How do I request a different session time, or reschedule?">
          Schedule → &quot;Request time,&quot; or tap an upcoming session
          and choose &quot;Request reschedule.&quot; Mickey will confirm
          or suggest another time — it&apos;s a request, not an automatic
          booking.
        </Q>
        <Q q="How do I cancel a session?">
          Schedule → tap the day → Cancel. Please give at least 12
          hours notice if you can — see the cancellation policy below
          for what happens if you can&apos;t.
        </Q>
        <Q q="What counts as a late cancellation?">
          Cancelling with less than 12 hours notice. What happens next
          depends on your payment plan. Monthly: your first one is just
          noted, no penalty — a second within a rolling 16 weeks adds a
          $10 fee. Pay-as-you-go: there&apos;s no free pass, so the very
          first late cancellation in that window adds a $20 fee. Either
          way, your upcoming sessions pause until the fee is paid.
        </Q>
        <Q q="Can I switch between monthly and pay-as-you-go?">
          Yes, any time — Profile → Payment plan. You&apos;ll read and
          agree to the terms of whichever plan you&apos;re switching to
          before it takes effect. Your late-cancellation history carries
          over no matter which way you switch, and a fee that&apos;s
          already been charged stays owed even if you switch right after.
          One exception: switching from monthly to pay-as-you-go forfeits
          any remaining free late cancellation and moves you to the $20
          fee right away.
        </Q>
        <Q q="What if Mickey has to cancel on me instead?">
          You&apos;ll never be charged or lose anything for it — it&apos;s
          marked as her cancellation, you get a free reschedule, and no
          fee ever applies. You&apos;ll get an email as soon as it
          happens, and she&apos;ll usually follow up by text too.
        </Q>
        <Q q="How do I track progress photos or measurements?">
          Progress → add a photo any time (front/side/back, whatever you
          want) right from your phone. Measurements are logged by Mickey
          during your check-ins and show up on the same page with trend
          lines.
        </Q>
        <Q q="What's the Community board?">
          An optional space to post wins, questions, or photos that
          every other client can see and support — not just Mickey. It
          asks you to read and sign a short agreement the first time you
          open it, since it&apos;s the one place your own posts are visible
          to people besides your coach. Nothing you track privately
          (progress photos, measurements, etc.) ever shows up there
          unless you choose to post it yourself.
        </Q>
        <Q q="Can I get a copy of everything tracked about me?">
          Yes — Profile → &quot;Download my data&quot; gives you a full
          export of your sessions, check-ins, measurements, documents,
          and everything else, any time you want it.
        </Q>
        <Q q="I train virtually — will session times show up in my own timezone?">
          Once your timezone is set on your Profile page, yes — your
          schedule, next-session card, and reminder emails all convert
          automatically. If a time still looks off, double check that
          field is set correctly.
        </Q>
        <Q q="What's a check-in call?">
          A one-time, 30-minute call for anything that needs more time
          than a quick message — getting a home setup or equipment
          situated, going deep on something specific, whatever comes up.
          Available whether you train in-person, virtually, or fully
          async. Book one anytime from your dashboard.
        </Q>
        <Q q="Can I pause training without losing my spot?">
          Yes — a membership hold. There&apos;s no session schedule while
          you&apos;re on hold, but a flat $10/week retainer keeps your app
          access active and reserves your spot rather than opening it up
          to someone else. Ask Mickey to start or end a hold for you.
        </Q>
      </Section>

      <Section title="Working With Mickey">
        <Q q="What's your training philosophy?">
          NASM-based strength and movement coaching built around four
          progressive phases — Stability, Strength, Size, and Speed —
          paired with Intuitive Eating nutrition guidance. Training with
          purpose and intention, not punishment or obsession.
        </Q>
        <Q q="What do the four phases mean?">
          Stability builds control and movement quality first. Strength
          adds load once that foundation is solid. Size focuses on
          muscle-building volume. Speed layers in power and athleticism.
          Everyone starts wherever makes sense for their body, not
          necessarily at phase one.
        </Q>
        <Q q="Why don't we count calories or talk about earning/burning food?">
          Nutrition coaching here is based on Intuitive Eating — building
          body awareness and trusting your hunger and fullness cues
          instead of rules, guilt, or restriction. It&apos;s general
          wellness education, not medical nutrition therapy, and isn&apos;t a
          replacement for a licensed dietitian or physician if you need
          one.
        </Q>
        <Q q="What certifications does Mickey hold?">
          NASM-based training plus certified specializations in
          Pain-Free Movement, Glute Development, Behavior Change, Senior
          Fitness, Bodybuilding, Strength &amp; Conditioning, and
          Nutrition.
        </Q>
        <Q q="What's the difference between in-person and virtual sessions?">
          In-person includes hands-on support like assisted stretching,
          foam rolling, and Theragun work. Virtual covers form coaching,
          programming, and nutrition support over video. A standalone
          written program (no sessions at all) is also available.
        </Q>
        <Q q="What is fully virtual / async coaching?">
          A different model for fully-virtual clients: no standing video
          calls at all. Mickey updates your program directly in the app
          on her own cadence, and your dashboard shows when it was last
          updated instead of a next-session time. If you want dedicated
          time to talk something through, book a 30-minute check-in call
          whenever you need one.
        </Q>
        <Q q="What equipment do I need for a virtual session?">
          Depends entirely on what that session is for. Prop your phone
          up somewhere Mickey can see you clearly — at home or at your
          own gym — with whatever the session calls for. A check-in or
          form-coaching conversation needs nothing special, but if
          you&apos;re working a movement like a heavy deadlift,
          you&apos;ll need to be somewhere with weight heavy enough to
          actually show it.
          Ask ahead of time if you&apos;re not sure what a given session
          needs.
        </Q>
        <Q q="Do you work with injuries, chronic conditions, or older adults?">
          Yes — programs are built around your actual health history and
          current limitations, not a generic template. Always tell
          Mickey about any condition, injury, or medication change as
          soon as it comes up, not just at intake.
        </Q>
        <Q q="What's expected of me as a client?">
          Honesty, mainly. Say when something hurts, when life gets in
          the way, when motivation dips. Mickey can only adjust to what
          you actually tell her — she can&apos;t feel what&apos;s happening in
          your body, so communicating your limits in the moment is your
          job, not something to push through quietly.
        </Q>
      </Section>

      <Section title="General Fitness Basics">
        <Q q="How often should I be training?">
          Depends entirely on your program, goals, and recovery — that&apos;s
          exactly what your care track and phase are built around. Ask
          Mickey directly if you&apos;re ever unsure whether to add or pull
          back a session.
        </Q>
        <Q q="Is it normal to be sore after a session?">
          Some soreness in the day or two after, especially with
          something new, is normal. Sharp pain, pain during the movement
          itself, or soreness that isn&apos;t easing up after a few days
          isn&apos;t — tell Mickey either way so she can adjust.
        </Q>
        <Q q="What if an exercise feels like too much?">
          Say so, right then. Every program is guidance, not a demand —
          you&apos;re always free to modify, scale back, or skip a movement
          based on how your body actually feels that day.
        </Q>
        <Q q="I'm nervous about starting — is that normal?">
          Completely. Most people feel that way walking in. Sessions are
          built to meet you exactly where you are, not to prove
          anything.
        </Q>
        <Q q="Do I need to warm up or stretch on my own?">
          Your program accounts for warm-up as part of each session — you
          don&apos;t need a separate routine unless Mickey specifically gives
          you one.
        </Q>
      </Section>
    </div>
  );
}
