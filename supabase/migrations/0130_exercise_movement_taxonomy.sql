-- Groups exercises that are variations of the same movement (a reverse
-- lunge, a glute-dominant step-up, and a Bulgarian split squat are all
-- "lunge") independent of primary_muscle_group/movement_type and
-- independent of the regress_to/progress_to difficulty chain -- lets the
-- library be searched/filtered by movement family, and lets a same-family
-- exercise be offered as a swap suggestion. See 0131 for the matching
-- relaxation of client_program_overrides_guard.
alter table public.exercises
  add column if not exists movement_pattern text
    check (movement_pattern in (
      'squat', 'hinge', 'lunge', 'push', 'pull', 'rotation', 'gait',
      'carry', 'core', 'mobility', 'other'
    )),
  add column if not exists plane_of_motion text
    check (plane_of_motion in (
      'sagittal', 'frontal', 'transverse', 'multi_planar'
    ));
