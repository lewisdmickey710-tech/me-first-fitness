-- Adds "nutritionist" as a loggable session type alongside program /
-- freestyle / conversation / recovery / assessment (see 0036), for a
-- nutrition-focused session -- behaves like Conversation in the log form
-- (no exercise grid, no star rating), just its own notes prompt.
alter table public.sessions
  drop constraint if exists sessions_session_type_check;
alter table public.sessions
  add constraint sessions_session_type_check
    check (session_type in ('program', 'freestyle', 'conversation', 'recovery', 'assessment', 'nutritionist'));
