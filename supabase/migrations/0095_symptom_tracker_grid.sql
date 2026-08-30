-- Reshapes the symptom log to match the habit tracker's UX: a named list
-- of things to track (like client_habits), each with a day-by-day grid
-- cell you tap through teal -> gold -> pink -> clear (like
-- client_habit_logs), instead of one-off free-text journal entries.
-- Each day cell can still carry an optional note and its own
-- shared-with-coach flag, same private-by-default model as before.
--
-- The old client_symptom_logs table is left in place untouched as a
-- historical record and is backfilled into the new tables below so no
-- existing entries are lost; nothing in the app writes to it anymore
-- after this migration.

create table if not exists public.client_symptoms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_symptom_day_logs (
  id uuid primary key default gen_random_uuid(),
  symptom_id uuid not null references public.client_symptoms (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  log_date date not null,
  level smallint not null default 1 check (level between 1 and 3),
  note text,
  shared_with_coach boolean not null default false,
  created_at timestamptz not null default now(),
  unique (symptom_id, log_date)
);

alter table public.client_symptoms enable row level security;
alter table public.client_symptom_day_logs enable row level security;

create policy "client_symptoms: client manages own"
  on public.client_symptoms for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_symptoms.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_symptoms.client_id and c.user_id = auth.uid()
    )
  );

-- Coach only ever learns a tracked symptom's name once at least one of its
-- days has been shared -- same private-unless-shared model the old table
-- had, just applied to the definition row instead of a flat entry.
create policy "client_symptoms: coach reads shared"
  on public.client_symptoms for select
  using (
    public.is_coach()
    and exists (
      select 1 from public.client_symptom_day_logs l
      where l.symptom_id = client_symptoms.id and l.shared_with_coach = true
    )
  );

create policy "client_symptom_day_logs: client manages own"
  on public.client_symptom_day_logs for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_symptom_day_logs.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_symptom_day_logs.client_id and c.user_id = auth.uid()
    )
  );

create policy "client_symptom_day_logs: coach reads shared"
  on public.client_symptom_day_logs for select
  using (public.is_coach() and shared_with_coach = true);

-- One-time backfill: fold each client's distinct free-text symptom names
-- into a tracked item, then map each old entry onto that item's day-log
-- row (collapsing the old 1-5 severity scale onto the grid's 3 levels).
-- Guarded so it only ever runs once, even if this file is re-applied.
do $$
begin
  if not exists (select 1 from public.client_symptoms limit 1) then
    insert into public.client_symptoms (client_id, name, created_at)
    select client_id, symptom, min(created_at)
    from public.client_symptom_logs
    group by client_id, symptom;

    insert into public.client_symptom_day_logs
      (symptom_id, client_id, log_date, level, note, shared_with_coach, created_at)
    select
      s.id,
      o.client_id,
      o.log_date,
      case
        when o.severity is null then 1
        when o.severity <= 2 then 1
        when o.severity = 3 then 2
        else 3
      end,
      o.notes,
      o.shared_with_coach,
      o.created_at
    from public.client_symptom_logs o
    join public.client_symptoms s
      on s.client_id = o.client_id and s.name = o.symptom
    on conflict (symptom_id, log_date) do nothing;
  end if;
end $$;
