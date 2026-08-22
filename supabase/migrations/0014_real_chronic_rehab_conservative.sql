-- Replaces the earlier DRAFT content for Chronic Illness Support,
-- Rehab-Forward, and Medically Conservative (from 0009) with real,
-- verified Phase 1-4 content, pulled directly from your actual Coach
-- Planner PDFs (Track F, Track C.3, Track D) in Active Client Material.zip
-- -- not researched or guessed, and no longer draft-only.
--
-- Medically Conservative and Chronic Illness Support share the exact same
-- Phase 1-3 exercise selection in the real source (they're both
-- "extra-care" variants of the same base program) -- they only diverge at
-- Phase 4: Medically Conservative stays fully non-explosive/controlled
-- forever ("2/0/2, fully controlled -- never explosive"), while Chronic
-- Illness Support progresses to genuine explosive/power supersets like
-- General Population's Phase 4. That matches their real Track Criteria
-- descriptions -- "stays stability-forward" vs. "standard progression,
-- extra-care pacing."
--
-- Rehab-Forward's real program is a completely different structure than
-- what I'd drafted: NASM Corrective Exercise (Inhibit -> Lengthen ->
-- Activate -> Integrate), organized by 3 fixed body-region focuses
-- (Lower Body & Hip, Upper Body & Thoracic, Posterior Chain & Spine)
-- rather than a standard split, at every phase.
--
-- Minor normalization note: where Track F and Track C.3's source PDFs had
-- trivial punctuation-only differences for otherwise-identical shared
-- exercises (e.g. "Ab/Core: Ball Slams -- AMRAP 30 sec" vs "(AMRAP 30
-- sec)"), one canonical wording was picked so the Library doesn't end up
-- with near-duplicate entries for the same movement. Nothing about the
-- movement itself was changed.
--
-- This is a large migration (130 new exercises, 36 program days across
-- 3 profiles). Verified end-to-end against a scratch Postgres instance
-- before shipping -- see the commit message for details.

