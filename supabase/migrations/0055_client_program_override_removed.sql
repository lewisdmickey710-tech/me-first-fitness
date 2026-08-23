-- Lets the coach drop a prescribed exercise entirely for one client
-- (e.g. Cindy wants fewer movements on a day) without touching the
-- shared care-profile template everyone else on that track uses.
-- Only the coach may set this -- extends the existing guard trigger
-- (0028) the same way it already restricts sets/reps and swap target
-- to coach-only for the parts a client can't self-edit.
alter table public.client_program_overrides
  add column if not exists removed boolean not null default false;

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
    if new.removed is distinct from false then
      raise exception 'Not permitted to remove a prescribed movement.';
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
