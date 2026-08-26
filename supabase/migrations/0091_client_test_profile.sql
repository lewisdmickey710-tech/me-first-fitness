-- Lets the coach mark a client profile as a test/demo profile so it can be
-- used to poke around the app without skewing real numbers -- roster and
-- finances aggregates exclude these clients, but the profile still shows
-- up and works normally everywhere else.
alter table public.clients
  add column if not exists is_test boolean not null default false;
