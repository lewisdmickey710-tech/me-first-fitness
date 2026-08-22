-- Wires up two things the schema already half-anticipated but nothing used
-- yet: client-initiated exercise swaps (client_program_overrides, added in
-- 0002 with a comment saying exactly this was coming), and letting a
-- client log the actual assigned workout (weight used + notes per
-- exercise) instead of only the free-form, program-disconnected
-- "Log activity" flow.
--
-- Swaps stay narrow: a client can only ever swap a prescribed exercise for
-- its own designated regress_to_id or progress_to_id -- never an arbitrary
-- exercise, and never the sets/reps (only the coach can change those).
-- Enforced by a trigger, not just RLS, so a raw API call can't widen it.
--
-- Logging reuses the existing `sessions` table (entries jsonb) rather than
-- a new table, so a client-logged workout shows up in the coach's existing
-- Sessions/Attendance views the same as a coach-logged one -- just with
-- logged_by = 'client' and richer entries (exercise_id, substitute_exercise_id,
-- notes alongside the existing exercise/sets/reps/weight strings). jsonb
-- needs no schema change for the richer shape.

alter table public.client_program_overrides
  add constraint client_program_overrides_client_slot_unique
    unique (client_id, program_day_exercise_id);

create policy "client_program_overrides: client creates own swap"
  on public.client_program_overrides for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_program_overrides.client_id and c.user_id = auth.uid()
    )
  );

create policy "client_program_overrides: client updates own swap"
  on public.client_program_overrides for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_program_overrides.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_program_overrides.client_id and c.user_id = auth.uid()
    )
  );

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
  if not public.is_coach() then
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

drop trigger if exists client_program_overrides_guard_trigger on public.client_program_overrides;
create trigger client_program_overrides_guard_trigger
  before insert or update on public.client_program_overrides
  for each row execute procedure public.client_program_overrides_guard();

-- sessions previously had no client-write policy at all (coach full access
-- + client read-only) -- a client logging their own workout needs to
-- insert their own rows, tagged logged_by = 'client'.
alter table public.sessions
  add constraint sessions_logged_by_check check (logged_by in ('coach', 'client'));

create policy "sessions: client logs own"
  on public.sessions for insert
  with check (
    logged_by = 'client'
    and exists (
      select 1 from public.clients c
      where c.id = sessions.client_id and c.user_id = auth.uid()
    )
  );

-- Logging a workout should also mark that date's attendance as completed
-- (same as when the coach logs a session), so it feeds the existing
-- consistency%/risk-score calculations. The 0027 client policies only
-- allowed a client to self-mark cancelled/late_cancelled; widen them to
-- include completed. The existing trigger still blocks anyone non-coach
-- from changing a row that's *already* completed, so this only ever lets
-- a client move a not-yet-resolved date to completed, never un-complete one.
drop policy if exists "session_occurrences: client cancels own (insert)" on public.session_occurrences;
create policy "session_occurrences: client logs own (insert)"
  on public.session_occurrences for insert
  with check (
    status in ('cancelled', 'late_cancelled', 'completed')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "session_occurrences: client cancels own (update)" on public.session_occurrences;
create policy "session_occurrences: client logs own (update)"
  on public.session_occurrences for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    status in ('cancelled', 'late_cancelled', 'completed')
    and exists (
      select 1 from public.clients c
      where c.id = session_occurrences.client_id and c.user_id = auth.uid()
    )
  );
