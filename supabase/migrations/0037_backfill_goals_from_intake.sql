-- Primary/secondary goal on clients were separate free-text fields the
-- coach filled in by hand -- nothing ever copied a client's own intake
-- answers into them, so they stayed blank even for clients who'd already
-- filled out a full intake. The app now backfills these going forward
-- (on intake submit, and on lead-to-client conversion); this is the
-- one-time catch-up for everyone who already submitted before that fix,
-- touching only rows that are still actually empty.
update public.clients c
set primary_goal = ci.goal_change_description
from public.client_intake ci
where ci.client_id = c.id
  and c.primary_goal is null
  and ci.goal_change_description is not null;

update public.clients c
set secondary_goal = ci.goal_success_3_months
from public.client_intake ci
where ci.client_id = c.id
  and c.secondary_goal is null
  and ci.goal_success_3_months is not null;
