-- Coach-only notes on a logged workout/activity -- for planning the next
-- session, not for the client to see. Postgres RLS is row-level, not
-- column-level: the client's existing "reads own" policy on both tables
-- still applies to the whole row, so privacy here depends on every
-- client-facing query explicitly listing columns and never selecting
-- coach_notes (done in this same change) -- not on RLS alone.
alter table public.sessions
  add column if not exists coach_notes text;

alter table public.activities
  add column if not exists coach_notes text;
