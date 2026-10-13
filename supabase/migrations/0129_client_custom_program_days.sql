-- Lets the coach fully swap in a custom exercise list for one client's
-- version of a specific program day (Phase X, Day N) -- e.g. promoting a
-- freestyle workout into "this is now their real Day 2," or making an
-- in-the-moment edit to a program day permanent -- without touching the
-- shared care-profile template everyone else assigned to it still
-- follows. Presence of any row for a (client_id, program_day_id) pair
-- means that day is now fully defined by these rows for this client;
-- their absence means the standard program_day_exercises +
-- client_program_overrides rendering applies as before (see
-- /client/program).
create table public.client_custom_program_days (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  position integer not null default 0,
  exercise_name text not null,
  sets text,
  reps text,
  created_at timestamptz not null default now()
);

create index client_custom_program_days_lookup_idx
  on public.client_custom_program_days (client_id, program_day_id);

alter table public.client_custom_program_days enable row level security;

create policy "client_custom_program_days: coach writes"
  on public.client_custom_program_days for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_custom_program_days: client reads own"
  on public.client_custom_program_days for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_custom_program_days.client_id and c.user_id = auth.uid()
    )
  );
