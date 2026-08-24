-- Reworks session_mode from a confusing 4-way split (in_person / virtual /
-- mixed / virtual_async) down to 2 base modes: in_person and virtual, where
-- "virtual" now means async-first programming by default (what
-- virtual_async used to mean). Video sessions become an orthogonal add-on
-- (clients.video_sessions_enabled) that either base mode can have -- an
-- in-person client with it on replaces what "mixed" used to cover, and a
-- virtual client with it on replaces what plain "virtual" used to mean
-- before the async split.
--
-- Also adds the actual booking mechanics for that add-on: a client with it
-- enabled can request a video session through the app (a new
-- requests.request_type), which creates a linked payment balance they can
-- only pay via Cash App/Zelle (business_settings.google_meet_link is the
-- coach's persistent room link, shown once a session's confirmed). The
-- coach approves the timeslot and marks the balance paid together.

alter table public.clients
  add column if not exists video_sessions_enabled boolean not null default false;

-- Backfill: anything that involved virtual delivery before gets the add-on
-- flag, then session_mode collapses down to the 2 real base modes.
update public.clients
  set video_sessions_enabled = true
  where session_mode in ('virtual', 'virtual_async', 'mixed');

update public.clients
  set session_mode = 'in_person'
  where session_mode = 'mixed';

update public.clients
  set session_mode = 'virtual'
  where session_mode = 'virtual_async';

alter table public.clients
  drop constraint if exists clients_session_mode_check,
  add constraint clients_session_mode_check
    check (session_mode in ('in_person', 'virtual'));

alter table public.business_settings
  add column if not exists google_meet_link text;

alter table public.requests
  drop constraint if exists requests_request_type_check,
  add constraint requests_request_type_check
    check (request_type in ('session', 'checkin_call', 'video_session'));

alter table public.payments
  add column if not exists request_id uuid references public.requests (id) on delete set null;

alter table public.session_occurrences
  add column if not exists is_video_session boolean not null default false;

-- A client can create the pending balance for their own video session
-- request -- narrowly scoped the same way the late-cancellation fee
-- insert is: fixed kind/amount, unpaid, and tied to a real pending
-- video_session request they actually own.
create policy "payments: client creates own video session balance"
  on public.payments for insert
  with check (
    kind = 'session'
    and amount = 25
    and paid_on is null
    and request_id is not null
    and exists (
      select 1 from public.clients c
      where c.id = payments.client_id and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.requests r
      where r.id = payments.request_id
        and r.client_id = payments.client_id
        and r.request_type = 'video_session'
    )
  );

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
- In-person: hands-on coaching, including assisted stretching, foam rolling, and Theragun therapy
- Virtual: programming updated on Mickey's own cadence instead of standing sessions
- Video sessions are an optional add-on available to either in-person or virtual clients, booked and paid for individually through the app
- Standalone written program available without sessions ($50)
- One-time 30-minute check-in call, available to any client regardless of session mode

## 2. Rates & Payment

- In-Person Session: $40 / session
- Video Session (add-on, either plan): $25 / session, paid via Cash App or Zelle at the time of booking -- your coach confirms the timeslot once payment is received
- Standalone Written Plan: $50 (no sessions)
- Fully virtual programming and check-in calls are billed as agreed with your coach rather than a fixed listed rate

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
