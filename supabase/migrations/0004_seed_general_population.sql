-- Seed the real, verified Track A (Phases 1-2) content into the new
-- Exercise Library + Program Builder, under the "General Population" care
-- profile, so it's reviewable/editable in the app instead of living in a
-- hardcoded file. Source: mff_exercise_library.py (the plain-text,
-- non-truncated version). Phases 3-4 aren't seeded — that content was never
-- built as a generic template, per that same source.
--
-- Only "Hip Thrust (barbell)" gets a full client description + coach cues
-- here, as the worked example from our depth pass — everything else is
-- seeded with just a name, ready for you to fill in via the Library screen.

alter table public.exercises add constraint exercises_name_key unique (name);

insert into public.exercises (name, client_description, coach_cues) values
  ('Hip Thrust (barbell)',
   'Sit on the ground with your upper back against a bench, knees bent, feet flat about hip-width apart. Roll the bar (padded) over your hip crease, or hold a dumbbell there instead. Plant your feet, brace your core like someone''s about to poke your stomach, and drive through your heels until your hips come all the way up — your body should form a straight line from your shoulders to your knees at the top. Squeeze your glutes hard for a full second up there, then lower back down with control instead of dropping. Keep your chin slightly tucked and your ribs stacked over your hips the whole rep — if your lower back starts arching to get you the rest of the way up, that''s not more range, that''s your back taking over for your glutes.',
   'Foot placement: shins should land roughly vertical at lockout — too far forward and the quads take over, too far back strains the ankles. Adjust per client''s limb length, not a fixed distance.
Most common compensation: lumbar hyperextension at the top (ribs flare up, low back arches) when the glutes are the weak link. Cue immediately: "ribs to hips," short exhale on the squeeze.
Second most common: losing control on the way down — hips sag before the next rep starts instead of a controlled lower. Cue: "own the way down, don''t drop it."
Pad/bar sits on the hip crease, not the stomach — reposition right away if she winces or shifts mid-set.
Foot width: hip-width to slightly wider is the default; widen further for anyone with hip mobility restrictions.
Progression trigger: two clean sessions in a row (full lockout, no lumbar compensation) before adding load — not just "felt easy."'),
  ('Single-Leg Glute Bridge', null, null),
  ('Goblet Squat (Bosu Ball)', null, null),
  ('Single-Leg RDL', null, null),
  ('Lateral Band Walk', null, null),
  ('Single-Leg Calf Raise', null, null),
  ('Ab/Core: Bird Dog + Glute Bridge March', null, null),
  ('Push-Up w/ Leg Lift (or Light DB Bench Press)', null, null),
  ('Single-Leg DB Shoulder Press', null, null),
  ('Single-Leg Band Tricep Pushdown', null, null),
  ('Single-Leg DB Chest Fly (standing)', null, null),
  ('Single-Leg Lateral Raise', null, null),
  ('Ab/Core: Dead Bug + Leg Raise', null, null),
  ('Single-Leg Band Row', null, null),
  ('Band Lat Pulldown / Assisted Pull-Up', null, null),
  ('Single-Leg DB Bicep Curl', null, null),
  ('Single-Leg Face Pull', null, null),
  ('Single-Leg Hip Thrust', null, null),
  ('Ab/Core: 90/90 Breathing + Bird Dog', null, null),
  ('Sumo Squat', null, null),
  ('Bosu Ball Squat', null, null),
  ('DB/Barbell Bench Press', null, null),
  ('DB Ball Chest Press', null, null),
  ('Sumo RDL', null, null),
  ('Barbell/DB Row', null, null),
  ('Single-Leg Bent-Over Row', null, null),
  ('Deadlift (conv./trap bar)', null, null),
  ('Glute Bridge (loaded)', null, null),
  ('Incline DB Press', null, null),
  ('Bulgarian Split Squat', null, null),
  ('Lateral Lunge', null, null),
  ('Face Pull', null, null),
  ('Push-Up (feet elevated)', null, null),
  ('Hip Thrust (heavy)', null, null),
  ('Standing Glute Kickback', null, null),
  ('Front/Goblet Squat (heavier)', null, null),
  ('Step-Up (loaded)', null, null),
  ('Pull-Up / Lat Pulldown', null, null),
  ('Romanian Deadlift', null, null),
  ('Curtsy Lunge', null, null),
  ('Chest Press (DB/Machine)', null, null),
  ('Hip Abduction (band/cable)', null, null),
  ('Suitcase Carry', null, null)
on conflict (name) do nothing;

-- ---- Phase 1, Day 1: Legs & Glutes ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Legs & Glutes' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'Single-Leg Glute Bridge', '2', '15'),
  (1, 'Goblet Squat (Bosu Ball)', '2', '15'),
  (2, 'Single-Leg RDL', '2', '15'),
  (3, 'Lateral Band Walk', '2', '15'),
  (4, 'Single-Leg Calf Raise', '2', '12'),
  (5, 'Ab/Core: Bird Dog + Glute Bridge March', '2', '12')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 2: Push ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Push' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'Push-Up w/ Leg Lift (or Light DB Bench Press)', '2', '12'),
  (1, 'Single-Leg DB Shoulder Press', '2', '12'),
  (2, 'Single-Leg Band Tricep Pushdown', '2', '12'),
  (3, 'Single-Leg DB Chest Fly (standing)', '2', '12'),
  (4, 'Single-Leg Lateral Raise', '2', '12'),
  (5, 'Ab/Core: Dead Bug + Leg Raise', '2', '12')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 3: Pull ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Pull' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'Single-Leg Band Row', '2', '12'),
  (1, 'Band Lat Pulldown / Assisted Pull-Up', '2', '12'),
  (2, 'Single-Leg DB Bicep Curl', '2', '12'),
  (3, 'Single-Leg Face Pull', '2', '12'),
  (4, 'Single-Leg Hip Thrust', '2', '15'),
  (5, 'Ab/Core: 90/90 Breathing + Bird Dog', '2', '10')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 1: Legs & Glutes (superset) ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Legs & Glutes' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, v.sets, v.reps, v.grp
from d, (values
  (0, 'Sumo Squat', '3', '10', '1A'),
  (1, 'Bosu Ball Squat', '3', '15', '1B'),
  (2, 'DB/Barbell Bench Press', '3', '10', '2A'),
  (3, 'DB Ball Chest Press', '3', '15', '2B'),
  (4, 'Sumo RDL', '3', '10', '3A'),
  (5, 'Single-Leg RDL', '3', '15', '3B'),
  (6, 'Barbell/DB Row', '3', '10', '4A'),
  (7, 'Single-Leg Bent-Over Row', '3', '15', '4B'),
  (8, 'Hip Thrust (barbell)', '3', '10', '5A'),
  (9, 'Single-Leg Hip Thrust', '3', '15', '5B')
) as v(position, name, sets, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 2: Push (superset) ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Push' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, v.sets, v.reps, v.grp
from d, (values
  (0, 'Deadlift (conv./trap bar)', '3', '8', '1A'),
  (1, 'Glute Bridge (loaded)', '3', '15', '1B'),
  (2, 'Incline DB Press', '3', '8', '2A'),
  (3, 'Single-Leg Glute Bridge', '3', '12', '2B'),
  (4, 'Bulgarian Split Squat', '3', '10', '3A'),
  (5, 'Lateral Lunge', '3', '12', '3B'),
  (6, 'Face Pull', '3', '10', '4A'),
  (7, 'Push-Up (feet elevated)', '3', '12', '4B'),
  (8, 'Hip Thrust (heavy)', '3', '8', '5A'),
  (9, 'Standing Glute Kickback', '3', '15', '5B')
) as v(position, name, sets, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 3: Pull (superset, 2 pairs intentionally solo — no
-- verified B-side existed in the source) ----
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Pull' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, v.sets, v.reps, v.grp
from d, (values
  (0, 'Front/Goblet Squat (heavier)', '3', '8', '1A'),
  (1, 'Step-Up (loaded)', '3', '12', '1B'),
  (2, 'Pull-Up / Lat Pulldown', '3', '8', null),
  (3, 'Romanian Deadlift', '3', '10', '3A'),
  (4, 'Curtsy Lunge', '3', '12', '3B'),
  (5, 'Chest Press (DB/Machine)', '3', '8', null),
  (6, 'Hip Abduction (band/cable)', '3', '12', '5A'),
  (7, 'Suitcase Carry', '3', '15', '5B')
) as v(position, name, sets, reps, grp)
join public.exercises e on e.name = v.name;
