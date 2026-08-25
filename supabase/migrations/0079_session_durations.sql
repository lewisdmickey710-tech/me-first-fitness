-- Every session was implicitly assumed to be an hour -- the schedule
-- grids only ever shaded a booking's starting 15-minute slot, so a real
-- hour-long session only ever blocked 1 of the 4 squares it actually
-- occupies (and a 30-minute one looked identical to an hour-long one).
-- This adds a real duration everywhere a booking is recorded, defaulting
-- to 60 so nothing changes for the normal case.
--
-- Duration is coach-set only, never a client-facing choice -- a 30-minute
-- slot is a negotiated exception (like Sandra's 2x/week arrangement),
-- not something offered by default.
alter table public.client_schedules
  add column if not exists duration_minutes integer not null default 60
    check (duration_minutes > 0);

alter table public.requests
  add column if not exists duration_minutes integer not null default 60
    check (duration_minutes > 0);

alter table public.session_occurrences
  add column if not exists duration_minutes integer not null default 60
    check (duration_minutes > 0);

-- Sandra's existing 2x/week arrangement is 30 minutes, not the default
-- hour -- update her real recurring rows now so the grid reflects it
-- immediately once this runs, without a manual edit.
update public.client_schedules cs
set duration_minutes = 30
from public.clients c
where cs.client_id = c.id and c.name = 'Sandra';
