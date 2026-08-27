-- Bookkeeping ledger additions -- coach-only expense tracking (so the
-- Bookkeeping page can show real net income, not just gross) and a small
-- renewal-reminder table for things like certifications and liability
-- insurance that lapse on a date and need a heads-up before they do.

create table if not exists public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  description text not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

alter table public.business_expenses enable row level security;

create policy "business_expenses: coach full access"
  on public.business_expenses for all
  using (public.is_coach())
  with check (public.is_coach());

create table if not exists public.business_credentials (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  renewal_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.business_credentials enable row level security;

create policy "business_credentials: coach full access"
  on public.business_credentials for all
  using (public.is_coach())
  with check (public.is_coach());
