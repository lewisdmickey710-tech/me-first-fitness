-- Tiered late-cancellation policy + client self-service plan switching.
--
-- Policy change (from coach): monthly clients keep the existing 1-free/
-- 2nd-triggers-a-fee structure, still $10. Pay-as-you-go clients lose the
-- free pass entirely -- their very first late cancellation in the rolling
-- 16-week window triggers a fee, now $20. The threshold/amount are derived
-- from clients.payment_schedule at cancellation time in application code
-- (src/lib/cancellation.ts) rather than stored here, which is also what
-- makes the rest of this work: since the rolling-window count is read
-- straight off real session_occurrences rows, it's untouched by a plan
-- switch either direction -- "budget" naturally carries over with no extra
-- bookkeeping. The one asymmetric case (switching monthly -> pay-as-you-go
-- forfeits a remaining free cancellation and moves the client to the $20
-- rate immediately) falls out of the same mechanism: the very next late
-- cancellation is evaluated against the new plan's threshold of 1, not
-- whatever was left under the old plan.
--
-- Clients can now switch their own payment_schedule (previously coach-only)
-- through a dedicated /client/plan flow that requires reading and signing
-- plan-specific terms first, reusing the existing legal_documents /
-- client_document_acknowledgments machinery.

alter table public.legal_documents
  drop constraint legal_documents_key_check,
  add constraint legal_documents_key_check
    check (key in (
      'contract', 'onboarding_form', 'disclaimer', 'minor_consent',
      'community_agreement', 'monthly_plan_terms', 'payg_plan_terms'
    ));

insert into public.legal_documents (key, title, body, requires_signature, assigned_to_all) values
  (
    'monthly_plan_terms',
    'Monthly Payment Plan Terms',
    $t$By switching to the monthly payment plan, I agree to the following:

- I'm billed for the month rather than session-by-session, and I get one guaranteed reschedule per month at no cost regardless of notice given.
- Late cancellations (less than 12 hours notice) run on a rolling 16-week window. My first late cancellation in that window is simply noted, no charge. My second triggers a $10 fee, and my upcoming sessions pause until it's paid.
- If I later switch back to pay-as-you-go, I immediately forfeit any remaining free late cancellation for my current window and my fee rate moves to $20 going forward.
- A late cancellation fee that's already been charged stays owed no matter which plan I switch to afterward -- switching plans never waives or refunds a fee already triggered.$t$,
    true,
    false
  ),
  (
    'payg_plan_terms',
    'Pay-As-You-Go Plan Terms',
    $t$By switching to the pay-as-you-go payment plan, I agree to the following:

- I pay per session rather than a flat monthly rate, and there's no guaranteed free reschedule.
- Late cancellations (less than 12 hours notice) have no free pass on this plan: my very first late cancellation in a rolling 16-week window triggers a $20 fee, and my upcoming sessions pause until it's paid.
- My late-cancellation history isn't reset by switching plans -- it carries over either direction.
- If I later switch to monthly, a late cancellation fee that's already been charged before the switch stays owed -- switching plans never waives or refunds it.$t$,
    true,
    false
  )
on conflict (key) do nothing;

-- The fee amount is now plan-dependent ($10 monthly / $20 pay-as-you-go)
-- rather than always $10.
drop policy if exists "payments: client creates own late cancellation fee" on public.payments;
create policy "payments: client creates own late cancellation fee"
  on public.payments for insert
  with check (
    kind = 'late_cancellation_fee'
    and amount in (10, 20)
    and paid_on is null
    and exists (
      select 1 from public.clients c
      where c.id = payments.client_id and c.user_id = auth.uid()
    )
  );

-- payment_schedule moves from coach-only to client self-service (through
-- the new /client/plan flow, which requires signing the relevant terms
-- document first) -- drop it from the protected-fields guard.
create or replace function public.clients_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if new.user_id is distinct from old.user_id
      or new.care_profile_id is distinct from old.care_profile_id
      or new.days_per_week is distinct from old.days_per_week
      or new.session_mode is distinct from old.session_mode
      or new.sessions_allotted is distinct from old.sessions_allotted
      or new.notes is distinct from old.notes
      or new.track is distinct from old.track
      or new.phase is distinct from old.phase
      or new.start_date is distinct from old.start_date
      or new.primary_goal is distinct from old.primary_goal
      or new.secondary_goal is distinct from old.secondary_goal
      or new.key_health_notes is distinct from old.key_health_notes
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;

-- Section 3 rewritten for the tiered policy, and documents that a client
-- can switch plans themselves from here on.
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
- Standalone written program available without sessions ($50)

## 2. Rates & Payment

- In-Person Session: $40 / session
- Virtual Session: $25 / session
- Standalone Written Plan: $50 (no sessions)

Payment schedule is either pay-as-you-go (each session) or monthly client (1 guaranteed reschedule per month) — as set on your profile. You may switch between the two at any time from the app, after reading and agreeing to the terms of whichever plan you're switching to. Payment is due at time of service via Cash, Cash App, or Zelle.

## 3. Cancellation Policy

Please provide at least 12 hours notice to cancel or reschedule a session, through the app. Monthly clients receive one guaranteed reschedule per month at no cost, regardless of notice given.

Cancelling with less than 12 hours notice counts as a late cancellation. The fee schedule depends on your payment plan:

- **Monthly clients:** your first late cancellation within a rolling 16-week period (matching a training cycle) is simply noted, no charge. Your second late cancellation within that same window triggers a $10 fee, and upcoming sessions are paused until it's marked paid.
- **Pay-as-you-go clients:** there is no free pass. Every late cancellation triggers a $20 fee immediately, and upcoming sessions are paused until it's marked paid.

The 16-week window resets after each late cancellation. Your late-cancellation history is not reset by switching plans in either direction. If you switch from monthly to pay-as-you-go, you immediately forfeit any remaining free late cancellation for your current window and move to the $20 fee going forward. A late cancellation fee that has already been charged remains owed regardless of which plan you switch to afterward.

## 4. No-Show Policy

Clients who do not show and do not contact Mickey will be logged. Repeated no-shows may result in termination of the coaching relationship at Mickey's discretion.

## 5. Health & Safety

Client agrees to disclose all relevant health conditions, injuries, and medications before training and to inform Mickey immediately of any changes. Mickey reserves the right to modify or pause a session if safety is a concern.

## 6. Nutritional Disclaimer

Nutritional coaching provided by Mickey is based on Intuitive Eating principles and general wellness education. This is not medical nutrition therapy and does not replace advice from a licensed dietitian, physician, or mental health provider. Clients with eating disorder history are encouraged to maintain concurrent professional support.

## 7. Results Disclaimer

MeFirstFitness does not guarantee specific physical results. Results depend on individual effort, consistency, health status, and adherence. Mickey is committed to high-quality, evidence-informed coaching.

## 8. Confidentiality

All client information — health history, session notes, nutrition records, and personal communications — is strictly confidential and will not be shared without written consent, except as required by law.

## 9. Photos & Testimonials

Progress photos and testimonials will not be used publicly without explicit written consent. A separate Media Release Form will be provided if applicable.

## 10. Termination

Either party may terminate this Agreement with reasonable notice. Amounts owed for completed sessions remain due. A Training Cancellation Notice will be completed upon termination.

## 11. Governing Law

This Agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in the county of the coach's principal place of business.

## Client Acknowledgment

By signing below, I confirm that I have read, understood, and agree to all terms of this Client Services Agreement. I understand that my health and safety are a shared responsibility and I commit to honest and open communication with my coach, Mickey, throughout our work together.$t$
where key = 'contract';
