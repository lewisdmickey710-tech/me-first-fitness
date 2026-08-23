-- The protected-field guard triggers (clients, leads, session_occurrences,
-- client_program_overrides) all check `is_coach()`, which checks
-- `auth.uid()`. That's correct for the app -- every real write goes through
-- either the coach's authenticated session (auth.uid() = the coach) or a
-- client's own session (auth.uid() = that client, RLS already scopes them
-- to their own row) -- but it has no concept of "no authenticated user at
-- all", which is exactly the context the Supabase SQL Editor and the
-- service-role key run under. That blocked migration 0037's direct
-- `update public.clients` with "Not permitted to change this field."
--
-- Fix: only enforce the guard when there IS an authenticated non-coach
-- user. A null auth.uid() means either the SQL Editor or the service role,
-- both already privileged/RLS-bypassing contexts, so there's nothing to
-- protect against there -- an unauthenticated request could never have
-- passed the underlying RLS policy in the first place.
create or replace function public.clients_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_coach() then
    if new.user_id is distinct from old.user_id
      or new.care_profile_id is distinct from old.care_profile_id
      or new.days_per_week is distinct from old.days_per_week
      or new.session_mode is distinct from old.session_mode
      or new.sessions_allotted is distinct from old.sessions_allotted
      or new.notes is distinct from old.notes
      or new.track is distinct from old.track
      or new.phase is distinct from old.phase
      or new.payment_schedule is distinct from old.payment_schedule
      or new.start_date is distinct from old.start_date
      or new.primary_goal is distinct from old.primary_goal
      or new.secondary_goal is distinct from old.secondary_goal
      or new.key_health_notes is distinct from old.key_health_notes
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.leads_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_coach() then
    if new.status is distinct from old.status
      or new.converted_client_id is distinct from old.converted_client_id
      or new.user_id is distinct from old.user_id
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.session_occurrences_guard_client_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_coach() then
    if old is not null and old.status = 'completed' then
      raise exception 'Not permitted to change a completed session.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.client_program_overrides_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_regress uuid;
  allowed_progress uuid;
begin
  if auth.uid() is not null and not public.is_coach() then
    if new.edited_by is distinct from 'client' then
      raise exception 'Not permitted to set edited_by.';
    end if;
    if new.sets_override is not null or new.reps_override is not null then
      raise exception 'Not permitted to change sets/reps -- only the movement can be swapped.';
    end if;
    if new.substitute_exercise_id is not null then
      select e.regress_to_id, e.progress_to_id
        into allowed_regress, allowed_progress
      from public.program_day_exercises pde
      join public.exercises e on e.id = pde.exercise_id
      where pde.id = new.program_day_exercise_id;

      if new.substitute_exercise_id is distinct from allowed_regress
        and new.substitute_exercise_id is distinct from allowed_progress
      then
        raise exception 'Substitute must be the prescribed progression or regression for this movement.';
      end if;
    end if;
  end if;
  return new;
end;
$$;
