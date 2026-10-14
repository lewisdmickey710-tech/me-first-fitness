-- Lets a client_custom_program_days row link back to the actual library
-- exercise (so the client sees its real name/description/demo, not just
-- whatever free text was typed when it was logged or pulled in from a
-- past session/class) and carry a note the coach wants the client to see
-- on that movement -- e.g. a cue from how they performed it last time.
-- Both nullable: a hand-typed exercise with no library match, or a day
-- with nothing noted, works exactly as before.
alter table public.client_custom_program_days
  add column exercise_id uuid references public.exercises(id) on delete set null,
  add column notes text;
