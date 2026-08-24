-- Lets the coach counter-offer a pending time request instead of just
-- accepting or declining it -- dragging a request to a different slot on
-- the schedule grid sets it to 'countered' with the proposed date/time,
-- and the client sees it and either accepts (which then confirms it,
-- same as accepting the original request would have) or declines (so
-- they can send a fresh request instead).
alter table public.requests
  drop constraint if exists requests_status_check;
alter table public.requests
  add constraint requests_status_check
    check (status in ('pending', 'confirmed', 'declined', 'countered'));

alter table public.requests
  add column if not exists countered_date date,
  add column if not exists countered_time time;
