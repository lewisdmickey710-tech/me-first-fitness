-- Coach-only business finance settings -- kept as its own table rather
-- than added to business_settings, since that table's RLS lets any
-- signed-in client read it (it holds the public Cash App/Zelle payment
-- info shown to them). A tax set-aside rate has no business being
-- client-readable.
create table if not exists public.business_finance_settings (
  id boolean primary key default true check (id),
  estimated_tax_rate numeric(5,2),
  updated_at timestamptz not null default now()
);

insert into public.business_finance_settings (id) values (true)
on conflict (id) do nothing;

alter table public.business_finance_settings enable row level security;

create policy "business_finance_settings: coach full access"
  on public.business_finance_settings for all
  using (public.is_coach())
  with check (public.is_coach());
