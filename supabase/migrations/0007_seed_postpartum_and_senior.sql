-- Seeds real, verified Phase 1-2 content for two more care profiles, pulled
-- directly from your original build scripts (build_track_j_templates.pdf =
-- Track J / Postpartum, build_track_i_templates.pdf = Track I / Senior &
-- Fall-Prevention) -- not researched or guessed. Sets/reps come straight
-- from each file's own ACUTE (NASM OPT acute-variable) tables: Phase 1 flat
-- = 2 sets x 15 reps; Phase 2 superset = 3 sets, A-side 10 reps / B-side 15
-- reps (identical convention to what's already seeded for General
-- Population in 0004).
--
-- One structural note: Track I's source is a 2-day program by design
-- ("Track I -- Senior & Fall-Prevention, 2-Day" per its own banner text) --
-- only Day 1 and Day 2 are seeded here. Day 3 is intentionally left empty
-- rather than inventing a third day to force-fit the "3 days per profile"
-- rule -- flagging this for you to decide how to handle.

insert into public.exercises (name) values
  ('Leg Press (machine)'),
  ('Leg Curl (machine)'),
  ('Leg Extension (machine)'),
  ('Hip Abduction (machine)'),
  ('Glute Kickback (machine)'),
  ('Ab/Core: Dead Bug + 90/90 Breathing'),
  ('Chest Press (machine)'),
  ('Shoulder Press (machine)'),
  ('Tricep Pushdown (cable/machine)'),
  ('Cable Fly (machine)'),
  ('Lateral Raise (machine or light DB)'),
  ('Ab/Core: Bird Dog + Dead Bug'),
  ('Lat Pulldown (machine)'),
  ('Seated Row (machine)'),
  ('Bicep Curl (machine/cable)'),
  ('Face Pull (cable)'),
  ('Rear Delt Fly (machine)'),
  ('Ab/Core: Pallof Press + 90/90 Breathing'),
  ('Goblet Squat'),
  ('Split Squat'),
  ('DB Chest Press'),
  ('DB Shoulder Press'),
  ('DB Fly'),
  ('DB Overhead Tricep Extension'),
  ('Single-Arm DB Row'),
  ('DB Row'),
  ('DB Bicep Curl'),
  ('Band Pull-Apart'),
  ('Sit-to-Stand (chair, hands assisted as needed)'),
  ('Single-Leg Stance, holding counter'),
  ('Heel-to-Toe Walk (near wall for safety)'),
  ('Lateral Step, controlled'),
  ('Calf Raise, balance-focused'),
  ('Ab/Core: Seated Marching + Bird Dog'),
  ('Wall Push-Up'),
  ('Seated Row (band)'),
  ('Bicep Curl (light DB)'),
  ('Overhead Reach (functional)'),
  ('Standing Hip Hinge, light'),
  ('Ab/Core: Seated Trunk Rotation + Bird Dog'),
  ('Sit-to-Stand, slower tempo'),
  ('Single-Leg Stance with Reach'),
  ('Step-Up, real stair height'),
  ('Lateral Step-Up'),
  ('Standing Hip Hinge, light DB'),
  ('Single-Leg Balance Reach'),
  ('Heel Raise, light resistance'),
  ('Heel-to-Toe Walk, added challenge'),
  ('Incline Push-Up, more challenge'),
  ('Standing Push with Band'),
  ('Seated Row, heavier band'),
  ('Standing Row, balance challenge'),
  ('Bicep Curl, heavier DB'),
  ('Single-Leg Bicep Curl'),
  ('Overhead Press, seated, light DB'),
  ('Overhead Reach with Step')
on conflict (name) do nothing;

-- =============================================================
-- Postpartum Recovery (Track J) -- 3-Day Machine-Forward
-- =============================================================

