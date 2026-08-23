-- The symptom log is meant to be optional per client (most don't need it,
-- some -- e.g. working with a PT alongside coaching -- do), unlike the
-- habit/nutrition trackers which are open to everyone. Off by default;
-- the coach turns it on per client from their Profile info.
alter table public.clients
  add column if not exists symptom_tracker_enabled boolean not null default false;
