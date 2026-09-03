import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { getMyClient } from "@/lib/current-client";
import { Card, Collapsible, Heart } from "@/components/ui";
import { CALL_DURATION_MINUTES, VIDEO_SESSION_RATE } from "@/lib/video-session";
import { makeT } from "@/lib/i18n";

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

export default async function ClientFaqPage() {
  const me = await getMyClient();
  const t = makeT(me?.language);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("FAQ")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Using the app, what to expect from coaching with Mickey, and a few general fitness basics. Tap a question to expand it — for the full wellness education (movement, nutrition, mindset, recovery), see your")}{" "}
          <Link href="/client/guide" className="text-rose hover:underline">
            {t("Wellness Guide")}
          </Link>
          .
        </p>
      </div>

      <Section title={t("Using the App")}>
        <Q q={t("How do I log a workout?")}>
          {t("Program → open the day you did, enter what you used and how it felt as you go, then log the whole day at the bottom. It saves to your history and marks that day complete.")}
        </Q>
        <Q q={t("How do I request a different session time, or reschedule?")}>
          {t('Schedule → "Request time," or tap an upcoming session and choose "Request reschedule." Mickey will confirm or suggest another time — it\'s a request, not an automatic booking.')}
        </Q>
        <Q q={t("How do I cancel a session?")}>
          {t("Schedule → tap the day → Cancel. Please give at least 12 hours notice if you can — see the cancellation policy below for what happens if you can't.")}
        </Q>
        <Q q={t("What counts as a late cancellation?")}>
          {t("Cancelling with less than 12 hours notice, tracked on a rolling 16-week cycle. What happens next depends on your payment plan. Monthly: your first 2 in that window are just noted, no penalty — the 3rd adds a $10 fee. Pay-as-you-go: your first is noted, no penalty — the 2nd adds a $20 fee. Either way, your upcoming sessions pause until the fee is paid, and free cancellations don't roll over once a 16-week cycle passes with no late cancellation.")}
        </Q>
        <Q q={t("Can I switch between monthly and pay-as-you-go?")}>
          {t("Yes, any time — Profile → Payment plan. You'll read and agree to the terms of whichever plan you're switching to before it takes effect. A fee that's already been charged stays owed no matter which plan you switch to afterward. Switching from monthly to pay-as-you-go forfeits any free cancellation beyond pay-as-you-go's smaller allotment (an unused first one still carries over) and moves you to the $20 rate. Switching from pay-as-you-go to monthly never restores a free cancellation you've already used — only your future fee rate drops, to $10.")}
        </Q>
        <Q q={t("What if Mickey has to cancel on me instead?")}>
          {t("You'll never be charged or lose anything for it — it's marked as her cancellation, you get a free reschedule, and no fee ever applies. You'll get an email as soon as it happens, and she'll usually follow up by text too.")}
        </Q>
        <Q q={t("How do I track progress photos or measurements?")}>
          {t("Progress → add a photo any time (front/side/back, whatever you want) right from your phone. Measurements are logged by Mickey during your check-ins and show up on the same page with trend lines.")}
        </Q>
        <Q q={t("What's the Community board?")}>
          {t("An optional space to post wins, questions, or photos that every other client can see and support — not just Mickey. It asks you to read and sign a short agreement the first time you open it, since it's the one place your own posts are visible to people besides your coach. Nothing you track privately (progress photos, measurements, etc.) ever shows up there unless you choose to post it yourself.")}
        </Q>
        <Q q={t("Can I get a copy of everything tracked about me?")}>
          {t('Yes — Profile → "Download my data" gives you a full export of your sessions, check-ins, measurements, documents, and everything else, any time you want it.')}
        </Q>
        <Q q={t("I train virtually — will session times show up in my own timezone?")}>
          {t("Once your timezone is set on your Profile page, yes — your schedule, next-session card, and reminder emails all convert automatically. If a time still looks off, double check that field is set correctly.")}
        </Q>
        <Q q={t("What's a check-in call?")}>
          {t(
            "A one-time, {minutes}-minute call for anything that needs more time than a quick message — getting a home setup or equipment situated, going deep on something specific, whatever comes up. Available whether you train in-person or virtually. Book one anytime from your dashboard.",
            { minutes: CALL_DURATION_MINUTES }
          )}
        </Q>
        <Q q={t("Can I pause training without losing my spot?")}>
          {t("Yes — a membership hold. There's no session schedule while you're on hold, but a flat $10/week retainer keeps your app access active and reserves your spot rather than opening it up to someone else. Ask Mickey to start or end a hold for you.")}
        </Q>
      </Section>

      <Section title={t("Working With Mickey")}>
        <Q q={t("What's your training philosophy?")}>
          {t("NASM-based strength and movement coaching built around four progressive phases — Stability, Strength, Size, and Speed — paired with Intuitive Eating nutrition guidance. Training with purpose and intention, not punishment or obsession.")}
        </Q>
        <Q q={t("What do the four phases mean?")}>
          {t("Stability builds control and movement quality first. Strength adds load once that foundation is solid. Size focuses on muscle-building volume. Speed layers in power and athleticism. Everyone starts wherever makes sense for their body, not necessarily at phase one.")}
        </Q>
        <Q q={t("Why don't we count calories or talk about earning/burning food?")}>
          {t("Nutrition coaching here is based on Intuitive Eating — building body awareness and trusting your hunger and fullness cues instead of rules, guilt, or restriction. It's general wellness education, not medical nutrition therapy, and isn't a replacement for a licensed dietitian or physician if you need one.")}
        </Q>
        <Q q={t("What certifications does Mickey hold?")}>
          {t("NASM-based training plus certified specializations in Pain-Free Movement, Glute Development, Behavior Change, Senior Fitness, Bodybuilding, Strength & Conditioning, and Nutrition.")}
        </Q>
        <Q q={t("What's the difference between in-person and virtual?")}>
          {t("In-person means standing sessions with Mickey in person — hands-on support like assisted stretching, foam rolling, and Theragun work, billed per session. Virtual means your program is built and updated in the app on Mickey's own cadence, with no standing calls by default, for a flat $90/month. A standalone written program (no ongoing coaching at all) is also available.")}
        </Q>
        <Q q={t("Can I add video sessions to either mode?")}>
          {t(
            'Yes, if Mickey\'s turned the video session add-on on for your profile — check your dashboard for a "Book a video session" option. It works the same whether you\'re in-person or virtual: propose a time, pay the ${rate} balance via Cash App or Zelle, and Mickey confirms the timeslot once it clears. Sessions run {minutes} minutes. Once confirmed, a "Join video call" link shows up on your dashboard and schedule for that session.',
            { rate: VIDEO_SESSION_RATE, minutes: CALL_DURATION_MINUTES }
          )}
        </Q>
        <Q q={t("I'm on the virtual plan with no session booked — what happens?")}>
          {t("Your dashboard shows when your program was last updated instead of a next-session time. Mickey updates it directly on her own cadence — nothing for you to schedule. Want dedicated time to talk something through? Book a check-in call, or a video session if you have the add-on.")}
        </Q>
        <Q q={t("What equipment do I need for a virtual session?")}>
          {t("Depends entirely on what that session is for. Prop your phone up somewhere Mickey can see you clearly — at home or at your own gym — with whatever the session calls for. A check-in or form-coaching conversation needs nothing special, but if you're working a movement like a heavy deadlift, you'll need to be somewhere with weight heavy enough to actually show it. Ask ahead of time if you're not sure what a given session needs.")}
        </Q>
        <Q q={t("Do you work with injuries, chronic conditions, or older adults?")}>
          {t("Yes — programs are built around your actual health history and current limitations, not a generic template. Always tell Mickey about any condition, injury, or medication change as soon as it comes up, not just at intake.")}
        </Q>
        <Q q={t("What's expected of me as a client?")}>
          {t("Honesty, mainly. Say when something hurts, when life gets in the way, when motivation dips. Mickey can only adjust to what you actually tell her — she can't feel what's happening in your body, so communicating your limits in the moment is your job, not something to push through quietly.")}
        </Q>
      </Section>

      <Section title={t("General Fitness Basics")}>
        <Q q={t("How often should I be training?")}>
          {t("Depends entirely on your program, goals, and recovery — that's exactly what your care track and phase are built around. Ask Mickey directly if you're ever unsure whether to add or pull back a session.")}
        </Q>
        <Q q={t("Is it normal to be sore after a session?")}>
          {t("Some soreness in the day or two after, especially with something new, is normal. Sharp pain, pain during the movement itself, or soreness that isn't easing up after a few days isn't — tell Mickey either way so she can adjust.")}
        </Q>
        <Q q={t("What if an exercise feels like too much?")}>
          {t("Say so, right then. Every program is guidance, not a demand — you're always free to modify, scale back, or skip a movement based on how your body actually feels that day.")}
        </Q>
        <Q q={t("I'm nervous about starting — is that normal?")}>
          {t("Completely. Most people feel that way walking in. Sessions are built to meet you exactly where you are, not to prove anything.")}
        </Q>
        <Q q={t("Do I need to warm up or stretch on my own?")}>
          {t("Your program accounts for warm-up as part of each session — you don't need a separate routine unless Mickey specifically gives you one.")}
        </Q>
      </Section>
    </div>
  );
}
