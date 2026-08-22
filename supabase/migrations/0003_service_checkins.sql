-- Service check-ins — client self-serve, prompted alongside the monthly
-- measurement window. Distinct from `checkins` (daily body-state fields):
-- this is a relationship/satisfaction pulse, not a training log.

create table if not exists public.service_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  satisfaction integer check (satisfaction between 1 and 5),
  what_working text,
  what_would_help text,
  anything_else text,
  created_at timestamptz not null default now()
);

alter table public.service_checkins enable row level security;

create policy "service_checkins: coach full access"
  on public.service_checkins for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "service_checkins: client reads own"
  on public.service_checkins for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = service_checkins.client_id and c.user_id = auth.uid()
    )
  );

create policy "service_checkins: client inserts own"
  on public.service_checkins for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = service_checkins.client_id and c.user_id = auth.uid()
    )
  );
