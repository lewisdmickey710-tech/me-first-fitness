-- DRAFT ONLY -- Claude-authored Phase 1-2 content for the three care
-- profiles with zero verified exercise content anywhere in your documents:
-- Chronic Illness Support, Rehab-Forward, Medically Conservative.
--
-- These are your highest-complexity populations (EDS/POTS/MCAS, active
-- injury/rehab, bone density/surgical history). This is deliberately
-- generic, conservative program architecture -- not clinical advice, not a
-- substitute for your certifications. DO NOT assign to any client until
-- you've reviewed every row against your own clinical judgment. Movement
-- selection leans heavily on machine/seated/supported options already
-- vetted elsewhere in this library, plus a handful of standard,
-- non-controversial mobility/breathing/isometric additions -- nothing
-- diagnosis-specific or exotic.
--
-- Design notes (why each profile looks the way it does, grounded in your
-- own Track Criteria Reference descriptions):
--   * Chronic Illness Support: "standard progression, extra-care pacing" --
--     so this DOES progress Phase 1 -> Phase 2 normally, just at the
--     conservative end of each NASM rep/set range, with orthostatic-aware
--     (POTS) seated/machine bias and anti-flexion-style core work.
--   * Rehab-Forward: "not yet ready for full strength work," pain-led,
--     short sessions -- so Phase 2 stays a FLAT structure (no superset
--     density), just a small rep bump, not a jump to a heavier format.
--   * Medically Conservative: "stays stability-forward regardless of phase
--     label" -- so Phase 1 and Phase 2 use the *same* exercises and the
--     *same* conservative Phase-1-style parameters throughout, on purpose.

insert into public.exercises (name) values
  ('Seated 90/90 Breathing + Pelvic Tilt'),
  ('Seated Dead Bug (supported)'),
  ('Seated Pallof Press (light)'),
  ('Supported Squat (chair-assisted, partial range)'),
  ('Glute Bridge (bodyweight, partial range)'),
  ('Isometric Shoulder External Rotation (band, light)'),
  ('Scapular Retraction (band, light)'),
  ('Ankle Pumps + Circles'),
  ('Isometric Wall Sit (short hold, pain-free range)'),
  ('Ab/Core: Supine 90/90 Breathing'),
  ('Ab/Core: Dead Bug (pain-free range)'),
  ('Cat-Cow (spinal mobility)'),
  ('Standing Marching, controlled'),
  ('Thoracic Rotation (seated or standing)'),
  ('Ab/Core: Bird Dog (pain-free range)')
on conflict (name) do nothing;

-- =============================================================
-- Chronic Illness Support -- machine/seated-forward, standard NASM
-- progression at the conservative end of each phase's range
-- =============================================================

