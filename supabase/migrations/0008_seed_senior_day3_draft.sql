-- Draft-only third day for Senior & Balance-Focused ("Gait & Functional
-- Mobility"), Phase 1-2. Unlike 0007, NONE of this is from a source
-- document -- Track I's real content was a 2-day program by design. This
-- is Claude-drafted to round it out to 3 days per your "every profile gets
-- 3 strength days" rule, deliberately staying inside the same safe,
-- non-impact, wall/counter-supported movement vocabulary already verified
-- in Days 1-2 (no new exercise types introduced).
--
-- Treat this exactly like the Hip Thrust cue-drafting process: review every
-- row in the Library/Program Builder before assigning it to any client --
-- this is a fall-risk population and this day has not been through your
-- clinical judgment yet.

insert into public.exercises (name) values
  ('Marching in Place, holding counter'),
  ('Standing Ankle Circles + Toe Raises'),
  ('Side-Stepping, hand-rail support'),
  ('Sit-to-Stand to Short Walk'),
  ('Standing Hip Circles'),
  ('Ab/Core: Standing Marching + Trunk Rotation (standing)'),
  ('Marching in Place, faster tempo'),
  ('Marching with High-Knee Reach'),
  ('Side-Stepping, added resistance band'),
  ('Side-Stepping, longer distance'),
  ('Sit-to-Stand to Walk, timed'),
  ('Standing Hip Circles, added range'),
  ('Standing Ankle Raises'),
  ('Toe Raises, balance-focused')
on conflict (name) do nothing;

-- ---- Phase 1, Day 3: Gait & Functional Mobility ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '1', 3, 'Gait & Functional Mobility' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps)
select d.id, e.id, v.position, '2', '15'
from d, (values
  (0, 'Marching in Place, holding counter'),
  (1, 'Standing Ankle Circles + Toe Raises'),
  (2, 'Side-Stepping, hand-rail support'),
  (3, 'Sit-to-Stand to Short Walk'),
  (4, 'Standing Hip Circles'),
  (5, 'Ab/Core: Standing Marching + Trunk Rotation (standing)')
) as v(position, name)
join public.exercises e on e.name = v.name;

-- ---- Phase 2, Day 3: Gait & Functional Mobility (superset) ----
with cp as (select id from public.care_profiles where name = 'Senior & Balance-Focused'),
d as (
  insert into public.program_days (care_profile_id, phase, day_number, day_label)
  select id, '2', 3, 'Gait & Functional Mobility' from cp
  on conflict (care_profile_id, phase, day_number) do update set day_label = excluded.day_label
  returning id
)
insert into public.program_day_exercises (program_day_id, exercise_id, position, sets, reps, superset_group)
select d.id, e.id, v.position, '3', v.reps, v.grp
from d, (values
  (0, 'Marching in Place, faster tempo', '10', '1A'),
  (1, 'Marching with High-Knee Reach', '15', '1B'),
  (2, 'Side-Stepping, added resistance band', '10', '2A'),
  (3, 'Side-Stepping, longer distance', '15', '2B'),
  (4, 'Sit-to-Stand to Walk, timed', '10', '3A'),
  (5, 'Standing Hip Circles, added range', '15', '3B'),
  (6, 'Standing Ankle Raises', '10', '4A'),
  (7, 'Toe Raises, balance-focused', '15', '4B')
) as v(position, name, reps, grp)
join public.exercises e on e.name = v.name;