-- ---- Phase 1, Day 1: Lower Body (Machines) ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Lower Body (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Leg Press (machine)'),
  (1, 'Leg Curl (machine)'),
  (2, 'Leg Extension (machine)'),
  (3, 'Hip Abduction (machine)'),
  (4, 'Glute Kickback (machine)'),
  (5, 'Ab/Core: Dead Bug + 90/90 Breathing')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 2: Upper Push (Machines) ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Upper Push (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Chest Press (machine)'),
  (1, 'Shoulder Press (machine)'),
  (2, 'Tricep Pushdown (cable/machine)'),
  (3, 'Cable Fly (machine)'),
  (4, 'Lateral Raise (machine or light DB)'),
  (5, 'Ab/Core: Bird Dog + Dead Bug')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 3: Upper Pull (Machines) ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Upper Pull (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Lat Pulldown (machine)'),
  (1, 'Seated Row (machine)'),
  (2, 'Bicep Curl (machine/cable)'),
  (3, 'Face Pull (cable)'),
  (4, 'Rear Delt Fly (machine)'),
  (5, 'Ab/Core: Pallof Press + 90/90 Breathing')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 1: Lower Body (Machines) -- A = machine, B = free weight ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Lower Body (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Leg Press (machine)', '10', '1A'),
  (1, 'Goblet Squat', '15', '1B'),
  (2, 'Leg Curl (machine)', '10', '2A'),
  (3, 'Single-Leg RDL', '15', '2B'),
  (4, 'Hip Abduction (machine)', '10', '3A'),
  (5, 'Lateral Band Walk', '15', '3B'),
  (6, 'Glute Kickback (machine)', '10', '4A'),
  (7, 'Single-Leg Hip Thrust', '15', '4B'),
  (8, 'Leg Extension (machine)', '10', '5A'),
  (9, 'Split Squat', '15', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 2: Upper Push (Machines) ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Upper Push (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Chest Press (machine)', '10', '1A'),
  (1, 'DB Chest Press', '15', '1B'),
  (2, 'Shoulder Press (machine)', '10', '2A'),
  (3, 'DB Shoulder Press', '15', '2B'),
  (4, 'Cable Fly (machine)', '10', '3A'),
  (5, 'DB Fly', '15', '3B'),
  (6, 'Tricep Pushdown (cable/machine)', '10', '4A'),
  (7, 'DB Overhead Tricep Extension', '15', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 3: Upper Pull (Machines) ----
with cp as (select id from public.care_profiles where name = 'Postpartum Recovery'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Upper Pull (Machines)' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Lat Pulldown (machine)', '10', '1A'),
  (1, 'Single-Arm DB Row', '15', '1B'),
  (2, 'Seated Row (machine)', '10', '2A'),
  (3, 'DB Row', '15', '2B'),
  (4, 'Bicep Curl (machine/cable)', '10', '3A'),
  (5, 'DB Bicep Curl', '15', '3B'),
  (6, 'Face Pull (cable)', '10', '4A'),
  (7, 'Band Pull-Apart', '15', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- =============================================================
-- Senior & Balance-Focused (Track I) -- 2-Day Balance/Functional
-- (source is a 2-day program; day_number 3 intentionally left empty)
-- =============================================================

-- ---- Phase 1, Day 1: Balance & Lower Body ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 1, 'Balance & Lower Body' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Sit-to-Stand (chair, hands assisted as needed)'),
  (1, 'Single-Leg Stance, holding counter'),
  (2, 'Heel-to-Toe Walk (near wall for safety)'),
  (3, 'Lateral Step, controlled'),
  (4, 'Calf Raise, balance-focused'),
  (5, 'Ab/Core: Seated Marching + Bird Dog')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 1, Day 2: Functional Strength & Core ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 2, 'Functional Strength & Core' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Wall Push-Up'),
  (1, 'Seated Row (band)'),
  (2, 'Bicep Curl (light DB)'),
  (3, 'Overhead Reach (functional)'),
  (4, 'Standing Hip Hinge, light'),
  (5, 'Ab/Core: Seated Trunk Rotation + Bird Dog')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 1: Balance & Lower Body (superset) ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 1, 'Balance & Lower Body' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Sit-to-Stand, slower tempo', '10', '1A'),
  (1, 'Single-Leg Stance with Reach', '15', '1B'),
  (2, 'Step-Up, real stair height', '10', '2A'),
  (3, 'Lateral Step-Up', '15', '2B'),
  (4, 'Standing Hip Hinge, light DB', '10', '3A'),
  (5, 'Single-Leg Balance Reach', '15', '3B'),
  (6, 'Heel Raise, light resistance', '10', '4A'),
  (7, 'Heel-to-Toe Walk, added challenge', '15', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 2: Functional Strength & Core (superset) ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 2, 'Functional Strength & Core' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Incline Push-Up, more challenge', '10', '1A'),
  (1, 'Standing Push with Band', '15', '1B'),
  (2, 'Seated Row, heavier band', '10', '2A'),
  (3, 'Standing Row, balance challenge', '15', '2B'),
  (4, 'Bicep Curl, heavier DB', '10', '3A'),
  (5, 'Single-Leg Bicep Curl', '15', '3B'),
  (6, 'Overhead Press, seated, light DB', '10', '4A'),
  (7, 'Overhead Reach with Step', '15', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;
