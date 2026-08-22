-- Habit tracker day-boxes were a plain done/not-done checkbox. Some habits
-- are really symptom/intensity trackers (e.g. "knee pain", "energy") where
-- a single yes/no doesn't capture much -- so each day now carries a 1-3
-- level (teal/gold/pink in the UI) instead of just existing or not.
-- Existing rows (all logged before this existed) default to level 1.
alter table public.client_habit_logs
  add column if not exists level smallint not null default 1
    check (level between 1 and 3);
