-- First-pass client descriptions + coach cues for the 42 exercises seeded in
-- 0004 that only had a name so far (everything except Hip Thrust (barbell),
-- which was our original worked example). This is Claude-drafted content,
-- same process as Hip Thrust: draft now, correct/refine through the Library
-- screen. Nothing in the source .py file had this level of prose — only
-- names, order, and sets/reps — so there was no document to pull it from.
--
-- Guarded with "and client_description is null" so this is safe to re-run
-- and will never clobber anything you've already edited in the Library.

-- ---- Phase 1, Day 1: Legs & Glutes ----

update public.exercises set
  client_description = $t$Lie on your back with knees bent, feet flat on the floor about hip-width apart. Lift one foot off the ground — knee bent toward your chest or leg extended, whichever your coach has you doing — and plant firmly through the other heel. Brace your core, then drive through that planted heel to lift your hips until your body forms a straight line from shoulder to knee. Keep both hips level the whole way up — don't let the lifted-leg side sag or rotate open. Squeeze your glute at the top for a beat, then lower with control before the next rep.$t$,
  coach_cues = $t$Hip drop or rotation on the non-working side is the #1 compensation — watch the far hip, not the working leg. Cue: "keep your hip bones level," or a light hand tap on the hip that's sagging.
Heel drives the movement, not the toes — if she's pushing through the ball of the foot, the hamstring takes over from the glute.
If hamstring cramps before the glute fatigues, the working foot is set too far from the hips — shorten the lever by sliding the heel closer.
Ribs stay stacked over hips at the top — no lumbar arching to find extra range.
Progression trigger: a full clean set on both sides with level hips before adding a pause or light load.$t$
where name = 'Single-Leg Glute Bridge' and client_description is null;

update public.exercises set
  client_description = 'Hold a dumbbell vertically at your chest with both hands, elbows pointed down. Stand on the Bosu ball as your coach has set it up, feet shoulder-width apart. Sit your hips back and down like sitting into a chair, keeping your chest up and your weight through your whole foot. Go as low as you can control while keeping your heels down, then drive back up. The Bosu adds a balance challenge on top of the squat pattern itself.',
  coach_cues = $t$Knees track over — not past — the toes; watch for valgus (knees caving in) and cue "push the floor apart."
If heels lift, depth exceeds current ankle mobility — regress depth before adding load.
The instability should challenge balance, not cause knee wobble — regress to flat ground if form breaks down under it.
Progression trigger: controlled full-depth reps with stable knees on the Bosu before adding weight.$t$
where name = 'Goblet Squat (Bosu Ball)' and client_description is null;

update public.exercises set
  client_description = 'Stand tall on one leg with a soft bend in that knee. Hinge forward at the hips, reaching the opposite hand (or a light dumbbell) toward the floor while your free leg extends straight back behind you — hips and shoulders should stay square, like a tabletop tipping forward. Keep a flat back and a slight bend in the standing knee the whole way. Drive your hips forward to stand back up, squeezing the glute of your standing leg at the top. Move slowly — this is a balance and hip-hinge drill as much as a strength one.',
  coach_cues = $t$Hips must stay square — watch for the back leg's hip rotating open ("kickstand" cue: point that hip at the floor, not the wall).
Movement comes from the hip hinge, not the low back rounding — cue "long spine, hinge don't bend."
Standing knee holds a soft, constant bend — locking it out kills the balance challenge and stresses the joint.
The reaching hand and the back leg move together like a see-saw around the hip.
Progression trigger: controlled full-range reps with square hips and no wobble before adding load in the reaching hand.$t$
where name = 'Single-Leg RDL' and client_description is null;

update public.exercises set
  client_description = 'Loop a resistance band around your ankles or just above your knees. Get into a quarter-squat athletic stance — knees soft, chest up, weight in your heels. Keeping tension on the band the whole time, step sideways with control, then bring the trailing foot in only partway so the band never goes slack. Take the set in one direction, then repeat the same number of steps the other way.',
  coach_cues = $t$Watch for the trailing foot dragging all the way in, which lets the band go slack and kills tension — cue "never let the band rest."
Knees should track over toes, not cave in with each step; the band should resist sideways, not cause knee collapse.
Keep the quarter-squat height consistent step to step — don't let her stand up tall between reps.
Torso stays upright and stacked, no leaning to counterbalance.
Progression trigger: full set both directions with consistent band tension and no knee cave before moving the band higher or upsizing it.$t$
where name = 'Lateral Band Walk' and client_description is null;

