-- Coach-controlled availability: a weekly set of working windows plus
-- one-off blocked dates, so a client can no longer request a time Mickey
-- never offered or a day she's already blocked off. Blocking a day also
-- auto-cancels whichever clients had a session that day (coach-initiated,
-- free reschedule, no fee, immediate email) rather than just flagging it
-- for her to handle by hand.
--
-- session_occurrences.cancelled_by distinguishes "the client cancelled"
-- from "the coach cancelled" so both the coach's and the client's own
-- history views can show which one actually happened, instead of an
-- undifferentiated "Cancelled" either way.

create table if not exists public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now()
);

alter table public.coach_availability enable row level security;

create policy "coach_availability: coach full access"
  on public.coach_availability for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "coach_availability: any signed-in user reads"
  on public.coach_availability for select
  using (auth.uid() is not null);

create table if not exists public.coach_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.coach_blocked_dates enable row level security;

create policy "coach_blocked_dates: coach full access"
  on public.coach_blocked_dates for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "coach_blocked_dates: any signed-in user reads"
  on public.coach_blocked_dates for select
  using (auth.uid() is not null);

alter table public.session_occurrences
  add column if not exists cancelled_by text
    check (cancelled_by in ('coach', 'client'));

-- A client may still only ever set cancelled_by to 'client' on their own
-- row (or leave it null, e.g. when logging a completed workout) -- never
-- 'coach', which is reserved for the coach-cancel and block-day paths.
drop policy if exists "session_occurrences: client logs own (insert)" on public.session_occurrences;
create policy "session_occurrences: client logs own (insert)"
  on public.session_occurrences for insert
  with check (
    status in ('cancelled', 'late_cancelled', 'completed')
    and (cancelled_by is null or cancelled_by = 'client')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "session_occurrences: client logs own (update)" on public.session_occurrences;
create policy "session_occurrences: client logs own (update)"
  on public.session_occurrences for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    status in ('cancelled', 'late_cancelled', 'completed')
    and (cancelled_by is null or cancelled_by = 'client')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

create or replace function public.session_occurrences_guard_client_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_coach() then
    if old is not null and old.status = 'completed' then
      raise exception 'Not permitted to change a completed session.';
    end if;
    if new.cancelled_by is distinct from null and new.cancelled_by is distinct from 'client' then
      raise exception 'Not permitted to set cancelled_by.';
    end if;
  end if;
  return new;
end;
$$;
