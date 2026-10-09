-- Per-client 4-week goals, set during a check-in: how many in-person
-- sessions and solo workouts a week feed the dashboard's movement ring,
-- and how many meals a day feeds the nutrition ring (replacing a flat
-- 3-a-day constant for everyone). All nullable -- unset falls back to a
-- sensible default computed where each is used (in-person: count of the
-- client's own active weekly schedule slots; solo: 0; nutrition: 3).
alter table public.clients
  add column if not exists weekly_inperson_goal integer,
  add column if not exists weekly_solo_goal integer,
  add column if not exists nutrition_goal integer;

alter table public.clients
  add constraint clients_weekly_inperson_goal_check
    check (weekly_inperson_goal is null or weekly_inperson_goal >= 0),
  add constraint clients_weekly_solo_goal_check
    check (weekly_solo_goal is null or weekly_solo_goal >= 0),
  add constraint clients_nutrition_goal_check
    check (nutrition_goal is null or nutrition_goal >= 0);
