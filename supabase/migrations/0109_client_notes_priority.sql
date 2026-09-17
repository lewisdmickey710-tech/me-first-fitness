-- Lets a note be flagged as a high-priority touch point (an injury flare,
-- something going on in their life, anything worth seeing again before the
-- next session) so it stands out from the rest of the running notes log
-- instead of scrolling off. Used by the quick wellness check-in on the
-- Log Session form, and available on the plain "Add a note" form too.
alter table public.client_notes
  add column if not exists priority boolean not null default false;
