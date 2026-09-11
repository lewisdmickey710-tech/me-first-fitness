-- Seeds a full set of PNF (contract-relax) stretches into the Exercise
-- Library, one per major muscle group your taxonomy already tracks. Every
-- name is prefixed "PNF —" on purpose -- the Library search box only
-- matches on name (see LibraryFilterList), so typing "PNF" is all it takes
-- to pull up exactly this set. movement_type is 'mobility' throughout;
-- laterality is per_arm/per_leg for limb work, per_side for the one
-- rotational trunk stretch. video_url and regress_to_id/progress_to_id are
-- deliberately left blank -- there's no natural "harder/easier" chain for
-- a contract-relax stretch the way there is for a strength movement, and
-- no demo clips exist yet.

insert into public.exercises
  (name, client_description, coach_cues, primary_muscle_group, movement_type, laterality)
values

(
  $$PNF — Hamstring (Contract-Relax)$$,
  $$Lying on your back with a strap around one foot, your coach raises your leg to a gentle stretch. You'll press your heel down into the strap for a few seconds, relax, then let your leg sink deeper into the stretch. A few rounds like this loosens the hamstring more than a static hold alone.$$,
  $$Supine, strap around forefoot, opposite leg flat (knee bent instead if lumbar-sensitive). Passive ASLR to first tension (10-15s) -> client presses heel down into strap ~20-30% effort (4-6s) -> relax 2-3s -> draw into deeper hip flexion (15-30s). 2-4 rounds. Keep opposite hip anchored to the table -- watch for posterior pelvic tilt masking range. Knee stays extended throughout.$$,
  'Hamstrings', 'mobility', 'per_leg'
),
(
  $$PNF — Gastrocnemius (Contract-Relax)$$,
  $$With your knee straight and a strap around the ball of your foot, you'll gently push your toes away against the strap, then relax as your coach draws your foot back for a deeper calf stretch.$$,
  $$Supine or long-sitting, knee fully extended, strap around forefoot. Passive dorsiflexion to first tension -> client plantarflexes into strap (4-6s) -> relax -> deepen dorsiflexion. 2-4 rounds. Knee must stay locked out or you're stretching soleus, not gastroc.$$,
  'Calves', 'mobility', 'per_leg'
),
(
  $$PNF — Soleus (Contract-Relax)$$,
  $$Same idea as the calf stretch, but with your knee bent, which shifts the stretch to the deeper calf muscle underneath.$$,
  $$Same setup as gastroc PNF but knee flexed 30-45 degrees throughout -- maintain that flexion through both the contraction and the deepening phase, or you drift back into a gastroc bias.$$,
  'Calves', 'mobility', 'per_leg'
),
(
  $$PNF — Glute / Piriformis (Contract-Relax)$$,
  $$Lying on your back with your ankle crossed over your opposite knee (a "figure-4" position), you'll gently push your knee outward against your coach's hand, relax, and then let the knee draw in closer for a deeper hip stretch.$$,
  $$Supine figure-4, hands/strap behind far thigh. Draw thigh toward chest to first tension -> client abducts/externally rotates the knee against resistance (4-6s) -> relax -> draw thigh in deeper. 2-4 rounds. Keep the sacrum grounded -- watch for hip hike.$$,
  'Glutes', 'mobility', 'per_leg'
),
(
  $$PNF — Hip Flexor (Contract-Relax)$$,
  $$In a half-kneeling lunge position, you'll gently press your back knee into the floor against resistance, then relax into a deeper stretch through the front of your hip.$$,
  $$Half-kneeling lunge, back knee down, posterior pelvic tilt + glute squeeze to bias hip flexor over lumbar extension. Client drives the back knee into the floor / attempts hip extension against your hand at the pelvis (4-6s) -> relax -> sink deeper into the lunge with the tuck maintained. 2-4 rounds. Watch for anterior pelvic tilt/lumbar arching compensating for range.$$,
  'Quads', 'mobility', 'per_leg'
),
(
  $$PNF — Quadriceps / Rectus Femoris (Contract-Relax)$$,
  $$Lying on your side or stomach, your coach draws your heel toward your glutes. You'll gently push your foot back down into their hand, relax, and then let the stretch deepen through the front of your thigh.$$,
  $$Sidelying or prone, knee flexion to first tension (heel toward glute), hip in neutral/slight extension. Client attempts knee extension against resistance (4-6s) -> relax -> deepen flexion + gentle hip extension. 2-4 rounds. Avoid excessive lumbar extension/anterior pelvic tilt as compensation.$$,
  'Quads', 'mobility', 'per_leg'
),
(
  $$PNF — Adductor / Groin (Contract-Relax)$$,
  $$Lying on your back with one leg raised out to the side, you'll gently squeeze your leg back toward center against resistance, relax, and then let it open further for a deeper inner-thigh stretch.$$,
  $$Supine, leg raised into hip abduction (straight or bent knee) to first tension. Client adducts against your resistance (4-6s) -> relax -> passively abduct further. 2-4 rounds. Keep the pelvis square/level -- no lateral pelvic tilt to fake range.$$,
  'Adductors', 'mobility', 'per_leg'
),
(
  $$PNF — Abductor / IT Band-TFL (Contract-Relax)$$,
  $$Lying on your side, your coach draws your top leg down and across your body. You'll gently lift it back up against their resistance, relax, and let it sink deeper for a stretch along the outside of your hip.$$,
  $$Sidelying, top leg adducted across midline (behind or in front of the bottom leg) to first tension. Client abducts against resistance (4-6s) -> relax -> deepen adduction/cross-body reach. 2-4 rounds. Keep hips stacked, no trunk rotation to cheat range.$$,
  'Abductors', 'mobility', 'per_leg'
),
(
  $$PNF — Pectoral / Chest (Contract-Relax)$$,
  $$With your arm out to the side at about shoulder height, your coach gently draws it back. You'll press your arm forward against their hand, relax, and then let it draw back further for a deeper stretch across your chest.$$,
  $$Supine or standing, arm abducted ~90 degrees, elbow extended or bent 90 degrees (scapular plane preferred for shoulder comfort). Passive horizontal abduction to first tension -> client horizontally adducts against resistance (4-6s) -> relax -> deepen horizontal abduction. 2-4 rounds. Avoid excessive anterior shoulder strain -- stay pain-free.$$,
  'Chest', 'mobility', 'per_arm'
),
(
  $$PNF — Latissimus Dorsi (Contract-Relax)$$,
  $$With your arm overhead, your coach gently guides it further into an overhead reach and slightly to the side. You'll pull your arm back down against their resistance, relax, and let it stretch deeper along the side of your back.$$,
  $$Supine or sidelying, arm in full flexion + slight abduction (lat bias) to first tension. Client attempts shoulder extension/adduction against resistance (4-6s) -> relax -> deepen overhead reach. 2-4 rounds. Watch for lumbar extension compensating -- keep ribs down.$$,
  'Back', 'mobility', 'per_arm'
),
(
  $$PNF — Shoulder External Rotators (Contract-Relax)$$,
  $$With your elbow bent at your side, your coach rotates your forearm across your body. You'll gently push back out against their hand, relax, and let the rotation go a little deeper.$$,
  $$Supine, shoulder abducted 90 degrees (or arm at side for a lower-irritability version), elbow flexed 90 degrees. Passive internal rotation to first tension -> client externally rotates against resistance (4-6s) -> relax -> deepen internal rotation. 2-4 rounds. Go gently -- this is a commonly irritable capsule position, stop short of any pinch or pain.$$,
  'Shoulders', 'mobility', 'per_arm'
),
(
  $$PNF — Shoulder Internal Rotators (Contract-Relax)$$,
  $$Same setup as the external rotation stretch, but working the opposite direction -- your coach rotates your forearm outward, you gently press back in, relax, and go a little deeper each round.$$,
  $$Same setup, opposite direction: passive external rotation to first tension -> client internally rotates against resistance (4-6s) -> relax -> deepen external rotation. 2-4 rounds. Same caution re: anterior capsule.$$,
  'Shoulders', 'mobility', 'per_arm'
),
(
  $$PNF — Triceps (Contract-Relax)$$,
  $$With your arm overhead and your elbow bent, your coach gently guides your hand further down behind your head. You'll push back up against their hand, relax, and then let the stretch go deeper along the back of your arm.$$,
  $$Seated or standing, shoulder fully flexed, elbow flexed (hand behind head/neck). Passive elbow flexion + shoulder flexion to first tension -> client extends the elbow against resistance (4-6s) -> relax -> deepen. 2-4 rounds. Keep the neck relaxed, not craning forward.$$,
  'Triceps', 'mobility', 'per_arm'
),
(
  $$PNF — Biceps / Anterior Shoulder (Contract-Relax)$$,
  $$With your arm extended behind you and your palm facing up, your coach gently increases the stretch through the front of your arm and shoulder. You'll press your hand back down into theirs, relax, and let it stretch a little further.$$,
  $$Standing/seated, shoulder extended, elbow extended, forearm supinated, to first tension. Client attempts shoulder flexion/elbow flexion against resistance (4-6s) -> relax -> deepen shoulder extension. 2-4 rounds. Light load only -- this targets a commonly sensitive anterior shoulder position.$$,
  'Biceps', 'mobility', 'per_arm'
),
(
  $$PNF — Trunk Rotators (Contract-Relax)$$,
  $$Lying on your back with your knees bent and dropped to one side, you'll gently press your knees back up toward center against resistance, relax, and then let them drop a little further for a deeper rotational stretch through your trunk.$$,
  $$Supine, knees bent and rotated to one side to first tension (shoulders stay flat on the mat). Client attempts trunk rotation back to center against resistance at the knees (4-6s) -> relax -> deepen rotation. 2-4 rounds. Keep both shoulders pinned -- that's what isolates the rotation to the trunk instead of the hips.$$,
  'Core', 'mobility', 'per_side'
);
