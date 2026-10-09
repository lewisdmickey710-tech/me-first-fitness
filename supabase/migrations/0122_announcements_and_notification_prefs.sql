-- One-way push broadcasts the coach sends to clients, plus per-client
-- control over which automated push categories they get. Session
-- reminders and emergency broadcasts are deliberately not covered by any
-- of this -- they're never optional, so there's nothing to store for
-- them.
create table if not exists public.coach_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('announcement', 'emergency')),
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.coach_announcements enable row level security;

create policy "coach_announcements: coach full access"
  on public.coach_announcements for all
  using (public.is_coach())
  with check (public.is_coach());

alter table public.clients
  add column if not exists notify_announcements boolean not null default true,
  add column if not exists notify_streaks boolean not null default true,
  add column if not exists notify_tracking_reminders boolean not null default true,
  -- The longest daily habit-tracking streak length already celebrated,
  -- so the day-before-yesterday's milestone doesn't get re-sent every
  -- single day the streak continues past it. Reset to 0 as soon as a
  -- streak breaks, so hitting the same milestone again on a fresh streak
  -- is celebrated again.
  add column if not exists last_celebrated_streak_length integer not null default 0;
