-- A freestyle session the coach names becomes a repeatable workout the
-- client can pull back up and log again on their own. Only freestyle
-- sessions ever get a name; program/conversation/recovery/etc. sessions
-- already have their own repeat path (the program itself) and leave this
-- null.
alter table public.sessions
  add column workout_name text;
