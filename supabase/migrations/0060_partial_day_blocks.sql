-- Blocking a whole day off was the only option so far -- this lets a
-- specific window within a day (e.g. 2:00-3:30pm for a dentist
-- appointment) be blocked instead, without touching the rest of that
-- day's availability. A date can still have at most one whole-day block
-- (start/end both null), but now any number of partial time-range blocks.

alter table public.coach_blocked_dates
  drop constraint if exists coach_blocked_dates_blocked_date_key;

alter table public.coach_blocked_dates
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.coach_blocked_dates
  drop constraint if exists coach_blocked_dates_time_range_check;
alter table public.coach_blocked_dates
  add constraint coach_blocked_dates_time_range_check
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  );

create unique index if not exists coach_blocked_dates_whole_day_unique
  on public.coach_blocked_dates (blocked_date)
  where start_time is null;