update public.exercises set
  client_description = 'Stand on one foot, holding onto something for light balance support if needed. Rise up onto the ball of that foot as high as you can, pause briefly at the top, then lower all the way down with control until you feel a stretch in the calf. Keep your standing leg straight but not locked, and your ankle should track straight up and down — no rolling in or out.',
  coach_cues = $t$Watch the ankle for rolling inward (pronation) as fatigue sets in — cue "straight up and down through the big toe and pinky toe evenly."
Full range matters more than speed — a rushed, partial-range rep trains almost nothing; slow the tempo if form breaks down.
The support hand is for balance only, not to offload weight from the working leg.
Progression trigger: full-range reps to the target count with a stable ankle before removing the support hand or adding load.$t$
where name = 'Single-Leg Calf Raise' and client_description is null;

update public.exercises set
  client_description = 'This is two drills back to back. Bird Dog: start on hands and knees, spine neutral. Extend one arm forward and the opposite leg back at the same time, keeping your hips and shoulders level — imagine a glass of water balanced on your low back. Hold briefly, return to start, switch sides. Glute Bridge March: from a bridge position (hips lifted, core braced), lift one knee toward your chest without letting your hips drop or rotate, place it back down, then switch legs — hips stay lifted the entire time.',
  coach_cues = $t$Bird Dog: the #1 fault is hip rotation as the leg extends — cue "hips square to the floor," and regress range of motion before adding speed.
Watch for lumbar arching as the arm/leg extend — brace the core first; the movement happens without the low back changing position.
Glute Bridge March: any hip drop on the marching side means the set is over for that rep count — quality over reps.
Keep the neck long and gaze down/neutral in both drills, not craning forward.$t$
where name = 'Ab/Core: Bird Dog + Glute Bridge March' and client_description is null;

-- ---- Phase 1, Day 2: Push ----

update public.exercises set
  client_description = 'Push-up option: hands under shoulders, body in a straight line from head to heels (or knees, if modified). Lower your chest toward the floor with elbows at roughly a 45-degree angle from your body, then press back up — as you press, lift one leg a few inches off the floor to add a light stability/glute challenge, alternating legs each rep. Bench press option: lying on a bench or the floor with light dumbbells, press straight up over your chest and lower with control to about a 90-degree elbow bend.',
  coach_cues = $t$Push-up: watch for hips sagging or piking — the leg lift only adds value if the trunk stays rigid; regress to an incline or knees if the line breaks down.
Elbow angle stays moderate (not flared to 90°, not pinned to the ribs) to protect the shoulder.
Bench press: watch for the low back arching off the bench — feet flat, ribs down.
Progression trigger: clean push-up form with a controlled leg lift before decreasing the incline, or moving to full dumbbell bench.$t$
where name = 'Push-Up w/ Leg Lift (or Light DB Bench Press)' and client_description is null;

update public.exercises set
  client_description = 'Stand on one leg holding a light dumbbell at shoulder height, palm facing in. Brace your core and press the weight straight overhead without leaning or arching your back, then lower with control back to shoulder height. The standing leg adds a balance challenge on top of the shoulder work — keep your hips level and your standing knee soft.',
  coach_cues = $t$Watch for lumbar arching as the weight goes overhead — the rib cage should stay stacked over the hips, not flare up.
Path of the dumbbell should be a straight line overhead, not drifting forward.
If balance breaks down before the shoulder fatigues, that's a stability issue, not a strength one — regress the load, don't push through wobble.
Standing hip should stay level, not hike up to compensate.
Progression trigger: full set with square hips and a straight overhead path before increasing load.$t$
where name = 'Single-Leg DB Shoulder Press' and client_description is null;

update public.exercises set
  client_description = 'Anchor a band overhead or at a high point, and stand on one leg holding the band with your elbow bent at your side. Keeping your upper arm pinned to your ribs, extend your forearm down until your arm is straight, then return with control. The single-leg stance is there to challenge balance and core control while the arms do isolated work.',
  coach_cues = $t$Upper arm must stay glued to the ribs — if the elbow drifts forward on the push down, shoulder muscles are sneaking in to help the triceps.
