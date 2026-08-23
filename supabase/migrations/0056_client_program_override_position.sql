-- Per-client reordering of a prescribed day's exercises, same pattern as
-- the existing swap/sets-reps/removed overrides: only affects this
-- client, never the shared care-profile template.
alter table public.client_program_overrides
  add column if not exists position_override integer;
