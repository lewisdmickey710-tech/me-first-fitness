-- Mutual aid / bartering: a new payment kind so a traded good or service
-- (valued at an agreed dollar amount) can be tracked the same way a cash
-- payment is, but broken out separately in Finances until the coach is
-- ready to merge it into her income totals for tax purposes.
alter table public.payments
  drop constraint if exists payments_kind_check,
  add constraint payments_kind_check
    check (kind in ('session', 'late_cancellation_fee', 'retainer', 'barter'));

-- ============================================================
-- sliding_scale_applications
-- Public, no-login application submitted from a page like
-- request-assessment. The insert runs through the admin client (same
-- pattern submitAssessmentRequest already uses for a public, unauthenticated
-- submission) rather than an anon RLS policy, so no client-side insert
-- policy is needed here -- only the coach ever reads/updates these rows.
-- ============================================================
create table if not exists public.sliding_scale_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  situation text not null,
  what_would_work text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  approved_rate numeric,
  coach_notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sliding_scale_applications enable row level security;

create policy "sliding_scale_applications: coach full access"
  on public.sliding_scale_applications for all
  using (public.is_coach())
  with check (public.is_coach());
