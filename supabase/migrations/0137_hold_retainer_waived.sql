-- Lets a hold be permanent and free -- a client the coach wants to keep
-- access/spot-reserved for indefinitely without ever billing the usual
-- $10/week retainer once the free period runs out. Doesn't change what a
-- hold IS (still just hold_started_at set, still ended the same way) --
-- just tells the retainer-billing cron to skip creating payments for this
-- client while it's true. Resets to false whenever the hold ends, so a
-- later, unrelated hold doesn't inherit an old waiver by accident.
alter table public.clients
  add column if not exists hold_retainer_waived boolean not null default false;

-- Both billing-adjacent and coach-only, same as hold_started_at itself --
-- a client could otherwise flip their own retainer waiver (or, pre-existing
-- gap this also closes, their own monthly_checkin billing arrangement)
-- through the broad "client updates own row" policy, since that policy
-- only restricts by row ownership, not by column.
create or replace function public.clients_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if new.user_id is distinct from old.user_id
      or new.care_profile_id is distinct from old.care_profile_id
      or new.days_per_week is distinct from old.days_per_week
      or new.session_mode is distinct from old.session_mode
      or new.sessions_allotted is distinct from old.sessions_allotted
      or new.notes is distinct from old.notes
      or new.track is distinct from old.track
      or new.phase is distinct from old.phase
      or new.start_date is distinct from old.start_date
      or new.primary_goal is distinct from old.primary_goal
      or new.secondary_goal is distinct from old.secondary_goal
      or new.key_health_notes is distinct from old.key_health_notes
      or new.hold_started_at is distinct from old.hold_started_at
      or new.program_last_updated_at is distinct from old.program_last_updated_at
      or new.hold_retainer_waived is distinct from old.hold_retainer_waived
      or new.monthly_checkin is distinct from old.monthly_checkin
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;
