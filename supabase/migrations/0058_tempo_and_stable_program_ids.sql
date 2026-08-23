-- Prescribed tempo, same pattern as sets/reps: a template value on
-- program_day_exercises, overridable per client on client_program_overrides.
alter table public.program_day_exercises
  add column if not exists tempo text;

-- Existing data can have duplicate (day, position) pairs from the old
-- delete-and-reinsert save behavior -- renumber each day's rows to a
-- clean, gap-free sequence (same relative order, ties broken by id) so
-- the unique constraint below can actually be added.
with ranked as (
  select id, row_number() over (partition by program_day_id order by position, id) - 1 as new_position
  from public.program_day_exercises
)
update public.program_day_exercises pde
set position = ranked.new_position
from ranked
where pde.id = ranked.id and pde.position is distinct from ranked.new_position;

-- saveProgramDay used to delete every row for a day and reinsert fresh
-- ones on every save, which regenerated their ids -- silently orphaning
-- (cascade-deleting) any client_program_overrides pointed at the old ids
-- the next time the coach so much as fixed a typo in the shared template.
-- This constraint lets the action upsert by (day, slot) instead, so a
-- slot's identity -- and any per-client override on it -- survives
-- routine template edits.
alter table public.program_day_exercises
  add constraint program_day_exercises_day_position_unique
    unique (program_day_id, position);

alter table public.client_program_overrides
  add column if not exists tempo_override text;

-- Coach-only, same defense in depth as the other override fields.
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
    if new.sets_override is not null or new.reps_override is not null or new.tempo_override is not null then
      raise exception 'Not permitted to change sets/reps/tempo -- only the movement can be swapped.';
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
