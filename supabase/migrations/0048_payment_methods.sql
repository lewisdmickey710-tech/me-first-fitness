-- Where/how clients actually pay Mickey (Cash, Cash App, Zelle) -- shown
-- to clients wherever a payment is due or a late fee needs settling,
-- instead of just "reach out to Mickey" with no concrete way to do it.
-- Singleton row (id is always true) since this is a single-coach business.
create table if not exists public.business_settings (
  id boolean primary key default true check (id),
  cash_app_cashtag text,
  zelle_info text,
  cash_note text,
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true)
on conflict (id) do nothing;

alter table public.business_settings enable row level security;

create policy "business_settings: coach full access"
  on public.business_settings for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "business_settings: any signed-in user reads"
  on public.business_settings for select
  using (auth.uid() is not null);
