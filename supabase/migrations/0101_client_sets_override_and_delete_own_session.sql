-- A client asked to be able to adjust the prescribed sets count herself
-- (reps and tempo stay coach-controlled). The guard trigger (most recently
-- redefined in 0058) previously blocked sets_override along with
-- reps_override/tempo_override for non-coach edits -- narrow that to just
-- reps_override/tempo_override. Everything else here is carried over
-- unchanged from 0058's version of this function.
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
    if new.reps_override is not null or new.tempo_override is not null then
      raise exception 'Not permitted to change reps/tempo -- only sets and the movement can be adjusted.';
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

-- A client logging her own workout had no way to remove an accidental
-- duplicate -- only the coach could delete a logged session. Scoped to
-- client-logged sessions only, so a real coached session she didn't log
-- herself can never be touched this way.
create policy "sessions: client deletes own logged"
  on public.sessions for delete
  using (
    logged_by = 'client'
    and exists (
      select 1 from public.clients c
      where c.id = sessions.client_id and c.user_id = auth.uid()
    )
  );
