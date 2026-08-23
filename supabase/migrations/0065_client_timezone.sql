-- Supports virtual clients outside the business timezone (Central). All
-- storage stays anchored to business-tz wall-clock time exactly as
-- before (session times, requests, availability) -- this only records
-- each client's own timezone so the app can convert for display to them
-- and for interpreting a time they type in. Defaults to the business
-- timezone, so every existing (in-person) client is unaffected.
alter table public.clients
  add column if not exists timezone text not null default 'America/Chicago';
