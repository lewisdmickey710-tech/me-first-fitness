-- Lets the Exercise Library be searched/filtered by muscle group,
-- compound vs. accessory, and single-limb (unilateral) vs. two-limb
-- (bilateral) -- on top of free-text name search.
alter table public.exercises
  add column if not exists primary_muscle_group text
    check (primary_muscle_group in (
      'Glutes', 'Hamstrings', 'Quads', 'Calves', 'Adductors', 'Abductors',
      'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core',
      'Full Body', 'Balance/Mobility'
    )),
  add column if not exists movement_type text
    check (movement_type in ('compound', 'accessory', 'mobility')),
  add column if not exists laterality text
    check (laterality in ('bilateral', 'unilateral'));
