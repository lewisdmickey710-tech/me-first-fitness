-- days_per_week was capped at 3, but real clients (Cindy) train 4 days/week.
-- Widen to 1-6 rather than special-case one more value later.
alter table public.clients drop constraint if exists clients_days_per_week_check;
alter table public.clients
  add constraint clients_days_per_week_check check (days_per_week between 1 and 6);
