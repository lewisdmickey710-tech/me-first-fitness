-- One-time cleanup: nothing ever stopped the same exercise from being
-- added twice to one program day (no unique constraint, no dedup check in
-- saveProgramDay), so some days accumulated duplicate rows. For each
-- program_day, keep exactly one row per exercise -- preferring whichever
-- duplicate has a client_program_overrides row attached, so a client's
-- personal swap/sets/reps override isn't lost to the cascade delete below
-- -- and otherwise the earliest position -- then remove the rest.
with ranked as (
  select
    pde.id,
    row_number() over (
      partition by pde.program_day_id, pde.exercise_id
      order by (
        exists (
          select 1 from public.client_program_overrides o
          where o.program_day_exercise_id = pde.id
        )
      ) desc, pde.position asc
    ) as rn
  from public.program_day_exercises pde
)
delete from public.program_day_exercises
where id in (select id from ranked where rn > 1);
