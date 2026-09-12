-- Reusable "comp session package" -- a block of donated/complimentary
-- sessions (a silent auction donation, a giveaway, a referral perk, etc.)
-- followed by an optional discounted-rate window if the client signs on
-- for recurring training afterward. One row per package; a client only
-- ever has one ACTIVE (completed_at is null) package at a time.
--
-- session_value is what a comp session is worth for display purposes --
-- it drives clients.session_rate while the package is active, so a comp
-- session logged as "waived" shows its real dollar value via the existing
-- gbtcCoverage() helper, and so the discount rate pre-fills the "Add
-- payment" form once they convert. previous_session_rate captures whatever
-- rate (if any) the client already had before the package started, so it
-- can be restored -- rather than blindly reset to null -- once the
-- package is fully used or cancelled.
create table if not exists public.comp_session_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  label text not null,
  session_value numeric(10,2) not null check (session_value >= 0),
  comp_sessions_total int not null check (comp_sessions_total > 0),
  comp_sessions_used int not null default 0 check (comp_sessions_used >= 0),
  discount_rate numeric(10,2) check (discount_rate is null or discount_rate >= 0),
  discount_sessions_total int not null default 0 check (discount_sessions_total >= 0),
  discount_sessions_used int not null default 0 check (discount_sessions_used >= 0),
  previous_session_rate numeric(10,2),
  signed_on_recurring_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (comp_sessions_used <= comp_sessions_total),
  check (discount_sessions_used <= discount_sessions_total)
);

-- Only one package tracked at a time per client -- starting a new one
-- requires closing out (converted-to-completion or cancelled) the last.
create unique index if not exists comp_session_packages_one_active_per_client
  on public.comp_session_packages (client_id)
  where completed_at is null;

alter table public.comp_session_packages enable row level security;

create policy "comp_session_packages: coach full access"
  on public.comp_session_packages for all
  using (public.is_coach())
  with check (public.is_coach());
