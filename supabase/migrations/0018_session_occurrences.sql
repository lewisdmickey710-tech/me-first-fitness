-- Attendance tracking: completed / rescheduled / cancelled / late-cancelled,
-- per scheduled occurrence date. One row per (client, date). A logged
-- session (public.sessions) upserts a 'completed' row here automatically;
-- the coach marks the other 3 statuses manually from the client's
-- Attendance tab. "Late cancel" means cancelled with less than 12 hours'
-- notice before the scheduled time.

create table if not exists public.session_occurrences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  client_schedule_id uuid references public.client_schedules (id) on delete set null,
  occurrence_date date not null,
  status text not null check (status in ('completed', 'rescheduled', 'cancelled', 'late_cancelled')),
  rescheduled_to_date date,
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, occurrence_date)
);

alter table public.session_occurrences enable row level security;

create policy "session_occurrences: coach full access"
  on public.session_occurrences for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "session_occurrences: client reads own"
  on public.session_occurrences for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

-- Dedupe marker for the inactivity-nudge cron: last time this client was
-- emailed for having no self-logged check-in/activity in a while, so the
-- daily cron never re-sends within the same cooldown window.
alter table public.clients
  add column if not exists last_inactivity_nudge_sent_at timestamptz;
