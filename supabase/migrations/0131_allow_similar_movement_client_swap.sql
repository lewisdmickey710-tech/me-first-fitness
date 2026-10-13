-- Lets a client self-swap a prescribed movement for any exercise sharing
-- its movement_pattern (e.g. a prescribed reverse lunge -> Bulgarian
-- split squat), not just its designated regress_to/progress_to target --
-- same restriction shape as before (still can't touch tempo, removal,
-- reordering, or edited_by), just a wider set of allowed substitutes.
create or replace function public.client_program_overrides_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_regress uuid;
  allowed_progress uuid;
  allowed_pattern text;
  substitute_pattern text;
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
      select e.regress_to_id, e.progress_to_id, e.movement_pattern
        into allowed_regress, allowed_progress, allowed_pattern
      from public.program_day_exercises pde
      join public.exercises e on e.id = pde.exercise_id
      where pde.id = new.program_day_exercise_id;

      if new.substitute_exercise_id is distinct from allowed_regress
        and new.substitute_exercise_id is distinct from allowed_progress
      then
        select movement_pattern into substitute_pattern
        from public.exercises
        where id = new.substitute_exercise_id;

        if allowed_pattern is null
          or substitute_pattern is distinct from allowed_pattern
        then
          raise exception 'Substitute must be the prescribed progression, regression, or a similar movement for this exercise.';
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;
