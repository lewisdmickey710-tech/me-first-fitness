-- Corrects the late-cancellation free allotments from what actually shipped
-- in migrations 0067/0069. What was documented and built there was wrong:
-- monthly clients only got 1 free cancellation (fee on the 2nd) and
-- pay-as-you-go got 0 free (fee on the 1st). The real intended policy is
-- monthly = 2 free (fee on the 3rd), pay-as-you-go = 1 free (fee on the
-- 2nd), tracked independently per plan rather than derived from a single
-- shared trigger point.
--
-- Plan switches are also asymmetric in a way a plain rolling-window count
-- can't express on its own: downgrading (monthly -> pay-as-you-go)
-- forfeits whatever free cancellation the new plan doesn't cover, but
-- upgrading (pay-as-you-go -> monthly) never hands back a free
-- cancellation already spent under the stricter plan. That needs a real
-- per-client counter for the active cycle rather than recomputing
-- everything fresh from history each time -- see
-- src/lib/cancellation.ts (effectiveFreeRemaining / adjustFreeRemainingForSwitch)
-- and the rewritten cancelMySession / switchPaymentSchedule in
-- src/app/client/actions.ts.

alter table public.clients
  add column if not exists late_cancel_free_remaining integer;

update public.legal_documents set
  version = version + 1,
  updated_at = now(),
  body = $t$By switching to the monthly payment plan, I agree to the following:

- I'm billed for the month rather than session-by-session, and I get one guaranteed reschedule per month at no cost regardless of notice given.
- Late cancellations (less than 12 hours notice) run on a rolling 16-week window. My first two late cancellations in that window are simply noted, no charge. My third triggers a $10 fee, and my upcoming sessions pause until it's paid.
- If I later switch to pay-as-you-go, any free late cancellation I haven't used forfeits down to pay-as-you-go's own allotment (never more than 1), and my fee rate moves to $20 going forward.
- A late cancellation fee that's already been charged stays owed no matter which plan I switch to afterward -- switching plans never waives or refunds a fee already triggered.$t$
where key = 'monthly_plan_terms';

update public.legal_documents set
  version = version + 1,
  updated_at = now(),
  body = $t$By switching to the pay-as-you-go payment plan, I agree to the following:

- I pay per session rather than a flat monthly rate, and there's no guaranteed free reschedule.
- Late cancellations (less than 12 hours notice) run on the same rolling 16-week window as monthly, but with a smaller allotment: my first late cancellation in that window is simply noted, no charge. My second triggers a $20 fee, and my upcoming sessions pause until it's paid.
- If I later switch to monthly, my fee rate drops to $10, but switching never restores a free cancellation I've already used under pay-as-you-go's smaller allotment.
- If I later switch to monthly, a late cancellation fee that's already been charged before the switch stays owed -- switching plans never waives or refunds it.$t$
where key = 'payg_plan_terms';

update public.legal_documents set
  version = version + 1,
  updated_at = now(),
  body = $t$## Parties

This Client Services Agreement ("Agreement") is entered into between:

**Service Provider:** Mickey, MeFirstFitness — Mind & Muscle Mechanics, sole proprietor, Texas

**Client:** as signed below

## 1. Services Provided

- NASM-based personal training — Stability, Strength, Size, and Speed phases
- Certified specializations: Pain-Free Movement, Glute Development, Behavior Change, Senior Fitness, Bodybuilding, Strength & Conditioning, and Nutrition
- Intuitive Eating nutritional coaching (certified nutritionist)
- Custom 3-day workout programming per phase with superset options
- In-person only: assisted stretching, foam rolling, Theragun therapy
- Virtual: form coaching, programming, nutrition support
- Fully virtual (async): programming updated on Mickey's own cadence instead of standing video sessions
- Standalone written program available without sessions ($50)
- One-time 30-minute check-in call, available to any client regardless of session mode

## 2. Rates & Payment

- In-Person Session: $40 / session
- Virtual Session: $25 / session
- Standalone Written Plan: $50 (no sessions)
- Fully virtual (async) programming and check-in calls are billed as agreed with your coach rather than a fixed listed rate

Payment schedule is either pay-as-you-go (each session) or monthly client (1 guaranteed reschedule per month) — as set on your profile. You may switch between the two at any time from the app, after reading and agreeing to the terms of whichever plan you're switching to. Payment is due at time of service via Cash, Cash App, or Zelle.

## 3. Cancellation Policy

Please provide at least 12 hours notice to cancel or reschedule a session, through the app. Monthly clients receive one guaranteed reschedule per month at no cost, regardless of notice given.

Cancelling with less than 12 hours notice counts as a late cancellation, tracked on a rolling 16-week window (one training cycle). Each plan has its own free allotment for the current cycle:

- **Monthly clients:** your first 2 late cancellations within the rolling window are simply noted, no charge. Your 3rd triggers a $10 fee, and upcoming sessions are paused until it's marked paid.
- **Pay-as-you-go clients:** your first late cancellation within the rolling window is simply noted, no charge. Your 2nd triggers a $20 fee, and upcoming sessions are paused until it's marked paid.

Free late cancellations do not roll over between cycles -- once 16 weeks pass with no late cancellation, the next one starts a fresh cycle at your current plan's full allotment.

Switching plans mid-cycle affects your free allotment asymmetrically. Switching from monthly to pay-as-you-go forfeits any free cancellation beyond pay-as-you-go's smaller allotment (an unused first cancellation still carries over). Switching from pay-as-you-go to monthly never restores a free cancellation you've already used -- only your future fee rate changes, to $10. A late cancellation fee that has already been charged remains owed regardless of which plan you switch to afterward.

## 4. Membership Hold

If you need to pause training without giving up your spot, a membership hold keeps your app access active and reserves your place rather than opening it to another client, for a flat $10/week retainer in place of your normal session billing. Your coach starts and ends a hold on your behalf. Retainer payments continue automatically, week over week, for as long as the hold is active.

## 5. No-Show Policy

Clients who do not show and do not contact Mickey will be logged. Repeated no-shows may result in termination of the coaching relationship at Mickey's discretion.

## 6. Health & Safety

Client agrees to disclose all relevant health conditions, injuries, and medications before training and to inform Mickey immediately of any changes. Mickey reserves the right to modify or pause a session if safety is a concern.

## 7. Nutritional Disclaimer

Nutritional coaching provided by Mickey is based on Intuitive Eating principles and general wellness education. This is not medical nutrition therapy and does not replace advice from a licensed dietitian, physician, or mental health provider. Clients with eating disorder history are encouraged to maintain concurrent professional support.

## 8. Results Disclaimer

MeFirstFitness does not guarantee specific physical results. Results depend on individual effort, consistency, health status, and adherence. Mickey is committed to high-quality, evidence-informed coaching.

## 9. Confidentiality

All client information — health history, session notes, nutrition records, and personal communications — is strictly confidential and will not be shared without written consent, except as required by law.

## 10. Photos & Testimonials

Progress photos and testimonials will not be used publicly without explicit written consent. A separate Media Release Form will be provided if applicable.

## 11. Termination

Either party may terminate this Agreement with reasonable notice. Amounts owed for completed sessions remain due. A Training Cancellation Notice will be completed upon termination.

## 12. Governing Law

This Agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in the county of the coach's principal place of business.

## Client Acknowledgment

By signing below, I confirm that I have read, understood, and agree to all terms of this Client Services Agreement. I understand that my health and safety are a shared responsibility and I commit to honest and open communication with my coach, Mickey, throughout our work together.$t$
where key = 'contract';
