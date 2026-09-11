-- Self-led counterparts to the coach-assisted PNF set (0103): same 15
-- targets, same contract-relax sequence, but the "push against" is a fixed
-- object -- floor, bed, wall, doorframe, band, towel, or the client's own
-- opposite hand -- instead of a coach's hand. Meant as the safe, heavily
-- regressed version for self-led/virtual clients doing this alone: every
-- coach_cues note says to keep the self-generated contraction gentle
-- (there's no partner to regulate effort or catch overshoot) and to stop at
-- the first sign of pinch or pain rather than push through it.
--
-- Names keep the "PNF —" prefix (so the existing "PNF" search still finds
-- these) and add "(Self-Led)" to distinguish them from the coach-assisted
-- "(Contract-Relax)" versions. movement_type/laterality follow the same
-- classification as their 0103 counterparts.

insert into public.exercises
  (name, client_description, coach_cues, primary_muscle_group, movement_type, laterality)
values

(
  $$PNF — Hamstring (Self-Led)$$,
  $$Lying on your back with a band or towel looped around one foot, raise your leg to a gentle stretch. Press your heel down into the band like you're pushing your leg back toward the floor, hold briefly, relax, then use the band to draw your leg a little closer for a deeper stretch behind your thigh.$$,
  $$Supine, band/towel around forefoot, opposite leg flat on floor/bed (knee bent if lumbar-sensitive). Client raises leg to first tension, presses heel down into band -- gentle self-generated effort, no partner to cap it, cue "soft press, like a gas pedal" (4-6s) -> relax 2-3s -> use hands on the band to draw leg into slightly deeper hip flexion (15-30s). 2-4 rounds. Keep the opposite hip flat on the floor/bed -- no posterior pelvic tilt to fake range.$$,
  'Hamstrings', 'mobility', 'per_leg'
),
(
  $$PNF — Gastrocnemius (Self-Led)$$,
  $$Sitting with your leg straight out in front of you, loop a towel around the ball of your foot. Gently push your toes away into the towel, hold briefly, relax, then use the towel to pull your toes back toward your shin for a deeper calf stretch.$$,
  $$Long-sitting on floor/bed, knee fully extended, towel/strap around forefoot. Client dorsiflexes to first tension, plantarflexes gently into the towel (4-6s) -> relax -> use the towel to deepen dorsiflexion. 2-4 rounds. Knee must stay locked out or this drifts into a soleus stretch instead.$$,
  'Calves', 'mobility', 'per_leg'
),
(
  $$PNF — Soleus (Self-Led)$$,
  $$Same setup as the self-led calf stretch, but with your knee bent, which shifts the stretch to the deeper calf muscle underneath.$$,
  $$Same as gastroc self-led but knee flexed 30-45 degrees throughout the contraction and the deepening phase -- losing that bend drifts it back to a gastroc bias. Can be done seated with a towel or standing with the back knee bent, pressing the ball of the foot into the floor.$$,
  'Calves', 'mobility', 'per_leg'
),
(
  $$PNF — Glute / Piriformis (Self-Led)$$,
  $$Lying on your back, cross one ankle over the opposite knee (a "figure-4"). Use your hands to draw the bottom leg toward your chest until you feel a stretch. Press your top knee outward into your own hand, hold briefly, relax, then pull the bottom leg a little closer for a deeper hip stretch.$$,
  $$Supine figure-4, hands behind the bottom thigh, draw toward chest to first tension. Client presses the top (crossed) knee outward into their own opposite hand -- gentle effort (4-6s) -> relax -> draw the thigh in deeper with the hands. 2-4 rounds. Keep the sacrum grounded, no hip hiking.$$,
  'Glutes', 'mobility', 'per_leg'
),
(
  $$PNF — Hip Flexor (Self-Led)$$,
  $$In a half-kneeling lunge (or standing with your back foot up on a bed or couch), gently press your back foot down into the floor or surface, hold briefly, relax, then sink a little deeper into the lunge for a stretch through the front of your hip.$$,
  $$Half-kneeling (back knee cushioned) or standing split-stance with the back foot elevated on a bed/couch. Posterior pelvic tilt + glute squeeze on the back leg to bias hip flexor over lumbar extension. Client presses the back foot/knee down into the floor or surface -- attempts hip extension (4-6s) -> relax -> sink deeper into the lunge keeping the tuck. 2-4 rounds. Watch for lumbar arching as a compensation; cue "tuck your tailbone under" if you see it.$$,
  'Quads', 'mobility', 'per_leg'
),
(
  $$PNF — Quadriceps / Rectus Femoris (Self-Led)$$,
  $$Lying on your side or stomach, loop a strap or towel around your ankle and draw your heel toward your glutes. Press your foot back down into the strap, hold briefly, relax, then let the strap pull your heel a little closer for a deeper stretch through the front of your thigh.$$,
  $$Sidelying or prone, strap/towel around ankle, draw heel toward glute to first tension, hip neutral/slight extension. Client attempts knee extension into the strap (4-6s) -> relax -> deepen flexion + slight hip extension using the strap. 2-4 rounds. Avoid excessive lumbar extension/anterior pelvic tilt as compensation.$$,
  'Quads', 'mobility', 'per_leg'
),
(
  $$PNF — Adductor / Groin (Self-Led)$$,
  $$Lying on your back near a wall (or seated in a doorway) with one leg resting against the wall or frame out to the side, press your leg inward into it, hold briefly, relax, then let it settle a little wider against the wall for a deeper inner-thigh stretch.$$,
  $$Supine near a wall or seated in a doorway, leg abducted to first tension and resting against the wall/doorframe. Client presses the leg inward against the wall -- attempts adduction (4-6s) -> relax -> allow the leg to settle further into abduction, assisted by gravity/the wall. 2-4 rounds. Keep the pelvis level -- no lateral tilt to fake range.$$,
  'Adductors', 'mobility', 'per_leg'
),
(
  $$PNF — Abductor / IT Band-TFL (Self-Led)$$,
  $$Lying on your side near the edge of a bed, let your top leg drop down and slightly across your body off the edge. Lift that leg back up against gravity, hold briefly, relax, then let it sink back down for a deeper stretch along the outside of your hip.$$,
  $$Sidelying near a bed edge (or on the floor with the top leg crossed over the bottom one), top leg adducted/dropped to first tension. Client lifts the top leg against gravity -- attempts abduction (4-6s) -> relax -> let it drop deeper into adduction. 2-4 rounds. Keep hips stacked, no trunk rotation to cheat range.$$,
  'Abductors', 'mobility', 'per_leg'
),
(
  $$PNF — Pectoral / Chest (Self-Led)$$,
  $$Stand in a doorway with your forearm resting on the frame at about shoulder height. Press your forearm into the doorframe, hold briefly, relax, then lean your body through the doorway a little for a deeper stretch across your chest.$$,
  $$Standing in a doorway, forearm on the frame at ~90 degrees shoulder abduction (scapular plane if the standard position pinches). Client presses the forearm into the frame -- attempts horizontal adduction (4-6s) -> relax -> lean the trunk through the doorway to deepen horizontal abduction. 2-4 rounds. Stay pain-free -- no anterior shoulder pinch.$$,
  'Chest', 'mobility', 'per_arm'
),
(
  $$PNF — Latissimus Dorsi (Self-Led)$$,
  $$Reach one arm overhead and hold onto a doorframe or sturdy furniture. Pull down on it gently, hold briefly, relax, then let your body sink or lean away for a deeper stretch along the side of your back.$$,
  $$Standing, arm in full flexion + slight abduction gripping a fixed anchor (doorframe/pole/sturdy furniture) at or above head height. Client pulls down into the anchor -- attempts shoulder extension/adduction (4-6s) -> relax -> lean the hips away from the anchor to deepen the overhead reach. 2-4 rounds. Watch for lumbar extension compensating -- keep the ribs down.$$,
  'Back', 'mobility', 'per_arm'
),
(
  $$PNF — Shoulder External Rotators (Self-Led)$$,
  $$With your elbow bent at your side, hold a band anchored to something sturdy (or use your other hand) across your body. Press your forearm out against the band or hand, hold briefly, relax, then let it rotate a little further across your body for a deeper stretch.$$,
  $$Elbow flexed 90 degrees at the side (or shoulder abducted 90 for the fuller position), band anchored at elbow height or the opposite hand providing resistance. Client externally rotates against the band/hand -- gentle effort (4-6s) -> relax -> deepen internal rotation across the body. 2-4 rounds. Go gently -- commonly irritable capsule position, stop well short of any pinch.$$,
  'Shoulders', 'mobility', 'per_arm'
),
(
  $$PNF — Shoulder Internal Rotators (Self-Led)$$,
  $$Same setup, opposite direction -- press your forearm inward against a band or your other hand, hold briefly, relax, then let it rotate outward a little further each round.$$,
  $$Mirror of the external-rotation self-led version: client internally rotates against band/hand resistance (4-6s) -> relax -> deepen external rotation. 2-4 rounds. Same anterior-capsule caution -- keep effort light.$$,
  'Shoulders', 'mobility', 'per_arm'
),
(
  $$PNF — Triceps (Self-Led)$$,
  $$Reach one arm overhead with your elbow bent so your hand rests behind your head. Use your other hand (or a towel) to add gentle resistance as you press up against it, hold briefly, relax, then let your hand sink a little lower behind your head for a deeper stretch along the back of your arm.$$,
  $$Seated or standing, shoulder fully flexed, elbow flexed (hand behind head/neck). Opposite hand or a towel provides resistance at the elbow/forearm as the client attempts elbow extension (4-6s) -> relax -> deepen elbow + shoulder flexion. 2-4 rounds. Keep the neck relaxed, not craning forward.$$,
  'Triceps', 'mobility', 'per_arm'
),
(
  $$PNF — Biceps / Anterior Shoulder (Self-Led)$$,
  $$Stand with your back to a wall or counter and place one hand behind you on the surface, palm up. Press your hand down into the surface, hold briefly, relax, then turn your body slightly away for a deeper stretch through the front of your arm and shoulder.$$,
  $$Standing, hand behind on a fixed surface (wall/counter/table) around hip-to-waist height, shoulder extended, forearm supinated. Client presses the hand down into the surface -- attempts shoulder flexion (4-6s) -> relax -> rotate the trunk away from the fixed hand to deepen shoulder extension. 2-4 rounds. Light effort only -- sensitive anterior shoulder position, no forcing.$$,
  'Biceps', 'mobility', 'per_arm'
),
(
  $$PNF — Trunk Rotators (Self-Led)$$,
  $$Lying on your back with your knees bent and dropped to one side, press your knees back up toward center against your own hand, hold briefly, relax, then let them drop a little further for a deeper rotational stretch through your trunk.$$,
  $$Supine, knees bent and rotated to one side to first tension, shoulders flat on the floor/bed. Client rests a hand on the outside of the top knee and gently resists as they attempt to rotate back to center (4-6s) -> relax -> let the knees deepen into rotation. 2-4 rounds. Keep both shoulders pinned -- that's what isolates the rotation to the trunk instead of the hips.$$,
  'Core', 'mobility', 'per_side'
);