-- ---- Phase 1, Day 1: Lower Body (Machine, Seated) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Lower Body (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Leg Press (machine)'),
  (1, 'Leg Curl (machine)'),
  (2, 'Leg Extension (machine)'),
  (3, 'Hip Abduction (machine)'),
  (4, 'Glute Kickback (machine)'),
  (5, 'Seated 90/90 Breathing + Pelvic Tilt')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 2: Upper Push (Machine, Seated) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Upper Push (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Chest Press (machine)'),
  (1, 'Shoulder Press (machine)'),
  (2, 'Tricep Pushdown (cable/machine)'),
  (3, 'Cable Fly (machine)'),
  (4, 'Lateral Raise (machine or light DB)'),
  (5, 'Seated Dead Bug (supported)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 3: Upper Pull (Machine, Seated) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Upper Pull (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Lat Pulldown (machine)'),
  (1, 'Seated Row (machine)'),
  (2, 'Bicep Curl (machine/cable)'),
  (3, 'Face Pull (cable)'),
  (4, 'Rear Delt Fly (machine)'),
  (5, 'Seated Pallof Press (light)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 1: Lower Body (superset, still conservative volume) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Lower Body (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '2', v.reps, v.grp
from d, (values
  (0, 'Leg Press (machine)', '8', '1A'),
  (1, 'Supported Squat (chair-assisted, partial range)', '10', '1B'),
  (2, 'Leg Curl (machine)', '8', '2A'),
  (3, 'Standing Hip Hinge, light', '10', '2B'),
  (4, 'Hip Abduction (machine)', '8', '3A'),
  (5, 'Lateral Band Walk', '10', '3B'),
  (6, 'Glute Kickback (machine)', '8', '4A'),
  (7, 'Glute Bridge (bodyweight, partial range)', '10', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 2: Upper Push (superset) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Upper Push (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '2', v.reps, v.grp
from d, (values
  (0, 'Chest Press (machine)', '8', '1A'),
  (1, 'Wall Push-Up', '10', '1B'),
  (2, 'Shoulder Press (machine)', '8', '2A'),
  (3, 'Isometric Shoulder External Rotation (band, light)', '10', '2B'),
  (4, 'Cable Fly (machine)', '8', '3A'),
  (5, 'Band Pull-Apart', '10', '3B'),
  (6, 'Tricep Pushdown (cable/machine)', '8', '4A'),
  (7, 'Scapular Retraction (band, light)', '10', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 3: Upper Pull (superset) ----
with cp as (select id from public.care_profiles where name = 'Chronic Illness Support'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Upper Pull (Machine, Seated)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '2', v.reps, v.grp
from d, (values
  (0, 'Lat Pulldown (machine)', '8', '1A'),
  (1, 'Seated Row (band)', '10', '1B'),
  (2, 'Seated Row (machine)', '8', '2A'),
  (3, 'DB Row', '10', '2B'),
  (4, 'Bicep Curl (machine/cable)', '8', '3A'),
  (5, 'DB Bicep Curl', '10', '3B'),
  (6, 'Face Pull (cable)', '8', '4A'),
  (7, 'Rear Delt Fly (machine)', '10', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- =============================================================
-- Rehab-Forward -- pain-led, mobility-first. Phase 2 intentionally stays a
-- FLAT structure (no superset density) -- "not yet ready for full
-- strength work" per your own track criteria.
-- =============================================================

-- ---- Phase 1, Day 1: Lower Body, Pain-Led ----
with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Lower Body, Pain-Led' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Supported Squat (chair-assisted, partial range)'),
  (1, 'Standing Hip Hinge, light'),
  (2, 'Hip Abduction (band/cable)'),
  (3, 'Ankle Pumps + Circles'),
  (4, 'Isometric Wall Sit (short hold, pain-free range)'),
  (5, 'Ab/Core: Supine 90/90 Breathing')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 2: Upper Body, Pain-Led ----
with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Upper Body, Pain-Led' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Wall Push-Up'),
  (1, 'Band Pull-Apart'),
  (2, 'Seated Row (band)'),
  (3, 'Isometric Shoulder External Rotation (band, light)'),
  (4, 'Scapular Retraction (band, light)'),
  (5, 'Ab/Core: Dead Bug (pain-free range)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 3: Mobility & Stability ----
with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Mobility & Stability' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Cat-Cow (spinal mobility)'),
  (1, 'Standing Marching, controlled'),
  (2, 'Glute Bridge (bodyweight, partial range)'),
  (3, 'Standing Hip Circles'),
  (4, 'Thoracic Rotation (seated or standing)'),
  (5, 'Ab/Core: Bird Dog (pain-free range)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 2: same movements, same flat structure, small rep bump only ----
with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Lower Body, Pain-Led' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Supported Squat (chair-assisted, partial range)'),
  (1, 'Standing Hip Hinge, light'),
  (2, 'Hip Abduction (band/cable)'),
  (3, 'Ankle Pumps + Circles'),
  (4, 'Isometric Wall Sit (short hold, pain-free range)'),
  (5, 'Ab/Core: Supine 90/90 Breathing')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Upper Body, Pain-Led' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Wall Push-Up'),
  (1, 'Band Pull-Apart'),
  (2, 'Seated Row (band)'),
  (3, 'Isometric Shoulder External Rotation (band, light)'),
  (4, 'Scapular Retraction (band, light)'),
  (5, 'Ab/Core: Dead Bug (pain-free range)')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Rehab-Forward'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Mobility & Stability' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '12'
from d, (values
  (0, 'Cat-Cow (spinal mobility)'),
  (1, 'Standing Marching, controlled'),
  (2, 'Glute Bridge (bodyweight, partial range)'),
  (3, 'Standing Hip Circles'),
  (4, 'Thoracic Rotation (seated or standing)'),
  (5, 'Ab/Core: Bird Dog (pain-free range)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- =============================================================
-- Medically Conservative -- Phase 1 and Phase 2 deliberately use the SAME
-- exercises and stay in Phase-1-style parameters throughout, per "stays
-- stability-forward regardless of phase label."
-- =============================================================

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Lower Body (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Leg Press (machine)'),
  (1, 'Leg Curl (machine)'),
  (2, 'Leg Extension (machine)'),
  (3, 'Hip Abduction (machine)'),
  (4, 'Glute Kickback (machine)'),
  (5, 'Seated 90/90 Breathing + Pelvic Tilt')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Upper Push (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Chest Press (machine)'),
  (1, 'Shoulder Press (machine)'),
  (2, 'Wall Push-Up'),
  (3, 'Cable Fly (machine)'),
  (4, 'Lateral Raise (machine or light DB)'),
  (5, 'Seated Dead Bug (supported)')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Upper Pull (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '10'
from d, (values
  (0, 'Lat Pulldown (machine)'),
  (1, 'Seated Row (machine)'),
  (2, 'Bicep Curl (light DB)'),
  (3, 'Face Pull (cable)'),
  (4, 'Rear Delt Fly (machine)'),
  (5, 'Seated Pallof Press (light)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- Phase 2: identical exercises, one small rep bump, still flat -- the
-- "phase labels don't apply the normal way" design choice.
with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Lower Body (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Leg Press (machine)'),
  (1, 'Leg Curl (machine)'),
  (2, 'Leg Extension (machine)'),
  (3, 'Hip Abduction (machine)'),
  (4, 'Glute Kickback (machine)'),
  (5, 'Seated 90/90 Breathing + Pelvic Tilt')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Upper Push (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Chest Press (machine)'),
  (1, 'Shoulder Press (machine)'),
  (2, 'Wall Push-Up'),
  (3, 'Cable Fly (machine)'),
  (4, 'Lateral Raise (machine or light DB)'),
  (5, 'Seated Dead Bug (supported)')
) as v(position, name)
join public.exercises e on e.name = v.name;

with cp as (select id from public.care_profiles where name = 'Medically Conservative'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Upper Pull (Supported)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '1', '12'
from d, (values
  (0, 'Lat Pulldown (machine)'),
  (1, 'Seated Row (machine)'),
  (2, 'Bicep Curl (light DB)'),
  (3, 'Face Pull (cable)'),
  (4, 'Rear Delt Fly (machine)'),
  (5, 'Seated Pallof Press (light)')
) as v(position, name)
join public.exercises e on e.name = v.name;
