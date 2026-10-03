-- Clients want to describe a day in words without being forced to also
-- pick a teal/gold/pink severity level first -- level becomes optional
-- (null = "note only, no severity marked"). The day-log row itself was
-- already built to carry a note independent of its level (see 0095); this
-- just lets that row exist with a note and no level at all.
alter table public.client_symptom_day_logs
  alter column level drop not null,
  alter column level drop default;

alter table public.client_symptom_day_logs
  drop constraint if exists client_symptom_day_logs_level_check;
alter table public.client_symptom_day_logs
  add constraint client_symptom_day_logs_level_check
    check (level is null or level between 1 and 3);
