-- "Unilateral" alone doesn't say which limb -- widen it to say exactly
-- what the reps spot should read: per arm, per leg, or per side (for
-- rotational/anti-rotational core work that isn't specifically arm- or
-- leg-led, e.g. side plank, bird dog). Lets the app append that to a
-- prescribed rep count automatically instead of a coach retyping it
-- into every phase of every program that uses the movement.
-- Drop the old constraint before reclassifying rows -- 'unilateral' isn't
-- a value the new constraint (below) will allow, so if a check constraint
-- is in place while the UPDATE runs, Postgres validates every existing
-- row against it immediately and the whole migration fails before the
-- data's even been touched.
alter table public.exercises
  drop constraint if exists exercises_laterality_check;

-- Best-effort reclassification of every already-unilateral exercise --
-- name keywords first (most reliable signal, e.g. "Single Arm", "Split
-- Squat"), primary muscle group as a fallback, 'per_side' as the
-- catch-all for rotational core work that isn't clearly arm- or
-- leg-led. This is a starting point, not guaranteed right for all ~300
-- rows it touches -- spot-check the Library page and fix any that
-- landed wrong (each is still just a normal edit).
update public.exercises
set laterality = case
  when name ~* '(single[- ]?arm|one[- ]?arm|alternating.*(row|press|curl|pull|swing|push|carry|thruster|pullover))'
    then 'per_arm'
  when name ~* '(single[- ]?leg|split squat|lunge|step[- ]?up|step[- ]?down|pistol|cossack|copenhagen|clamshell|hip (abduction|extension|thrust)|calf raise|glute bridge|skater squat)'
    then 'per_leg'
  when primary_muscle_group in ('Shoulders', 'Biceps', 'Triceps', 'Chest', 'Back')
    then 'per_arm'
  when primary_muscle_group in ('Glutes', 'Hamstrings', 'Quads', 'Calves', 'Adductors', 'Abductors')
    then 'per_leg'
  else 'per_side'
end
where laterality = 'unilateral';

-- Now that no row can still be 'unilateral', the new constraint validates
-- cleanly against the reclassified data.
alter table public.exercises
  add constraint exercises_laterality_check
    check (laterality in ('bilateral', 'per_arm', 'per_leg', 'per_side'));
