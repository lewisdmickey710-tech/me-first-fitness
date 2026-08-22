-- Recurring session scheduling + manual payment tracking, plus a dedupe
-- log so the reminder cron never double-sends for the same occurrence.

-- ============================================================
-- client_schedules
-- The coach sets a client's regular weekly session time(s) here
-- (e.g. "Tuesdays at 5:00 PM"). No client-facing booking UI --
-- this just records the recurring pattern the app reminds about.
-- ============================================================
create table if not exists public.client_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  time_of_day time not null,
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.client_schedules enable row level security;

create policy "client_schedules: coach full access"
  on public.client_schedules for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_schedules: client reads own"
  on public.client_schedules for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_schedules.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- payments
-- Manual payment tracking -- the coach records what's owed and
-- marks it paid when actually collected (cash, Venmo, etc). No
-- online payment collection.
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  description text not null,
  amount numeric not null,
  due_date date not null,
  paid_on date,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments: coach full access"
  on public.payments for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "payments: client reads own"
  on public.payments for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = payments.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- session_reminders_log
-- Dedupe log for the reminder cron: one row per (schedule, date)
-- it has already emailed about, so a re-run within the same day
-- never sends twice. Internal bookkeeping only -- coach-only, and
-- in practice only ever touched by the cron job's service-role
-- client, which bypasses RLS anyway.
-- ============================================================
create table if not exists public.session_reminders_log (
  id uuid primary key default gen_random_uuid(),
  client_schedule_id uuid not null references public.client_schedules (id) on delete cascade,
  occurrence_date date not null,
  sent_at timestamptz not null default now(),
  unique (client_schedule_id, occurrence_date)
);

alter table public.session_reminders_log enable row level security;

create policy "session_reminders_log: coach full access"
  on public.session_reminders_log for all
  using (public.is_coach())
  with check (public.is_coach());
