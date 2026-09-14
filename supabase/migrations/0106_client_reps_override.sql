-- Clients can already adjust their prescribed sets themselves (0101); now
-- extend that to reps too, the same way. Tempo stays coach-controlled --
-- narrow the guard trigger (most recently redefined in 0101) to block only
-- tempo_override for non-coach edits. Everything else here is carried over
-- unchanged from 0101's version of this function.
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
    if new.tempo_override is not null then
      raise exception 'Not permitted to change tempo -- only sets, reps, and the movement can be adjusted.';
    end if;
    if new.removed is distinct from false then
      raise exception 'Not permitted to remove a prescribed movement.';
    end if;
    if new.position_override is not null then
      raise exception 'Not permitted to reorder movements.';
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