Watch the standing hip for the same level-hips fault as other single-leg work.
Full extension at the bottom without an aggressive lockout.
Progression trigger: clean form both sides before increasing band tension.$t$
where name = 'Single-Leg Band Tricep Pushdown' and client_description is null;

update public.exercises set
  client_description = 'Stand on one leg holding a light dumbbell in each hand (or a band anchored behind you), arms out to your sides with a slight bend in the elbows. Bring your hands together in front of your chest in a wide arcing motion, like hugging a big beach ball, then return with control to the starting position. Keep your standing leg stable and your core braced throughout.',
  coach_cues = $t$Elbow bend should stay constant through the whole range — if it straightens at the start and bends at the end, the tricep is sneaking in instead of the chest doing the work.
Watch for the torso rotating or leaning to help swing the weight — the arc should come from the shoulders only.
Standing-leg wobble should not increase as the set goes on; if it does, the load is too heavy for the balance demand.
Progression trigger: smooth, controlled arc with a stable base before adding weight.$t$
where name = 'Single-Leg DB Chest Fly (standing)' and client_description is null;

update public.exercises set
  client_description = 'Stand on one leg holding a light dumbbell in each hand at your sides. Raise both arms out to the sides to about shoulder height, leading with your elbows and keeping a slight bend in them, then lower with control. Keep your standing leg stable and avoid using momentum to swing the weights up.',
  coach_cues = $t$Watch for shrugging the shoulders toward the ears as the arms rise — cue "long neck, shoulders down" and lighten the load if this shows up early.
Arms should rise to roughly shoulder height, not higher — going past that recruits the traps more than the delts.
No torso sway to generate momentum — this is a slow, controlled isolation movement.
Progression trigger: full set with stable shoulders and stance before increasing load.$t$
where name = 'Single-Leg Lateral Raise' and client_description is null;

update public.exercises set
  client_description = 'Dead Bug: lie on your back, arms reaching straight up, knees bent at 90 degrees over your hips. Press your low back into the floor and slowly extend one arm overhead and the opposite leg straight out, keeping both a few inches off the floor, then return and switch sides. Leg Raise: lying on your back with knees bent (or legs straight for a harder version), lift your legs toward your chest and lower them with control, keeping your low back pressed into the floor the whole time.',
  coach_cues = $t$The low back must stay pressed into the floor in both drills — if it arches as the limbs move, that's the range limit for this client right now; shorten the range rather than letting the back take over.
Movement should be slow and controlled, not momentum-driven.
Breathing matters: exhale on the extension/lower, don't hold the breath and brace rigidly.
Progression trigger: full range with a flat low back before extending further or adding a hold.$t$
where name = 'Ab/Core: Dead Bug + Leg Raise' and client_description is null;

-- ---- Phase 1, Day 3: Pull ----

update public.exercises set
  client_description = 'Anchor a band at chest height and stand on one leg facing the anchor, holding the band in one or both hands. Keeping your elbow close to your body, pull the band toward your ribs, squeezing your shoulder blade back and down, then extend your arm back out with control. Keep your torso upright and your standing leg stable throughout.',
  coach_cues = $t$Watch for the torso rotating toward the pulling arm — the row should come from the shoulder blade, not a twist through the spine.
Elbow travels straight back close to the body, not flaring wide.
Shoulder blade should visibly draw back and down at the end of the pull — cue "squeeze a pencil between your shoulder blades."
Progression trigger: stable stance and clean shoulder-blade movement before increasing band tension.$t$
where name = 'Single-Leg Band Row' and client_description is null;

update public.exercises set
  client_description = 'Band Lat Pulldown: anchor a band overhead, kneel or sit facing it, and pull the band down toward your chest, driving your elbows down and back while keeping your torso tall. Assisted Pull-Up: using an assisted pull-up machine or a band looped over the bar, pull your chin up toward the bar, focusing on driving your elbows down rather than just curling your arms.',
  coach_cues = $t$Watch for leaning back excessively to "cheat" the weight down — a slight lean is fine, but the torso shouldn't be doing the work the lats should be doing.
Elbows lead the movement, driving down and back, not just bending the arms.
Shoulders should depress (move away from the ears) before the arms even start pulling — cue "set your shoulder blades first."
Progression trigger: full controlled range with good shoulder positioning before reducing band assistance.$t$
where name = 'Band Lat Pulldown / Assisted Pull-Up' and client_description is null;

