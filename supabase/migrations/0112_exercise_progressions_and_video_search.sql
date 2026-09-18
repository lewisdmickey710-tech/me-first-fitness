-- Assigns regress_to_id/progress_to_id for the exercises that already have
-- real content (General Population, Postpartum Recovery, Senior/
-- Fall-Prevention, Medically Conservative, Chronic Illness Support, and
-- Rehab-Forward -- the ~250 exercises seeded with real descriptions/cues
-- in 0004/0006/0007/0008/0014, as opposed to the ~965 bare names bulk
-- imported in 0043 with nothing else to go on yet).
--
-- Pairs are drawn directly from the seed data's own structure -- explicit
-- naming modifiers ("heavier", "loaded", "added range", "slower tempo")
-- and same-slot progression across phases within one track -- rather than
-- guessed from scratch. This is a first pass covering the clearest,
-- highest-confidence cases; it does not cover every exercise (accessory
-- and ab/core work without an obvious harder/easier counterpart is left
-- unlinked rather than forcing a low-confidence guess), and -- same as
-- every other AI-drafted fitness content in this app (see 0008's own
-- comment) -- review it in the Library before leaning on it clinically.
--
-- Each pair sets exactly one exercise's progress_to_id (the "easier" one)
-- and exactly one exercise's regress_to_id (the "harder" one); no name
-- appears twice in either column below, so nothing here overwrites itself.

