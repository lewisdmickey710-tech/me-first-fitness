-- Lets the coach dismiss a roster "attention" flag when she already knows
-- why it's showing (a client's on a known vacation, a family emergency,
-- etc.) instead of it nagging her every time she looks at the board. Kept
-- as its own audit trail -- who/when/why -- rather than just silently
-- clearing the flag, so there's a record of the call she made and it can
-- still be found later. `until_date` is optional: leave it blank for an
-- indefinite override she clears herself, or set a date to have the flag
-- start showing again automatically once that day passes.
create table if not exists public.client_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  flag_key text not null check (flag_key in ('inactive', 'high_risk', 'session_not_logged')),
  reason text not null,
  until_date date,
  created_at timestamptz not null default now()
);

alter table public.client_flag_overrides enable row level security;

create policy "client_flag_overrides: coach full access"
  on public.client_flag_overrides for all
  using (public.is_coach())
  with check (public.is_coach());