update public.exercises set
  client_description = 'Stand on one leg holding a dumbbell in one hand, arm fully extended at your side. Curl the weight up toward your shoulder, keeping your elbow pinned to your ribs, then lower with control all the way back down. Keep your standing leg stable and avoid swinging the weight up with your body.',
  coach_cues = $t$Elbow stays fixed at the side — any forward or backward drift means momentum or shoulder muscles are helping instead of the bicep working alone.
Watch for the classic "swing" — torso leaning back to help heave the weight up, especially late in the set.
Full range both directions: complete extension at the bottom, full curl at the top.
Progression trigger: strict form both sides before increasing load.$t$
where name = 'Single-Leg DB Bicep Curl' and client_description is null;

update public.exercises set
  client_description = 'Anchor a band at roughly face height and stand on one leg, holding the band with both hands, arms extended toward the anchor. Pull the band toward your face, leading with your elbows high and wide, squeezing your shoulder blades together at the end, then return with control. This one targets the upper back and rear shoulders, and doubles as a balance challenge.',
  coach_cues = $t$Elbows should finish high, at or above shoulder height, not drifting into a low row — that's what separates a face pull from a regular row.
Watch for shoulders shrugging toward the ears; keep them down and back throughout.
Standing-leg stability should stay steady — a good one to notice fatigue-related wobble late in a session.
Progression trigger: clean elbow-high finish both sides before increasing band tension.$t$
where name = 'Single-Leg Face Pull' and client_description is null;

update public.exercises set
  client_description = $t$Sit on the ground with your upper back against a bench or bed, one foot planted flat on the floor, and extend the other leg straight out in front of you or hold it lifted. Brace your core and drive through the planted heel to lift your hips until your body forms a straight line from shoulder to knee, keeping your hips square — don't let the working side twist or the non-working side dip. Squeeze at the top, then lower with control.$t$,
  coach_cues = $t$This is the single-leg progression of the barbell version — same faults apply, amplified: watch closely for lumbar hyperextension (ribs flaring) at the top since there's no bar to anchor the tempo.
Hips must stay square — a common fault is the pelvis rotating toward the working leg as it fatigues; cue "both hip bones facing the ceiling."
Working foot stays under or slightly in front of the knee at the top — too far forward shifts the load to the quad.
Progression trigger: clean bilateral-feeling reps (no rotation, no lumbar compensation) before adding a light band or extra range.$t$
where name = 'Single-Leg Hip Thrust' and client_description is null;

update public.exercises set
  client_description = '90/90 Breathing: lie on your back with knees bent to 90 degrees and shins resting on a bench or chair (or feet on the wall). Place a hand on your belly and ribs, exhale fully through pursed lips, letting your ribs drop and low back gently flatten toward the floor, then inhale slowly through your nose without letting your ribs flare or your back arch. This is a reset drill, not a strength one — slow and controlled. Bird Dog: as described elsewhere, extend opposite arm and leg while keeping hips and shoulders level.',
  coach_cues = $t$The breathing drill is about ribcage control, not lung volume — watch for the classic fault of the ribs flaring and the low back arching on the inhale; if that happens, the exhale wasn't complete.
Especially useful for clients with core/breathing pattern needs (Chronic Illness or Postpartum-adjacent care) — go slow and don't rush to add reps.
For the Bird Dog pairing, prioritize the same level-hips cueing used elsewhere in the library.
Often used as a calming, nervous-system-down-regulating start or finish to a session — the pace should reflect that.$t$
where name = 'Ab/Core: 90/90 Breathing + Bird Dog' and client_description is null;

-- ---- Phase 2, Day 1: Legs & Glutes (superset) ----

update public.exercises set
  client_description = 'Stand with your feet wider than shoulder-width, toes turned out about 30-45 degrees. Sit your hips straight down and back, keeping your chest up and your knees tracking in the same direction as your toes. Go as low as you can control with your heels down, then drive through your whole foot to stand back up.',
  coach_cues = $t$Knees must track over toes throughout — the wide stance makes valgus (knees caving in) an easy fault to miss if you're not watching closely.
Watch for the torso pitching too far forward, which usually means the hips aren't sitting back enough.
Heels should stay planted the entire rep; if they lift, the stance may be too narrow or too deep for current ankle mobility.
Progression trigger: full-depth reps with stable knee tracking before adding load.$t$
where name = 'Sumo Squat' and client_description is null;