update public.exercises e
set progress_to_id = harder.id
from (values
  -- General Population
  ('Goblet Squat (Bosu Ball)', 'Sumo Squat'),
  ('Sumo Squat', 'Front/Goblet Squat (heavier)'),
  ('Single-Leg RDL', 'Sumo RDL'),
  ('Sumo RDL', 'Romanian Deadlift'),
  ('Romanian Deadlift', 'Deadlift (conv./trap bar)'),
  ('Single-Leg Glute Bridge', 'Single-Leg Hip Thrust'),
  ('Single-Leg Hip Thrust', 'Hip Thrust (barbell)'),
  ('Hip Thrust (barbell)', 'Hip Thrust (heavy)'),
  ('Push-Up w/ Leg Lift (or Light DB Bench Press)', 'Push-Up (feet elevated)'),
  ('Single-Leg Band Row', 'Barbell/DB Row'),
  ('Band Lat Pulldown / Assisted Pull-Up', 'Pull-Up / Lat Pulldown'),
  -- Postpartum Recovery (machine -> free weight, per the track's own design)
  ('Leg Press (machine)', 'Goblet Squat'),
  ('Leg Curl (machine)', 'Single-Leg RDL'),
  ('Hip Abduction (machine)', 'Lateral Band Walk'),
  ('Leg Extension (machine)', 'Split Squat'),
  ('Chest Press (machine)', 'DB Chest Press'),
  ('Shoulder Press (machine)', 'DB Shoulder Press'),
  ('Cable Fly (machine)', 'DB Fly'),
  ('Tricep Pushdown (cable/machine)', 'DB Overhead Tricep Extension'),
  ('Seated Row (machine)', 'DB Row'),
  ('Bicep Curl (machine/cable)', 'DB Bicep Curl'),
  -- Senior/Fall-Prevention
  ('Sit-to-Stand (chair, hands assisted as needed)', 'Sit-to-Stand, slower tempo'),
  ('Single-Leg Stance, holding counter', 'Single-Leg Stance with Reach'),
  ('Heel-to-Toe Walk (near wall for safety)', 'Heel-to-Toe Walk, added challenge'),
  ('Lateral Step, controlled', 'Lateral Step-Up'),
  ('Calf Raise, balance-focused', 'Heel Raise, light resistance'),
  ('Wall Push-Up', 'Incline Push-Up, more challenge'),
  ('Seated Row (band)', 'Seated Row, heavier band'),
  ('Bicep Curl (light DB)', 'Bicep Curl, heavier DB'),
  ('Overhead Reach (functional)', 'Overhead Reach with Step'),
  ('Standing Hip Hinge, light', 'Standing Hip Hinge, light DB'),
  ('Marching in Place, holding counter', 'Marching in Place, faster tempo'),
  ('Marching in Place, faster tempo', 'Marching with High-Knee Reach'),
  ('Side-Stepping, hand-rail support', 'Side-Stepping, added resistance band'),
  ('Side-Stepping, added resistance band', 'Side-Stepping, longer distance'),
  ('Sit-to-Stand to Short Walk', 'Sit-to-Stand to Walk, timed'),
  ('Standing Hip Circles', 'Standing Hip Circles, added range'),
  -- Medically Conservative / Chronic Illness Support (shared Phase 1-3 content)
  ('Bosu Ball Squat', 'Sumo Squat / Front Squat'),
  ('Split Squat', 'Step-Up w/ Lift'),
  ('DB/Barbell Bench Press', 'Incline DB/Barbell Press'),
  -- Rehab-Forward (Phase 1 -> 2 -> 3 -> 4, same slot each day)
  ('Glute Bridge, slow controlled', 'Banded Glute Bridge'),
  ('Banded Glute Bridge', 'Banded Glute Bridge (higher rep)'),
  ('Banded Glute Bridge (higher rep)', 'Single-Leg Glute Bridge'),
  ('Clamshell', 'Banded Clamshell'),
  ('Bodyweight Squat to Chair', 'Goblet Squat to Chair (light DB)'),
  ('Goblet Squat to Chair (light DB)', 'Goblet Squat to Depth'),
  ('Band Pull-Apart', 'Band Pull-Apart (heavier band)'),
  ('Band Pull-Apart (heavier band)', 'Band Pull-Apart (higher volume)'),
  ('Band Pull-Apart (higher volume)', 'Band Pull-Apart + External Rotation'),
  ('Wall Slide / Scapular Retraction', 'Wall Slide w/ Band'),
  ('Wall Slide w/ Band', 'Wall Slide w/ Band (higher rep)'),
  ('Wall Slide w/ Band (higher rep)', 'Single-Arm Wall Slide'),
  ('Standing Row to Overhead Reach', 'Standing Row to Overhead Reach (light DB)'),
  ('Standing Row to Overhead Reach (light DB)', 'Standing Row to Overhead Reach (moderate DB)'),
  ('Standing Row to Overhead Reach (moderate DB)', 'Standing Row to Overhead Carry'),
  ('Bird Dog', 'Bird Dog w/ Band'),
  ('Bird Dog w/ Band', 'Bird Dog, longer hold'),
  ('Bird Dog, longer hold', 'Bird Dog + Reach'),
  ('Dead Bug', 'Dead Bug w/ Light DB'),
  ('Dead Bug w/ Light DB', 'Dead Bug w/ Moderate DB'),
  ('Dead Bug w/ Moderate DB', 'Single-Leg Dead Bug'),
  ('Hip Hinge Pattern (bodyweight RDL)', 'Hip Hinge Pattern (light DB RDL)'),
  ('Hip Hinge Pattern (light DB RDL)', 'Hip Hinge to RDL (moderate DB)'),
  ('Hip Hinge to RDL (moderate DB)', 'Single-Leg Hip Hinge, controlled')
) as pairs(easier_name, harder_name)
join public.exercises harder on harder.name = pairs.harder_name
where e.name = pairs.easier_name;

update public.exercises e
set regress_to_id = easier.id
from (values
  ('Goblet Squat (Bosu Ball)', 'Sumo Squat'),
  ('Sumo Squat', 'Front/Goblet Squat (heavier)'),
  ('Single-Leg RDL', 'Sumo RDL'),
  ('Sumo RDL', 'Romanian Deadlift'),
  ('Romanian Deadlift', 'Deadlift (conv./trap bar)'),
  ('Single-Leg Glute Bridge', 'Single-Leg Hip Thrust'),
  ('Single-Leg Hip Thrust', 'Hip Thrust (barbell)'),
  ('Hip Thrust (barbell)', 'Hip Thrust (heavy)'),
  ('Push-Up w/ Leg Lift (or Light DB Bench Press)', 'Push-Up (feet elevated)'),
  ('Single-Leg Band Row', 'Barbell/DB Row'),
  ('Band Lat Pulldown / Assisted Pull-Up', 'Pull-Up / Lat Pulldown'),
  ('Leg Press (machine)', 'Goblet Squat'),
  ('Leg Curl (machine)', 'Single-Leg RDL'),
  ('Hip Abduction (machine)', 'Lateral Band Walk'),
  ('Leg Extension (machine)', 'Split Squat'),
  ('Chest Press (machine)', 'DB Chest Press'),
  ('Shoulder Press (machine)', 'DB Shoulder Press'),
  ('Cable Fly (machine)', 'DB Fly'),
  ('Tricep Pushdown (cable/machine)', 'DB Overhead Tricep Extension'),
  ('Seated Row (machine)', 'DB Row'),
  ('Bicep Curl (machine/cable)', 'DB Bicep Curl'),
  ('Sit-to-Stand (chair, hands assisted as needed)', 'Sit-to-Stand, slower tempo'),
  ('Single-Leg Stance, holding counter', 'Single-Leg Stance with Reach'),
  ('Heel-to-Toe Walk (near wall for safety)', 'Heel-to-Toe Walk, added challenge'),
  ('Lateral Step, controlled', 'Lateral Step-Up'),
  ('Calf Raise, balance-focused', 'Heel Raise, light resistance'),
  ('Wall Push-Up', 'Incline Push-Up, more challenge'),
  ('Seated Row (band)', 'Seated Row, heavier band'),
  ('Bicep Curl (light DB)', 'Bicep Curl, heavier DB'),
  ('Overhead Reach (functional)', 'Overhead Reach with Step'),
  ('Standing Hip Hinge, light', 'Standing Hip Hinge, light DB'),
  ('Marching in Place, holding counter', 'Marching in Place, faster tempo'),
  ('Marching in Place, faster tempo', 'Marching with High-Knee Reach'),
  ('Side-Stepping, hand-rail support', 'Side-Stepping, added resistance band'),
  ('Side-Stepping, added resistance band', 'Side-Stepping, longer distance'),
  ('Sit-to-Stand to Short Walk', 'Sit-to-Stand to Walk, timed'),
  ('Standing Hip Circles', 'Standing Hip Circles, added range'),
  ('Bosu Ball Squat', 'Sumo Squat / Front Squat'),
  ('Split Squat', 'Step-Up w/ Lift'),
  ('DB/Barbell Bench Press', 'Incline DB/Barbell Press'),
  ('Glute Bridge, slow controlled', 'Banded Glute Bridge'),
  ('Banded Glute Bridge', 'Banded Glute Bridge (higher rep)'),
  ('Banded Glute Bridge (higher rep)', 'Single-Leg Glute Bridge'),
  ('Clamshell', 'Banded Clamshell'),
  ('Bodyweight Squat to Chair', 'Goblet Squat to Chair (light DB)'),
  ('Goblet Squat to Chair (light DB)', 'Goblet Squat to Depth'),
  ('Band Pull-Apart', 'Band Pull-Apart (heavier band)'),
  ('Band Pull-Apart (heavier band)', 'Band Pull-Apart (higher volume)'),
  ('Band Pull-Apart (higher volume)', 'Band Pull-Apart + External Rotation'),
  ('Wall Slide / Scapular Retraction', 'Wall Slide w/ Band'),
  ('Wall Slide w/ Band', 'Wall Slide w/ Band (higher rep)'),
  ('Wall Slide w/ Band (higher rep)', 'Single-Arm Wall Slide'),
  ('Standing Row to Overhead Reach', 'Standing Row to Overhead Reach (light DB)'),
  ('Standing Row to Overhead Reach (light DB)', 'Standing Row to Overhead Reach (moderate DB)'),
  ('Standing Row to Overhead Reach (moderate DB)', 'Standing Row to Overhead Carry'),
  ('Bird Dog', 'Bird Dog w/ Band'),
  ('Bird Dog w/ Band', 'Bird Dog, longer hold'),
  ('Bird Dog, longer hold', 'Bird Dog + Reach'),
  ('Dead Bug', 'Dead Bug w/ Light DB'),
  ('Dead Bug w/ Light DB', 'Dead Bug w/ Moderate DB'),
  ('Dead Bug w/ Moderate DB', 'Single-Leg Dead Bug'),
  ('Hip Hinge Pattern (bodyweight RDL)', 'Hip Hinge Pattern (light DB RDL)'),
  ('Hip Hinge Pattern (light DB RDL)', 'Hip Hinge to RDL (moderate DB)'),
  ('Hip Hinge to RDL (moderate DB)', 'Single-Leg Hip Hinge, controlled')
) as pairs(easier_name, harder_name)
join public.exercises easier on easier.name = pairs.easier_name
where e.name = pairs.harder_name;

-- Fills a real, working "Watch demo" link for every exercise that doesn't
-- have one yet -- a YouTube search for the exercise name, not a specific
-- hand-picked video (a fabricated specific video URL could point nowhere,
-- or to the wrong thing entirely; a search link is guaranteed to go
-- somewhere real and lets the client pick a result). Only fills blanks --
-- never overwrites a video_url you've already hand-picked.
update public.exercises
set video_url =
  'https://www.youtube.com/results?search_query=' ||
  replace(
    replace(
      replace(
        replace(name || ' exercise tutorial', '&', '%26'),
        '#', '%23'
      ),
      '"', '%22'
    ),
    ' ', '+'
  )
where video_url is null;