insert into public.exercises (name) values
  ('Step-Up w/ Lift'),
  ('Ball Leg Curl'),
  ('Single-Leg Front Raise'),
  ('Side Step-Up w/ Balance'),
  ('Ab/Core: Ball Slams -- AMRAP 30 sec'),
  ('Reverse Lunge w/ Lift'),
  ('Ab/Core: Walking Lunge -- laps down & back'),
  ('Ball Flye'),
  ('Single-Leg Overhead Press'),
  ('Single-Leg Reach'),
  ('Ab/Core: Overhead Carry + KB Swings 3x10'),
  ('Back Squat'),
  ('Overhead Press'),
  ('Walking Lunge (loaded)'),
  ('Sumo Squat / Front Squat'),
  ('Incline DB/Barbell Press'),
  ('Seated Cable Row'),
  ('Overhead Carry'),
  ('Hip Thrust (higher volume)'),
  ('Ab/Core: Bird Dog to Elbow-Knee + Glute Bridge March'),
  ('Single-Arm Row'),
  ('Step-Up (moderate ht., DB)'),
  ('Ab/Core: Dead Bug (DB) + Leg Raise'),
  ('Goblet Squat (higher rep)'),
  ('Ab/Core: Suitcase Carry + Pallof Press'),
  ('Hip Thrust (heaviest controlled load)'),
  ('Bulgarian Split Squat (loaded)'),
  ('Seated Overhead Press'),
  ('Single-Leg RDL (loaded)'),
  ('Ab/Core: Pallof Press + Bird Dog with Reach'),
  ('Walking Lunge (loaded, controlled)'),
  ('Single-Arm Row (heavier)'),
  ('Single-Leg Hip Thrust (loaded)'),
  ('DB Bicep Curl (heavier)'),
  ('Step-Up w/ Lift (loaded)'),
  ('Ab/Core: Dead Bug with Light DB'),
  ('Goblet Squat (deepest controlled range)'),
  ('Ball Flye (heavier)'),
  ('Split Squat (loaded)'),
  ('Face Pull (heavier band)'),
  ('Single-Leg Reach (loaded)'),
  ('Ab/Core: Suitcase Carry (heavier)'),
  ('Jump Squat'),
  ('Hip Thrust (explosive up)'),
  ('Med Ball Chest Pass'),
  ('Bench Press (moderate load)'),
  ('Box Jump'),
  ('Single-Leg RDL to Hop'),
  ('Pull-Up / Row (explosive)'),
  ('Overhead Med Ball Throw'),
  ('Lateral Bound'),
  ('Banded Lateral Walk + Pulse'),
  ('Kettlebell Swing'),
  ('Hip Thrust (heaviest load)'),
  ('Jump Push-Up / Explosive Press'),
  ($t$Farmer's Carry$t$),
  ('Single-Leg Box Step-Down (deceleration)'),
  ('Med Ball Rotational Throw'),
  ('Seated Row (moderate load)'),
  ('Skater Hops'),
  ('Glute Bridge March'),
  ('Plyo Push-Up'),
  ('Bulgarian Split Squat Jump'),
  ('Overhead Press (moderate load)'),
  ('Broad Jump'),
  ('Hollow Hold'),
  ('Foam Roll: Quads & IT Band'),
  ('Kneeling Hip Flexor Stretch (assisted)'),
  ('Glute Bridge, slow controlled'),
  ('Clamshell'),
  ('Bodyweight Squat to Chair'),
  ('Standing Calf Stretch'),
  ('Foam Roll: Thoracic Spine'),
  ('Doorway Chest Stretch'),
  ('Wall Slide / Scapular Retraction'),
  ('Standing Row to Overhead Reach'),
  ($t$Child's Pose w/ Reach$t$),
  ('Foam Roll: Upper Back & Lats'),
  ('Cat-Cow / Segmental Spine Mobility'),
  ('Bird Dog'),
  ('Dead Bug'),
  ('Hip Hinge Pattern (bodyweight RDL)'),
  ('Supine Figure-4 Stretch'),
  ('Kneeling Hip Flexor Stretch (PNF)'),
  ('Banded Glute Bridge'),
  ('Banded Clamshell'),
  ('Goblet Squat to Chair (light DB)'),
  ('Standing Calf Stretch w/ Wall'),
  ('Doorway Chest Stretch (deeper)'),
  ('Band Pull-Apart (heavier band)'),
  ('Wall Slide w/ Band'),
  ('Standing Row to Overhead Reach (light DB)'),
  ('Cat-Cow w/ Reach'),
  ('Bird Dog w/ Band'),
  ('Dead Bug w/ Light DB'),
  ('Hip Hinge Pattern (light DB RDL)'),
  ('Supine Figure-4 Stretch (deeper)'),
  ('Foam Roll: Quads / IT Band / Glutes'),
  ('Banded Glute Bridge (higher rep)'),
  ('Single-Leg Glute Bridge, controlled'),
  ('Goblet Squat to Depth'),
  ('Standing Calf Stretch + Ankle Mobility'),
  ('Foam Roll: Thoracic Spine & Lats'),
  ('Doorway Chest Stretch + Rotation'),
  ('Band Pull-Apart (higher volume)'),
  ('Wall Slide w/ Band (higher rep)'),
  ('Standing Row to Overhead Reach (moderate DB)'),
  ('Thread the Needle Stretch'),
  ('Foam Roll: Full Posterior Chain'),
  ('Cat-Cow + Thoracic Rotation'),
  ('Bird Dog, longer hold'),
  ('Dead Bug w/ Moderate DB'),
  ('Hip Hinge to RDL (moderate DB)'),
  ('Supine Figure-4 + Hamstring Stretch'),
  ('Foam Roll: Full Lower Body'),
  ('Kneeling Hip Flexor Stretch + Rotation'),
  ('Step-Down, controlled'),
  ('Multi-Planar Lunge, controlled'),
  ('Standing Calf Stretch + Balance Reach'),
  ('Foam Roll: Thoracic Spine & Shoulders'),
  ('Doorway Chest Stretch + Overhead Reach'),
  ('Band Pull-Apart + External Rotation'),
  ('Single-Arm Wall Slide'),
  ('Standing Row to Overhead Carry'),
  ('Thread the Needle + Reach'),
  ('Cat-Cow + Multi-Plane Mobility'),
  ('Bird Dog + Reach'),
  ('Single-Leg Dead Bug'),
  ('Single-Leg Hip Hinge, controlled'),
  ('Supine Figure-4 + Full-Body Stretch Flow')
on conflict (name) do nothing;
-- ==== Medically Conservative: Phase 1 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Step-Up w/ Lift'),
  (1, 'DB Ball Chest Press'),
  (2, 'Ball Leg Curl'),
  (3, 'Single-Leg Front Raise'),
  (4, 'Side Step-Up w/ Balance'),
  (5, 'Ab/Core: Ball Slams -- AMRAP 30 sec')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Single-Leg RDL'),
  (1, 'Single-Leg Bent-Over Row'),
  (2, 'Reverse Lunge w/ Lift'),
  (3, 'Single-Leg Bicep Curl'),
  (4, 'Single-Leg Hip Thrust'),
  (5, 'Ab/Core: Walking Lunge -- laps down & back')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Split Squat'),
  (1, 'Ball Flye'),
  (2, 'Bosu Ball Squat'),
  (3, 'Single-Leg Overhead Press'),
  (4, 'Single-Leg Reach'),
  (5, 'Ab/Core: Overhead Carry + KB Swings 3x10')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Medically Conservative: Phase 2 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Sumo Squat', '10', '1A'),
  (1, 'Bosu Ball Squat', '15', '1B'),
  (2, 'DB/Barbell Bench Press', '10', '2A'),
  (3, 'DB Ball Chest Press', '15', '2B'),
  (4, 'Sumo RDL', '10', '3A'),
  (5, 'Single-Leg RDL', '15', '3B'),
  (6, 'Barbell/DB Row', '10', '4A'),
  (7, 'Single-Leg Bent-Over Row', '15', '4B'),
  (8, 'Hip Thrust (barbell)', '10', '5A'),
  (9, 'Single-Leg Hip Thrust', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Back Squat', '10', '1A'),
  (1, 'Step-Up w/ Lift', '15', '1B'),
  (2, 'Overhead Press', '10', '2A'),
  (3, 'Single-Leg Front Raise', '15', '2B'),
  (4, 'Romanian Deadlift', '10', '3A'),
  (5, 'Side Step-Up w/ Balance', '15', '3B'),
  (6, 'Pull-Up / Lat Pulldown', '10', '4A'),
  (7, 'Single-Leg Bicep Curl', '15', '4B'),
  (8, 'Walking Lunge (loaded)', '10', '5A'),
  (9, 'Single-Leg RDL', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Sumo Squat / Front Squat', '10', '1A'),
  (1, 'Split Squat', '15', '1B'),
  (2, 'Incline DB/Barbell Press', '10', '2A'),
  (3, 'Ball Flye', '15', '2B'),
  (4, 'Sumo RDL', '10', '3A'),
  (5, 'Single-Leg Reach', '15', '3B'),
  (6, 'Seated Cable Row', '10', '4A'),
  (7, 'Single-Leg Overhead Press', '15', '4B'),
  (8, 'Hip Thrust (barbell)', '10', '5A'),
  (9, 'Overhead Carry', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ==== Medically Conservative: Phase 3 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Hip Thrust (higher volume)'),
  (1, 'DB/Barbell Bench Press'),
  (2, 'Bulgarian Split Squat'),
  (3, 'DB Shoulder Press'),
  (4, 'Single-Leg RDL'),
  (5, 'Ab/Core: Bird Dog to Elbow-Knee + Glute Bridge March')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Curtsy Lunge'),
  (1, 'Single-Arm Row'),
  (2, 'Single-Leg Hip Thrust'),
  (3, 'DB Bicep Curl'),
  (4, 'Step-Up (moderate ht., DB)'),
  (5, 'Ab/Core: Dead Bug (DB) + Leg Raise')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Goblet Squat (higher rep)'),
  (1, 'Ball Flye'),
  (2, 'Split Squat'),
  (3, 'Face Pull'),
  (4, 'Single-Leg Reach'),
  (5, 'Ab/Core: Suitcase Carry + Pallof Press')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Chronic Illness Support: Phase 1 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Step-Up w/ Lift'),
  (1, 'DB Ball Chest Press'),
  (2, 'Ball Leg Curl'),
  (3, 'Single-Leg Front Raise'),
  (4, 'Side Step-Up w/ Balance'),
  (5, 'Ab/Core: Ball Slams -- AMRAP 30 sec')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Single-Leg RDL'),
  (1, 'Single-Leg Bent-Over Row'),
  (2, 'Reverse Lunge w/ Lift'),
  (3, 'Single-Leg Bicep Curl'),
  (4, 'Single-Leg Hip Thrust'),
  (5, 'Ab/Core: Walking Lunge -- laps down & back')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Split Squat'),
  (1, 'Ball Flye'),
  (2, 'Bosu Ball Squat'),
  (3, 'Single-Leg Overhead Press'),
  (4, 'Single-Leg Reach'),
  (5, 'Ab/Core: Overhead Carry + KB Swings 3x10')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Chronic Illness Support: Phase 2 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Sumo Squat', '10', '1A'),
  (1, 'Bosu Ball Squat', '15', '1B'),
  (2, 'DB/Barbell Bench Press', '10', '2A'),
  (3, 'DB Ball Chest Press', '15', '2B'),
  (4, 'Sumo RDL', '10', '3A'),
  (5, 'Single-Leg RDL', '15', '3B'),
  (6, 'Barbell/DB Row', '10', '4A'),
  (7, 'Single-Leg Bent-Over Row', '15', '4B'),
  (8, 'Hip Thrust (barbell)', '10', '5A'),
  (9, 'Single-Leg Hip Thrust', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Back Squat', '10', '1A'),
  (1, 'Step-Up w/ Lift', '15', '1B'),
  (2, 'Overhead Press', '10', '2A'),
  (3, 'Single-Leg Front Raise', '15', '2B'),
  (4, 'Romanian Deadlift', '10', '3A'),
  (5, 'Side Step-Up w/ Balance', '15', '3B'),
  (6, 'Pull-Up / Lat Pulldown', '10', '4A'),
  (7, 'Single-Leg Bicep Curl', '15', '4B'),
  (8, 'Walking Lunge (loaded)', '10', '5A'),
  (9, 'Single-Leg RDL', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Sumo Squat / Front Squat', '10', '1A'),
  (1, 'Split Squat', '15', '1B'),
  (2, 'Incline DB/Barbell Press', '10', '2A'),
  (3, 'Ball Flye', '15', '2B'),
  (4, 'Sumo RDL', '10', '3A'),
  (5, 'Single-Leg Reach', '15', '3B'),
  (6, 'Seated Cable Row', '10', '4A'),
  (7, 'Single-Leg Overhead Press', '15', '4B'),
  (8, 'Hip Thrust (barbell)', '10', '5A'),
  (9, 'Overhead Carry', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ==== Chronic Illness Support: Phase 3 (real, from Coach Planner) ====

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Hip Thrust (higher volume)'),
  (1, 'DB/Barbell Bench Press'),
  (2, 'Bulgarian Split Squat'),
  (3, 'DB Shoulder Press'),
  (4, 'Single-Leg RDL'),
  (5, 'Ab/Core: Bird Dog to Elbow-Knee + Glute Bridge March')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Curtsy Lunge'),
  (1, 'Single-Arm Row'),
  (2, 'Single-Leg Hip Thrust'),
  (3, 'DB Bicep Curl'),
  (4, 'Step-Up (moderate ht., DB)'),
  (5, 'Ab/Core: Dead Bug (DB) + Leg Raise')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Goblet Squat (higher rep)'),
  (1, 'Ball Flye'),
  (2, 'Split Squat'),
  (3, 'Face Pull'),
  (4, 'Single-Leg Reach'),
  (5, 'Ab/Core: Suitcase Carry + Pallof Press')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Medically Conservative: Phase 4 (flat, controlled -- never explosive) ====

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Hip Thrust (heaviest controlled load)'),
  (1, 'Incline DB/Barbell Press'),
  (2, 'Bulgarian Split Squat (loaded)'),
  (3, 'Seated Overhead Press'),
  (4, 'Single-Leg RDL (loaded)'),
  (5, 'Ab/Core: Pallof Press + Bird Dog with Reach')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Walking Lunge (loaded, controlled)'),
  (1, 'Single-Arm Row (heavier)'),
  (2, 'Single-Leg Hip Thrust (loaded)'),
  (3, 'DB Bicep Curl (heavier)'),
  (4, 'Step-Up w/ Lift (loaded)'),
  (5, 'Ab/Core: Dead Bug with Light DB')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '4', '10'
from d, (values
  (0, 'Goblet Squat (deepest controlled range)'),
  (1, 'Ball Flye (heavier)'),
  (2, 'Split Squat (loaded)'),
  (3, 'Face Pull (heavier band)'),
  (4, 'Single-Leg Reach (loaded)'),
  (5, 'Ab/Core: Suitcase Carry (heavier)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Chronic Illness Support: Phase 4 (superset, A=explosive / B=controlled) ====

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 1, 'Full Body -- Day A' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Jump Squat', '8', '1A'),
  (1, 'Hip Thrust (explosive up)', '10', '1B'),
  (2, 'Med Ball Chest Pass', '8', '2A'),
  (3, 'Bench Press (moderate load)', '10', '2B'),
  (4, 'Box Jump', '8', '3A'),
  (5, 'Single-Leg RDL to Hop', '10', '3B'),
  (6, 'Pull-Up / Row (explosive)', '8', '4A'),
  (7, 'Overhead Med Ball Throw', '10', '4B'),
  (8, 'Lateral Bound', '8', '5A'),
  (9, 'Banded Lateral Walk + Pulse', '10', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 2, 'Full Body -- Day B' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Kettlebell Swing', '8', '1A'),
  (1, 'Hip Thrust (heaviest load)', '10', '1B'),
  (2, 'Jump Push-Up / Explosive Press', '8', '2A'),
  (3, $t$Farmer's Carry$t$, '10', '2B'),
  (4, 'Jump Squat', '8', '3A'),
  (5, 'Single-Leg Box Step-Down (deceleration)', '10', '3B'),
  (6, 'Med Ball Rotational Throw', '8', '4A'),
  (7, 'Seated Row (moderate load)', '10', '4B'),
  (8, 'Skater Hops', '8', '5A'),
  (9, 'Glute Bridge March', '10', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 3, 'Full Body -- Day C' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Box Jump', '8', '1A'),
  (1, 'Romanian Deadlift', '10', '1B'),
  (2, 'Plyo Push-Up', '8', '2A'),
  (3, 'Seated Row (moderate load)', '10', '2B'),
  (4, 'Bulgarian Split Squat Jump', '8', '3A'),
  (5, 'Lateral Lunge', '10', '3B'),
  (6, 'Overhead Med Ball Throw', '8', '4A'),
  (7, 'Overhead Press (moderate load)', '10', '4B'),
  (8, 'Broad Jump', '8', '5A'),
  (9, 'Hollow Hold', '10', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;
-- ==== Rehab-Forward: Phase 1 -- Foundational Corrective ====

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Lower Body & Hip Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '20'
from d, (values
  (0, 'Foam Roll: Quads & IT Band'),
  (1, 'Kneeling Hip Flexor Stretch (assisted)'),
  (2, 'Glute Bridge, slow controlled'),
  (3, 'Clamshell'),
  (4, 'Bodyweight Squat to Chair'),
  (5, 'Standing Calf Stretch')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Upper Body & Thoracic Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '20'
from d, (values
  (0, 'Foam Roll: Thoracic Spine'),
  (1, 'Doorway Chest Stretch'),
  (2, 'Band Pull-Apart'),
  (3, 'Wall Slide / Scapular Retraction'),
  (4, 'Standing Row to Overhead Reach'),
  (5, $t$Child's Pose w/ Reach$t$)
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Posterior Chain & Spine Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '1' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '20'
from d, (values
  (0, 'Foam Roll: Upper Back & Lats'),
  (1, 'Cat-Cow / Segmental Spine Mobility'),
  (2, 'Bird Dog'),
  (3, 'Dead Bug'),
  (4, 'Hip Hinge Pattern (bodyweight RDL)'),
  (5, 'Supine Figure-4 Stretch')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Rehab-Forward: Phase 2 -- Loaded Corrective ====

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Lower Body & Hip Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Quads & IT Band'),
  (1, 'Kneeling Hip Flexor Stretch (PNF)'),
  (2, 'Banded Glute Bridge'),
  (3, 'Banded Clamshell'),
  (4, 'Goblet Squat to Chair (light DB)'),
  (5, 'Standing Calf Stretch w/ Wall')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Upper Body & Thoracic Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Thoracic Spine'),
  (1, 'Doorway Chest Stretch (deeper)'),
  (2, 'Band Pull-Apart (heavier band)'),
  (3, 'Wall Slide w/ Band'),
  (4, 'Standing Row to Overhead Reach (light DB)'),
  (5, $t$Child's Pose w/ Reach$t$)
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Posterior Chain & Spine Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '2' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Upper Back & Lats'),
  (1, 'Cat-Cow w/ Reach'),
  (2, 'Bird Dog w/ Band'),
  (3, 'Dead Bug w/ Light DB'),
  (4, 'Hip Hinge Pattern (light DB RDL)'),
  (5, 'Supine Figure-4 Stretch (deeper)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Rehab-Forward: Phase 3 -- Higher-Volume Corrective ====

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 1, 'Lower Body & Hip Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Quads / IT Band / Glutes'),
  (1, 'Kneeling Hip Flexor Stretch (PNF)'),
  (2, 'Banded Glute Bridge (higher rep)'),
  (3, 'Single-Leg Glute Bridge, controlled'),
  (4, 'Goblet Squat to Depth'),
  (5, 'Standing Calf Stretch + Ankle Mobility')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 2, 'Upper Body & Thoracic Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Thoracic Spine & Lats'),
  (1, 'Doorway Chest Stretch + Rotation'),
  (2, 'Band Pull-Apart (higher volume)'),
  (3, 'Wall Slide w/ Band (higher rep)'),
  (4, 'Standing Row to Overhead Reach (moderate DB)'),
  (5, 'Thread the Needle Stretch')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 3, 'Posterior Chain & Spine Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '3' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Foam Roll: Full Posterior Chain'),
  (1, 'Cat-Cow + Thoracic Rotation'),
  (2, 'Bird Dog, longer hold'),
  (3, 'Dead Bug w/ Moderate DB'),
  (4, 'Hip Hinge to RDL (moderate DB)'),
  (5, 'Supine Figure-4 + Hamstring Stretch')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ==== Rehab-Forward: Phase 4 -- Functional Integration ====

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 1, 'Lower Body & Hip Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Foam Roll: Full Lower Body'),
  (1, 'Kneeling Hip Flexor Stretch + Rotation'),
  (2, 'Single-Leg Glute Bridge'),
  (3, 'Step-Down, controlled'),
  (4, 'Multi-Planar Lunge, controlled'),
  (5, 'Standing Calf Stretch + Balance Reach')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 2, 'Upper Body & Thoracic Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Foam Roll: Thoracic Spine & Shoulders'),
  (1, 'Doorway Chest Stretch + Overhead Reach'),
  (2, 'Band Pull-Apart + External Rotation'),
  (3, 'Single-Arm Wall Slide'),
  (4, 'Standing Row to Overhead Carry'),
  (5, 'Thread the Needle + Reach')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 3, 'Posterior Chain & Spine Focus' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (select id from public.program_days where care_profile_id = (select id from cp) and phase = '4' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Foam Roll: Full Posterior Chain'),
  (1, 'Cat-Cow + Multi-Plane Mobility'),
  (2, 'Bird Dog + Reach'),
  (3, 'Single-Leg Dead Bug'),
  (4, 'Single-Leg Hip Hinge, controlled'),
  (5, 'Supine Figure-4 + Full-Body Stretch Flow')
) as v(position, name)
join public.exercises e on e.name = v.name;
