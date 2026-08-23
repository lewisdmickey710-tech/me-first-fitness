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

export default function CoachFaqPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/coach/roster" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          FAQ
        </h1>
        <p className="mt-1 text-sm text-gray">
          Quick answers for how B.O.S. actually works. Tap a question to
          expand it.
        </p>
      </div>

      <Section title="The Motherboard">
        <Q q="What are the flags under a client's name?">
          Short action items: a pending time/reschedule request, high
          cancellation risk, payment or late-cancel fee due, a recent
          cancellation, a just-completed document, or no activity in 3+
          days. Requested/payment/risk flags stay up until resolved.
          Cancellation and document flags clear on their own once you&apos;ve
          opened that client&apos;s profile after they happened — the
          inactivity flag clears once they log anything again.
        </Q>
        <Q q="Why does a flag still show after I looked at it?">
          Opening the client&apos;s profile records that you&apos;ve seen it
          — but only informational flags (a cancellation, a signed
          document) clear that way. Anything that still needs an action
          from you (a request, an unpaid fee, high risk) keeps showing
          until you actually resolve it.
        </Q>
      </Section>

      <Section title="Leads, Signups &amp; Clients">
        <Q q="What's the difference between a Lead and a Signup?">
          A Lead is someone who requested a free assessment through the
          public form — they get a login and a pre-assessment
          questionnaire before you ever meet. A Signup is anyone who
          logged in through the client tab with an email you haven&apos;t
          linked to a client profile yet — usually a current or
          soon-to-be client setting up their account. Link or add them
          from the Signups page; delete or reject either from their
          respective list if it was a test or a no-show.
        </Q>
        <Q q="What happens when I archive a client?">
          They drop off your active roster, but nothing is deleted —
          history, sessions, measurements, everything stays intact and
          they show up under &quot;View archived clients.&quot; Restore
          them any time from there.
        </Q>
      </Section>

      <Section title="Scheduling &amp; Availability">
        <Q q="How do I set my working hours?">
          Availability → &quot;Weekly working hours&quot; — add a
          day/start/end window. Once you&apos;ve added at least one
          window, clients can only request times inside your set hours.
          Nothing set yet means no restriction on requests.
        </Q>
        <Q q="How do I block off time?">
          Availability → the week grid lets you tap a start slot then an
          end slot to block just part of a day, or use &quot;Block a
          whole day off&quot; for the whole thing. Either way, any client
          scheduled in that window gets auto-cancelled — free
          reschedule, no fee — and emailed right away.
        </Q>
        <Q q="How is cancelling a session myself different from a client cancelling?">
          On a client&apos;s Attendance tab (or the day view on Schedule),
          &quot;I&apos;m unavailable — cancel &amp; email them&quot; cancels
          it as you, not them — no late fee, free reschedule, and an
          immediate email. Both the client&apos;s and your own view of
          that session show whether it was you or them who cancelled.
        </Q>
        <Q q="How do late cancellation fees work?">
          A client cancelling with under 12 hours notice is a late
          cancellation. It&apos;s tiered by payment plan: monthly clients
          get one free pass, then a $10 fee on the second within a
          rolling 16 weeks. Pay-as-you-go clients have no free pass — the
          first late cancellation in that window adds a $20 fee. Either
          way, their upcoming sessions pause until it&apos;s marked paid.
        </Q>
        <Q q="Can clients switch their own payment plan?">
          Yes — Profile → Payment plan on their side, fully self-serve.
          They read and sign the terms of whichever plan they&apos;re
          switching to before it takes effect. Their late-cancellation
          count carries over regardless of direction, and a fee already
          charged stays owed even if they switch right after. Switching
          from monthly down to pay-as-you-go forfeits any remaining free
          late cancellation and moves them to the $20 rate immediately —
          that&apos;s the one asymmetric case.
        </Q>
        <Q q="How does a membership hold work?">
          Client profile → Membership hold → &quot;Start hold.&quot; It
          pauses their session reminders and marks them on hold on the
          roster, and adds a $10 retainer payment right away — a new one
          gets added automatically every 7 days for as long as they stay
          on hold, so it never needs manual follow-up. &quot;End hold&quot;
          any time to send them back to normal.
        </Q>
        <Q q="What are check-in call requests?">
          A client can book a one-time 30-minute call from their side —
          shows up in your pending requests the same as a session time
          request, just labeled &quot;Check-in call.&quot; Confirm it the
          same way; it lands on your calendar as a normal one-off session
          from that point on.
        </Q>
      </Section>

      <Section title="Programs">
        <Q q="How do I change one client's program without touching the shared template?">
          Client profile → Program tab. Drag to reorder, swap a movement,
          or adjust sets/reps/tempo/remove — all of it only affects that
          client. The shared template everyone else on their track
          follows is untouched. Edit the actual template from Programs
          in the main nav.
        </Q>
      </Section>

      <Section title="Documents &amp; Community">
        <Q q="How do assigned documents work?">
          Required documents (contract, onboarding, liability waiver) go
          to every client automatically. Optional ones — like the Minor
          Consent Addendum — only reach clients you check off on their
          Documents tab. A client&apos;s read/signed status for each shows
          right there.
        </Q>
        <Q q="How do I moderate the community board?">
          Coach nav → Community. You can drop your own comments into any
          thread, and &quot;Remove&quot; deletes any post or comment that
          doesn&apos;t belong. Clients can only delete their own.
        </Q>
      </Section>

      <Section title="Payments &amp; Testimonials">
        <Q q="How do I mark a payment paid?">
          Client profile → Payments tab, or from the payment badge
          wherever it shows on the roster/session history — mark paid
          right there, no separate flow.
        </Q>
        <Q q="Where do I find quotable client feedback?">
          Coach nav → Testimonials collects every service check-in a
          client explicitly agreed to let you quote, so you&apos;re not
          hunting through individual client tabs for it.
        </Q>
      </Section>

      <Section title="Virtual Clients &amp; Data">
        <Q q="What's the 'Fully virtual — async' session mode?">
          For virtual clients you&apos;d rather manage with programming
          updates than standing video calls. Set it on their Profile tab. They get
          no session reminders and no next-session card — their dashboard
          shows &quot;program last updated&quot; instead, which you control
          with the &quot;Mark program updated today&quot; button on their
          Program tab after you actually make their changes. They can
          still book a 30-minute check-in call any time they want dedicated
          time with you.
        </Q>
        <Q q="How do I set a client's timezone?">
          Client profile tab → Timezone. Their schedule, next-session
          card, and reminder emails all convert to that timezone
          automatically from then on — your own calendar always stays in
          yours.
        </Q>
        <Q q="How does a client get a copy of their own data?">
          Their own Profile page has a &quot;Download my data&quot;
          button — a full export of everything tracked for them. You can
          pull the same export yourself from their Profile tab, worth
          doing before you archive someone.
        </Q>
      </Section>
    </div>
  );
}
