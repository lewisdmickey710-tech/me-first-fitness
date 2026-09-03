-- A client's preferred display language for their side of the app.
-- Self-selected from their own Profile page (same pattern as timezone).
-- English stays the default for everyone until they change it.
alter table public.clients
  add column if not exists language text not null default 'en'
    check (language in ('en', 'es'));
