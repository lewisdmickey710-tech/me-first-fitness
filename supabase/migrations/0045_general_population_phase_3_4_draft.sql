-- DRAFT ONLY -- Claude-drafted Phase 3 (Hypertrophy) and Phase 4 (Power)
-- content for General Population. Phases 1-2 (0004) are real, verified
-- content from Mickey's own source material; that source never covered
-- Phases 3-4, so this fills the gap using standard NASM OPT model
-- conventions (Phase 3 = higher-volume straight sets at moderate-heavy
-- load; Phase 4 = explosive/power movement superset with a moderate-load
-- controlled complement of the same movement pattern), keeping the same
-- Legs & Glutes / Push / Pull day split already established in Phases 1-2.
--
-- Exercise selection mixes the original Phase 1-2 exercise list with the
-- newly bulk-imported exercise library (migration 0043) for the
-- power/explosive movements (jumps, slams, throws) that weren't in the
-- original set. DO NOT assign to any client until reviewed -- per Mickey's
-- own request, this is a draft to check against her clinical/programming
-- judgment first, same as the existing Senior Day 3 draft.

-- ==== Phase 3: Day 1 -- Legs & Glutes ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 1, 'Legs & Glutes' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '3' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'Barbell High Bar Back Squat', '4', '10'),
  (1, 'Barbell Romanian Deadlift', '4', '10'),
  (2, 'Bulgarian Split Squat', '4', '10 each leg'),
  (3, 'Hip Thrust (barbell)', '4', '12'),
  (4, 'Cable Hip Abduction', '4', '15 each side'),
  (5, 'Single-Leg Calf Raise', '4', '12 each leg')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ==== Phase 3: Day 2 -- Push ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 2, 'Push' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '3' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'DB/Barbell Bench Press', '4', '10'),
  (1, 'Incline DB Press', '4', '10'),
  (2, 'Single-Leg DB Shoulder Press', '4', '10 each side'),
  (3, 'DB Ball Chest Press', '4', '12'),
  (4, 'Push-Up (feet elevated)', '4', '12'),
  (5, 'Cable Pallof Press', '4', '12 each side')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ==== Phase 3: Day 3 -- Pull ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '3', 3, 'Pull' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '3' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, v.sets, v.reps
from d, (values
  (0, 'Barbell Bent Over Row', '4', '10'),
  (1, 'Pull-Up / Lat Pulldown', '4', '10'),
  (2, 'Cable V Grip Seated Low Row', '4', '10'),
  (3, 'Single-Leg Face Pull', '4', '12 each side'),
  (4, 'Single-Leg DB Bicep Curl', '4', '12 each side'),
  (5, 'Suitcase Carry', '4', '30 sec each side')
) as v(position, name, sets, reps)
join public.exercises e on e.name = v.name;

-- ==== Phase 4: Day 1 -- Legs & Glutes (superset, A=explosive / B=moderate load) ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 1, 'Legs & Glutes' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '4' and day_number = 1)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Bodyweight In and Out Squat Jump', '8', '1A'),
  (1, 'Barbell High Bar Back Squat', '10 (moderate load)', '1B'),
  (2, 'Kettlebell Swing', '8', '2A'),
  (3, 'Barbell Romanian Deadlift', '10 (moderate load)', '2B'),
  (4, 'Bodyweight Tuck Jump', '8', '3A'),
  (5, 'Bulgarian Split Squat', '10 each leg (moderate load)', '3B'),
  (6, 'Single Arm Kettlebell Swing', '8 each side', '4A'),
  (7, 'Cable Hip Abduction', '12 each side', '4B'),
  (8, 'Bodyweight Alternating Lateral Bench Jump', '8', '5A'),
  (9, 'Lateral Lunge', '10 each side (moderate load)', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ==== Phase 4: Day 2 -- Push (superset, A=explosive / B=moderate load) ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 2, 'Push' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '4' and day_number = 2)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Battle Rope Power Slam', '8', '1A'),
  (1, 'DB/Barbell Bench Press', '10 (moderate load)', '1B'),
  (2, 'Slam Ball Overhead Slam', '8', '2A'),
  (3, 'Incline DB Press', '10 (moderate load)', '2B'),
  (4, 'Wall Ball Lateral Toss', '8 each side', '3A'),
  (5, 'Push-Up (feet elevated)', '12', '3B'),
  (6, 'Medicine Ball Russian Twist', '10 each side', '4A'),
  (7, 'Cable Pallof Press', '12 each side', '4B'),
  (8, 'Bodyweight Mountain Climber', '20 sec', '5A'),
  (9, 'Single-Leg DB Shoulder Press', '10 each side (moderate load)', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;

-- ==== Phase 4: Day 3 -- Pull (superset, A=explosive / B=moderate load) ====
with gp as (select id from public.care_profiles where name = 'General Population'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '4', 3, 'Pull' from gp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
delete from public.program_day_exercises where program_day_id in (select id from d);

with gp as (select id from public.care_profiles where name = 'General Population'),
d as (select id from public.program_days where care_profile_id = (select id from gp) and phase = '4' and day_number = 3)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '4', v.reps, v.grp
from d, (values
  (0, 'Battle Rope Alternating Side Slam', '8 each side', '1A'),
  (1, 'Barbell Bent Over Row', '10 (moderate load)', '1B'),
  (2, 'Sandbag Thruster', '8', '2A'),
  (3, 'Pull-Up / Lat Pulldown', '10 (moderate load)', '2B'),
  (4, 'Landmine Thruster', '8', '3A'),
  (5, 'Cable V Grip Seated Low Row', '10 (moderate load)', '3B'),
  (6, 'Battle Rope Russian Twist', '10 each side', '4A'),
  (7, 'Single-Leg Face Pull', '12 each side', '4B'),
  (8, 'Medicine Ball Alternating Single Leg V Up', '10 each side', '5A'),
  (9, 'Single-Leg DB Bicep Curl', '12 each side (moderate load)', '5B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;
