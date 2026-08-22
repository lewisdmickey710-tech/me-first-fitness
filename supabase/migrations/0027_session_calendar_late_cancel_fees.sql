-- Self-service session calendar: clients can now see their upcoming
-- sessions and act on them directly (cancel immediately, or request a
-- reschedule for coach approval) instead of only seeing a single "next
-- session" line and having to text/call.
--
-- Late cancellation fees ride on the existing payments table (same
-- Cash/Cash App/Zelle "mark paid" flow clients and Mickey already use)
-- rather than a new table -- a `kind` column just distinguishes a normal
-- session payment from a late-cancellation fee. `session_occurrence_id`
-- traces which specific late cancellation triggered a given fee, so a
-- client can't be double-charged for the same cancellation.
--
-- requests.reschedule_from_date ties a reschedule request to the actual
-- session being moved (vs. the older freeform "propose any time"), so
-- confirming it can automatically mark that original date as rescheduled.

alter table public.payments
  add column if not exists kind text not null default 'session'
    check (kind in ('session', 'late_cancellation_fee')),
  add column if not exists session_occurrence_id uuid
    references public.session_occurrences (id) on delete set null;

alter table public.requests
  add column if not exists reschedule_from_date date;

-- session_occurrences previously had no client-write policy at all (coach
-- full access + client read-only) -- clients could only ever see attendance
-- history the coach logged, never act on it themselves. Adds a narrow
-- client write path: a client may insert/update only their own rows, and
-- only ever set status to 'cancelled' or 'late_cancelled' (never
-- 'completed' or 'rescheduled', which stay coach-only). The trigger closes
-- the remaining gap an RLS policy alone can't: it blocks any non-coach
-- write to a row already marked 'completed', so a client can't cancel their
-- way out of an attended session via a raw API call.
create policy "session_occurrences: client cancels own (insert)"
  on public.session_occurrences for insert
  with check (
    status in ('cancelled', 'late_cancelled')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

create policy "session_occurrences: client cancels own (update)"
  on public.session_occurrences for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    status in ('cancelled', 'late_cancelled')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

create or replace function public.session_occurrences_guard_client_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if old is not null and old.status = 'completed' then
      raise exception 'Not permitted to change a completed session.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists session_occurrences_guard_client_writes_trigger on public.session_occurrences;
create trigger session_occurrences_guard_client_writes_trigger
  before update on public.session_occurrences
  for each row execute procedure public.session_occurrences_guard_client_writes();

-- Clients also need to be able to create the fee payment their own late
-- cancellation triggers (the payments table was previously coach-write-only
-- for everything). Narrowly scoped: only a 'late_cancellation_fee' row,
-- for themselves, unpaid, at the fixed real amount -- never a 'session'
-- payment (those stay coach-only) and never one they mark paid themselves.
create policy "payments: client creates own late cancellation fee"
  on public.payments for insert
  with check (
    kind = 'late_cancellation_fee'
    and amount = 10
    and paid_on is null
    and exists (
      select 1 from public.clients c
      where c.id = payments.client_id and c.user_id = auth.uid()
    )
  );

-- Real policy change (from coach feedback after live testing): the
-- original Option A/B/C language on a second late cancellation was never
-- actually offered anywhere in the app. Replaces it with what's actually
-- enforced -- a flat $10 fee on the second late cancellation within a
-- rolling 16-week window (matching the 4-phase/16-week training cycle),
-- with upcoming sessions paused until it's paid. The monthly-client
-- guaranteed reschedule benefit is unchanged.
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

Payment schedule is either pay-as-you-go (each session) or monthly client (1 guaranteed reschedule per month) — as set on your profile. Payment is due at time of service via Cash, Cash App, or Zelle.

## 3. Cancellation Policy

Please provide at least 12 hours notice to cancel or reschedule a session, through the app. Monthly clients receive one guaranteed reschedule per month at no cost, regardless of notice given.

Cancelling with less than 12 hours notice counts as a late cancellation. First late cancellation: noted, no penalty. Second late cancellation within a rolling 16-week period (matching a training cycle): a $10 late cancellation fee applies, and upcoming sessions are paused until the fee is marked paid. The late-cancellation count resets 16 weeks after each late cancellation.

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