update public.exercises set
  client_description = $t$Stand on the flat or dome side of a Bosu ball (per your coach's setup), feet shoulder-width apart. Perform a standard squat — hips back and down, chest up, weight through the whole foot — while managing the extra balance demand of the unstable surface. Move slower than you would on flat ground and don't rush the reps.$t$,
  coach_cues = $t$The instability should challenge balance and stabilizer muscles, not cause the knees to cave or the squat depth to shrink dramatically compared to flat ground — regress to flat ground if either happens.
Watch the ankles for excessive wobble that travels up into knee instability.
Keep the tempo slower and more controlled than a standard squat given the added demand.
Progression trigger: stable, full-depth reps on the Bosu before increasing load or moving to a single-leg variation.$t$
where name = 'Bosu Ball Squat' and client_description is null;

update public.exercises set
  client_description = 'Lie on a bench with your feet flat on the floor, a slight arch in your low back, and shoulder blades pulled together and down into the bench. Lower the weight with control to your chest (barbell) or to about a 90-degree elbow bend (dumbbells), keeping your elbows at roughly a 45-degree angle from your torso, then press back up to full extension.',
  coach_cues = $t$Watch the elbow angle — flared to 90 degrees stresses the shoulder, tucked too tight overloads the triceps; 45 degrees is the target for most clients.
Shoulder blades should stay pinned back and down throughout, not rolling forward as fatigue sets in.
Feet stay planted and active — no heels coming up to help drive the bar.
Bar or dumbbell path should be a straight vertical line, not drifting toward the face or the belly.
Progression trigger: consistent bar path and stable shoulder position before adding load.$t$
where name = 'DB/Barbell Bench Press' and client_description is null;

update public.exercises set
  client_description = 'Lie back on a stability ball with your head and shoulders supported, hips lifted so your torso is parallel to the floor (a bridge position), holding a dumbbell in each hand at chest level. Press the weights up and slightly in until your arms are extended, then lower with control back to chest level. The ball adds a stability and glute-engagement challenge on top of the chest press.',
  coach_cues = $t$Hips must stay lifted and level throughout the set — this is really a bridge and a chest press happening at once, and the hips dropping is the first sign of fatigue.
Watch for the same elbow-angle and bar-path cues as a standard bench press.
If the client can't maintain the bridge position confidently, regress to a flat bench and revisit the ball once hip control improves.
Progression trigger: stable hips and clean press mechanics together before adding load.$t$
where name = 'DB Ball Chest Press' and client_description is null;

update public.exercises set
  client_description = 'Stand with feet wider than shoulder-width, toes turned out slightly, holding a dumbbell or barbell in front of your thighs. Hinge at your hips, pushing your hips back while keeping a flat back and a soft bend in your knees, lowering the weight along your legs until you feel a stretch in your inner thighs and hamstrings. Drive your hips forward to return to standing, squeezing your glutes at the top.',
  coach_cues = $t$This is a hip-hinge, not a squat — watch for the knees bending too much and turning it into a sumo squat instead of a hinge.
Back stays flat throughout; if it starts to round, the range has exceeded current hamstring/hip mobility — stop there rather than chasing more depth.
Weight stays close to the body the entire path, not drifting forward.
Progression trigger: full controlled range with a flat back before adding load.$t$
where name = 'Sumo RDL' and client_description is null;

update public.exercises set
  client_description = 'Hinge forward at the hips to about a 45-degree torso angle (or bent further for a barbell row), knees soft, back flat, holding the weight hanging below your shoulders. Pull the weight up toward your lower ribs, driving your elbows back and squeezing your shoulder blades together, then lower with control.',
  coach_cues = $t$Watch for the torso rising up toward vertical as the client fatigues — the hip-hinge angle should stay consistent set to set.
Elbows drive back close to the body, not flaring wide, to properly target the mid-back.
No jerking or using body momentum to heave the weight up — this should be a controlled pull.
Progression trigger: consistent torso angle and clean elbow path before adding load.$t$
where name = 'Barbell/DB Row' and client_description is null;

update public.exercises set
  client_description = 'Stand on one leg, hinging forward at the hips with a flat back while your free leg extends behind you for counterbalance (similar setup to a single-leg RDL). Holding a dumbbell in the hand opposite your standing leg, pull it up toward your ribs, driving your elbow back, then lower with control. This combines the row with a balance and hip-stability challenge.',
  coach_cues = $t$Hips must stay square to the floor, same fault pattern as the single-leg RDL — watch the back leg's hip for rotating open.
Flat back throughout; if it rounds, the hinge angle is too deep for current hamstring mobility.
Elbow drives back close to the body for the row itself, same as a standard row.
Progression trigger: stable hips and clean pull before increasing load.$t$
where name = 'Single-Leg Bent-Over Row' and client_description is null;

-- ---- Phase 2, Day 2: Push (superset) ----

update public.exercises set
  client_description = 'Stand with feet hip-to-shoulder-width, the bar over your midfoot. Hinge down to grip the bar (or step into a trap bar) with a flat back, chest up, and shoulders over or slightly ahead of the bar. Brace your core, then drive through your whole foot to stand up, keeping the bar close to your body the entire way, finishing with hips fully extended — not overextended.',
  coach_cues = $t$Back must stay flat/neutral from setup through lockout — this is the highest-stakes compensation to catch early; if it rounds, the weight is too heavy or the hip-hinge pattern needs more practice at lighter load first.
Bar path should stay close to the shins and thighs throughout — drifting forward turns this into a bad-mechanics good-morning.
Hips and shoulders should rise at the same rate — hips shooting up first means the back is initiating instead of the legs.
No hyperextending (leaning back) at lockout — full hip extension is the finish line, not a backbend.
Progression trigger: clean bar path and neutral spine at working weight before adding load.$t$
where name = 'Deadlift (conv./trap bar)' and client_description is null;

update public.exercises set
  client_description = 'Lie on your back with knees bent, feet flat, and a barbell or dumbbell resting across your hip crease (padded). Brace your core and drive through your heels to lift your hips until your body forms a straight line from shoulders to knees, squeeze your glutes at the top, then lower with control.',
  coach_cues = $t$Same core fault as the hip thrust family: watch for lumbar hyperextension (ribs flaring, back arching) at the top instead of a controlled glute squeeze — cue "ribs to hips."
Feet stay flat and roughly hip-width; too narrow or too wide changes the demand unintentionally.
Bar/weight should stay stable across the hips, not rolling — reposition immediately if it shifts.
Progression trigger: two clean sessions with full lockout and no lumbar compensation before adding load, same standard as the full hip thrust.$t$
where name = 'Glute Bridge (loaded)' and client_description is null;

update public.exercises set
  client_description = 'Lie back on an incline bench (roughly 30-45 degrees), holding a dumbbell in each hand at chest level, elbows at about a 45-degree angle from your torso. Press the weights up and slightly together until your arms are extended, then lower with control back to chest level.',
  coach_cues = $t$Watch the bench angle — too steep turns this into a shoulder press and shifts the target away from the upper chest; 30-45 degrees is the target range.
Same elbow-angle and bar-path cues as flat bench press apply here.
Shoulder blades stay pinned back and down against the bench throughout.
Progression trigger: consistent press path and stable shoulder position before adding load.$t$
where name = 'Incline DB Press' and client_description is null;

update public.exercises set
  client_description = 'Stand a couple feet in front of a bench, resting the top of your back foot on it behind you. Lower straight down until your front thigh is roughly parallel to the floor, keeping your torso mostly upright and your front knee tracking over your foot, then drive back up through your front heel.',
  coach_cues = $t$Most of the load should be through the front leg — the back foot on the bench is for balance, not to push off.
Front knee tracks over the toes, not caving in or drifting way past them.
Watch for the torso pitching too far forward, which usually shifts the demand away from the glute and toward the low back.
Front-foot distance from the bench changes the demand — closer emphasizes the quad, farther emphasizes the glute; adjust per client goal.
Progression trigger: controlled depth and stable knee tracking on both sides before adding load.$t$
where name = 'Bulgarian Split Squat' and client_description is null;

update public.exercises set
  client_description = 'Stand tall with feet together. Step one leg out wide to the side, bending that knee and sitting your hips back while keeping the other leg straight, reaching your hips back like a side hinge. Push off the bent leg to return to standing, then repeat on the other side.',
  coach_cues = $t$Watch the bent knee for tracking over the toes, not caving inward, especially as the client fatigues.
The straight leg's foot should stay flat and grounded, not rolling onto its edge.
Torso stays relatively upright with a slight forward lean, hips reaching back rather than the knee just diving forward.
Progression trigger: full range with stable knee tracking on both sides before adding load.$t$
where name = 'Lateral Lunge' and client_description is null;

update public.exercises set
  client_description = 'Anchor a band or cable at roughly face height. Grip with both hands, arms extended toward the anchor, and pull toward your face, leading with your elbows high and wide, squeezing your shoulder blades together at the end. Return with control to the starting position.',
  coach_cues = $t$Elbows should finish high, at or above shoulder height — a low finish turns this into a regular row and misses the rear-delt/upper-back target.
Watch for shoulders shrugging toward the ears; keep them down and back.
No leaning back to use body weight to assist the pull.
Progression trigger: clean elbow-high finish before increasing resistance.$t$
where name = 'Face Pull' and client_description is null;

update public.exercises set
  client_description = 'Set your feet up on a bench or step, hands under your shoulders, body in a straight line from head to heels. Lower your chest toward the floor with elbows at roughly a 45-degree angle, then press back up to full extension. The elevated feet shift more load onto your chest and shoulders than a standard push-up.',
  coach_cues = $t$Watch closely for hips sagging or piking, more likely here given the added load from the elevated-feet position — regress the foot height if the line breaks down.
Elbow angle stays moderate, same as bench press cueing.
Full range: chest gets close to the floor, full lockout at the top.
Progression trigger: clean full-range reps at a given foot height before raising it further.$t$
where name = 'Push-Up (feet elevated)' and client_description is null;

update public.exercises set
  client_description = 'Same setup and execution as the standard barbell hip thrust, now loaded heavier and typically for lower reps. Upper back against the bench, feet planted, drive through your heels to full hip extension, squeeze at the top, lower with control.',
  coach_cues = $t$All the standard hip thrust cues apply, and matter more at heavier loads: watch closely for lumbar hyperextension as the first sign the weight has outpaced control.
Foot placement precision matters more at heavier loads — shins vertical at lockout.
Do not add load past the point where two clean sessions in a row (full lockout, no lumbar compensation) have already been demonstrated at the current weight.
Bar should be well-padded and positioned consistently across the hip crease each rep.$t$
where name = 'Hip Thrust (heavy)' and client_description is null;

update public.exercises set
  client_description = 'Standing at a cable machine or with a band anchored low, attach the cuff to one ankle. Holding onto something for balance, kick that leg straight back and up, squeezing your glute at the top, then return with control without letting the weight/band yank your leg forward.',
  coach_cues = $t$Watch for the low back arching to generate extra range — the movement should come from the hip extending, not the spine.
Standing leg stays stable with a soft knee bend; excessive knee flexion changes the demand.
The kick should be controlled on the way back too, not just let the cable/band snap the leg forward.
Progression trigger: controlled full range both directions before increasing resistance.$t$
where name = 'Standing Glute Kickback' and client_description is null;

-- ---- Phase 2, Day 3: Pull (superset) ----

update public.exercises set
  client_description = 'Same setup as the goblet squat, now with a heavier load — front rack barbell or heavier dumbbell/kettlebell held at your chest. Sit your hips back and down, chest up, weight through your whole foot, going as deep as you can control, then drive back up.',
  coach_cues = $t$At heavier loads, watch closely for the torso pitching forward and the heels lifting — both are signs the weight has exceeded current mobility or strength at this depth.
Elbows should stay up (front rack) or the weight held close to the chest (goblet) — a dropping load pulls the torso forward.
Knee tracking over toes remains the priority as load increases.
Progression trigger: stable depth and torso position at the current load for two clean sessions before adding more weight.$t$
where name = 'Front/Goblet Squat (heavier)' and client_description is null;

update public.exercises set
  client_description = 'Stand facing a bench or box holding dumbbells at your sides. Step one foot fully onto the box, then drive through that foot to bring your whole body up, tapping the trailing foot lightly on top before stepping back down with control. Keep your torso upright throughout.',
  coach_cues = $t$Watch for pushing off the bottom (trailing) foot to help — the goal is for the top leg to do the work; lighten the load if the client is clearly leaning on the back foot.
Front knee tracks over the foot, not caving in, especially at the top of the step.
Step down with control, don't just drop — the eccentric matters as much as the concentric here.
Box height should let the front knee reach roughly hip height at the top without excessive torso lean.
Progression trigger: controlled step-up and step-down with no push-off assistance before adding load or box height.$t$
where name = 'Step-Up (loaded)' and client_description is null;

update public.exercises set
  client_description = 'Pull-Up: hang from a bar with hands slightly wider than shoulder-width, then pull your chin up and over the bar by driving your elbows down and back, lowering with full control. Lat Pulldown: seated at a machine, pull the bar down toward your upper chest with the same elbow-driven motion, then let it return with control.',
  coach_cues = $t$Elbows lead the pull, driving down and back — don't let this turn into an arm curl.
Watch for excessive body swing on pull-ups (a little lean/kip is normal, but a big swing means the load or rep count has outpaced current strength).
Shoulders should depress before the pull starts — set the shoulder blades first.
Full range: dead-hang or full-stack extension at the bottom, chin or bar to chest at the top.
Progression trigger: clean full-range reps before adding load or reducing assistance.$t$
where name = 'Pull-Up / Lat Pulldown' and client_description is null;

update public.exercises set
  client_description = 'Stand holding a barbell or dumbbells in front of your thighs. Hinge at your hips, pushing them back while keeping a flat back and a soft bend in your knees, lowering the weight along your legs until you feel a stretch in your hamstrings — usually mid-shin to just below the knee. Drive your hips forward to return to standing, squeezing your glutes at the top.',
  coach_cues = $t$Back stays flat the entire range — if it rounds, that's the depth limit for this client today, not a range to push through.
Weight stays close to the legs throughout the path, not drifting forward.
Knees hold a soft, mostly-fixed bend — this is a hip-hinge, not a squat; watch for the knees bending more to compensate for limited hamstring flexibility.
Progression trigger: full controlled range with a flat back before adding load.$t$
where name = 'Romanian Deadlift' and client_description is null;

update public.exercises set
  client_description = 'Stand tall, then step one leg behind and across your body, lowering into a lunge until your front thigh is roughly parallel to the floor. Push through your front foot to return to standing, then repeat, or alternate legs.',
  coach_cues = $t$Front knee tracks over the foot, not caving inward as the leg crosses behind.
Torso stays upright, resisting the urge to lean forward or twist as the leg crosses.
Watch for a shortened range of motion as a sign of hip mobility limits — depth should build gradually rather than forcing it.
Progression trigger: controlled full range on both sides with stable front-knee tracking before adding load.$t$
where name = 'Curtsy Lunge' and client_description is null;

update public.exercises set
  client_description = 'Whether on a machine or with dumbbells on a bench, set up with your shoulder blades pulled back and down. Press the weight forward/up until your arms are extended (without locking out aggressively), then return with control to a comfortable stretch.',
  coach_cues = $t$Shoulder blades stay set back and down throughout — watch for them rolling forward as fatigue sets in, which shifts stress onto the front of the shoulder.
Full but controlled range — not so deep it strains the shoulder, not so shallow it shortchanges the muscle.
On machines, check seat height so the handles line up with mid-chest level.
Progression trigger: consistent shoulder position and controlled tempo before adding load.$t$
where name = 'Chest Press (DB/Machine)' and client_description is null;

update public.exercises set
  client_description = 'Standing with a band around your ankles or at a cable machine with an ankle cuff, hold onto something stable and lift one leg straight out to the side, keeping your torso upright, then return with control.',
  coach_cues = $t$Watch for the torso leaning away from the working leg to help lift it higher — the movement should come from the hip, not a body lean creating fake range.
Standing leg stays stable with a soft knee bend.
Working leg stays relatively straight and moves in a clean side-plane, not swinging forward or back.
Progression trigger: controlled full range with a stable torso before increasing resistance.$t$
where name = 'Hip Abduction (band/cable)' and client_description is null;

update public.exercises set
  client_description = 'Hold a dumbbell or kettlebell in one hand at your side, like carrying a suitcase. Stand tall with your shoulders level, brace your core, and walk a set distance without letting the weight pull you to one side, then switch hands and repeat.',
  coach_cues = $t$The whole point is resisting lateral flexion — watch for the torso leaning toward the weight-free side to compensate; cue "stand as tall on this side as the other."
Shoulders stay level and back, not hiking up around the ears to help carry the load.
Steps should be normal and controlled, not rushed to get the carry over with.
Progression trigger: full distance carried tall and level on both sides before increasing load.$t$
where name = 'Suitcase Carry' and client_description is null;
