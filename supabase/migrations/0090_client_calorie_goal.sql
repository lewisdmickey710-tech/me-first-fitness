-- A daily calorie target the coach sets for a client, shown to the client
-- only once she's explicitly turned it on for them -- defaults off and
-- stays off unless she opts a specific client in. Calorie tracking/goals
-- can be actively harmful for a client with (or at risk of) disordered
-- eating, so this is never something a client can enable for themselves
-- or that shows up by default; it's a deliberate per-client coach
-- decision, same pattern as symptom_tracker_enabled.
alter table public.clients
  add column if not exists calorie_goal_enabled boolean not null default false,
  add column if not exists daily_calorie_goal integer;
