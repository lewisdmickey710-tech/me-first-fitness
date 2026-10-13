-- Lets a logged activity (a class, most often) carry the same
-- exercise/sets/reps shape sessions already do, so a class that was
-- actually structured has enough content to become a program day --
-- see setProgramDayFromActivity. Optional: most activities (a walk, a
-- solo mobility session) stay an empty array, same as today.
alter table public.activities
  add column entries jsonb not null default '[]'::jsonb;
