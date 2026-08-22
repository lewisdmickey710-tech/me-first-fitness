-- Real, verified phase-level coaching guidance pulled directly from your
-- build scripts (build_track_a_templates.pdf, build_track_i_templates.pdf,
-- build_track_j_templates.pdf) -- headline, coach tips, extra-care/red-flag
-- notes, and cardio guidance for all 4 phases of General Population, Senior
-- & Balance-Focused, and Postpartum Recovery. Not researched or guessed --
-- this is the same coaching-notes content that was already built and
-- verified in those PDFs, just not previously captured anywhere in the app.
--
-- Track A's own coaching notes are still generically valid even though its
-- exercise list was later redesigned (single-leg format) -- the tips
-- reference movement patterns and populations, not the literal old exercise
-- names, so they hold up fine against the current General Population
-- content.
--
-- Note: build_track_j_templates.pdf never defined cardio guidance, so
-- Postpartum Recovery's cardio_guidance is left null throughout -- not an
-- omission on my part, it's just not in the source.

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '1',
  'Stabilization Endurance -- tempo and control, not load.',
  $t$Cue the eccentric out loud ("4 seconds down") until it's automatic -- most clients rush this phase without noticing.
Single-leg work exposes asymmetry fast. If one side is visibly weaker, don't rush to fix it here -- just note it and keep training both sides evenly.
This phase earns the right to load in Phase 2. Don't progress a client to heavier work until the flat-6 exercises look genuinely clean, not just "done."
Red flag: if Hip Thrust or Glute Bridge produces low-back arch instead of glute squeeze, regress the range before adding reps.$t$,
  $t$Chronic fatigue conditions (long COVID, autoimmune flares, POTS): this phase's low intensity is often sustainable through a flare when nothing else is -- it's completely appropriate to keep a client here regardless of "where they should be" on paper during a hard stretch.
Postpartum: prioritize the breath-core-pelvic floor connection above the exercise list itself. Any pressure, leaking, or coning is the cue to regress load immediately -- that connection work isn't optional filler, it's the actual point of this phase for her.
Older adults: name the balance/single-leg work as fall-prevention explicitly, out loud. Understanding why dramatically improves adherence -- this isn't just "easy exercises," it's the highest-leverage training they can do for independence.
Joint hypermobility (EDS and similar): treat the top of the rep range (20) as the ceiling, not a target to build toward -- more reps at low intensity is not automatically safer for a hypermobile joint.$t$,
  '2-3x/week, 20-30 min steady-state (Zone 1) -- walking, incline treadmill, easy cycling.'
from public.care_profiles where name = 'General Population'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '2',
  'Strength Endurance -- the A-side earns the load, the B-side keeps the receipts.',
  $t$A and B share rest, not effort -- don't let the B-side accessory turn into a second heavy set. It should feel noticeably easier than the A-side.
If a client's balance/stability visibly degrades on the B-side once the A-side gets heavy, that's your signal to back the A-side weight down, not skip the B-side.
This is usually where clients feel the most "progress" -- numbers are moving. Keep reminding them Phase 3 is where the visible change actually shows up, so they don't over-index on this phase's PRs.
Red flag: any pain (not fatigue) on the B-side stability work means the A-side load was too heavy for that session -- address the cause, not just the symptom.$t$,
  $t$The A/B structure is naturally good pacing for chronic-fatigue clients -- the B-side becomes a built-in active recovery between A-side efforts. Say that out loud so it reads as intentional, not as "taking it easy."
Older adults: prioritize eccentric control on the A-side even more than usual -- deceleration strength is more protective against falls than concentric strength is.
Postpartum, diastasis recti not yet cleared: avoid heavy anti-flexion loading (loaded crunching patterns) and lean on the B-side's anti-rotation/anti-extension work instead -- swap rather than skip.
Mothers with unpredictable sleep: this phase's numbers will fluctuate week to week more than any other. Track trend over 3-4 sessions, not session to session.$t$,
  '2-3x/week, 20-30 min -- mostly steady-state, one day of light Zone 2 intervals if energy allows.'
from public.care_profiles where name = 'General Population'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '3',
  'Muscular Development -- volume and consistency, not maximal effort.',
  $t$This is the phase doing the most actual body-composition work. If a client is short on time, protect this phase over the others.
Bonus finishers are genuinely optional -- use them as a recovery-dependent add-on, not a mandatory box to check every session.
Watch total weekly volume here more than any single session's intensity -- hypertrophy responds to the accumulated total.
Red flag: noticeably degrading form on the last 2 reps of a set is the cue to stop that set, not push through to the written number.$t$,
  $t$Higher volume can be genuinely fatiguing for chronic illness clients -- this is the phase most worth having an explicit "good day / bad day" volume conversation before the session starts, not mid-set.
Mothers with limited or broken sleep: total weekly volume is the lever, not single-session intensity. Some weeks need fewer full-volume sessions rather than every session trimmed a little.
Older adults and anyone with bone density concerns: this phase's volume is still joint-friendly by design (moderate load, controlled tempo) -- it's a legitimate place to build real strength without needing to chase Phase 4.$t$,
  '2-3x/week, 25-35 min -- can handle the most cardio volume of any phase, steady-state or intervals both fine.'
from public.care_profiles where name = 'General Population'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '4',
  'Power -- landing and control outrank height, speed, or load, always.',
  $t$Coach the landing before the jump. If landing mechanics break down, regress to a controlled step-down variation immediately, no exceptions.
The B-side here is deliberately calmer than the A-side (moderate load, controlled tempo) -- it's active recovery within the same superset, not a second power exercise.
This phase can double as a natural check-in point: ask if the client wants to keep progressing power work or cycle back to a Strength or Size block for a while.
Red flag: any client who hasn't had genuinely clean Phase 1-3 movement screens has no business in this phase yet -- hold them back a phase rather than rush it.$t$,
  $t$This phase is genuinely optional for many older or chronically ill clients -- osteoporosis, joint replacement, POTS, EDS, and similar all warrant staying in Phase 1-3 indefinitely. Frame it as "we're building the exact foundation this needs, no rush," never as "not for you."
Where true impact isn't appropriate, the B-side's moderate/controlled work can BE the entire Phase 4 experience -- same "next level" feeling for the client, none of the impact risk.
Postpartum returning to higher-impact training: confirm pelvic floor readiness for impact/jumping specifically (this is a separate milestone from general core recovery) before programming true plyometrics.$t$,
  $t$2x/week, short Zone 3 intervals (20-30 sec hard / 90 sec easy, x6-8) -- pairs naturally with this phase's theme, keep total weekly volume a bit lower.$t$
from public.care_profiles where name = 'General Population'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '1',
  'Stabilization Endurance -- every movement here maps directly to a daily-life task.',
  $t$Say the real-world connection out loud every time -- "this is the exact motion of getting up from your favorite chair" lands very differently than just naming the exercise. Understanding why dramatically improves adherence for this population.
Positioning near a wall or sturdy counter is a permanent feature of this program, not a sign of a client starting too easy -- frame it that way explicitly so it doesn't read as limiting.
Watch gait quality during Heel-to-Toe Walk specifically -- this is one of the more direct assessments of fall risk available in a training session, more informative than most strength markers at this phase.
Red flag: any real dizziness, not just normal exertion -- stop the exercise, have the client sit, and don't resume until it's fully resolved.$t$,
  $t$Confirm physician clearance and any documented fall history, medication list (some medications affect balance and blood pressure response to position changes), and vision status are on file before starting -- these all directly affect what's safe to program.
Orthostatic concerns are common in this population -- build in a genuine pause after any position change (seated to standing especially) rather than moving straight into the next cue.
This is exactly the population Mickey's Senior Fitness certification exists for -- lean on that specific training background rather than defaulting to general population programming instincts.$t$,
  'Walking, 2-3x/week, 15-20 min, comfortable pace -- flat, familiar terrain to start.'
from public.care_profiles where name = 'Senior & Balance-Focused'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '2',
  'Strength Endurance -- the A-side adds real load, the B-side keeps balance in the loop.',
  $t$A and B share rest, not effort -- don't let the B-side balance work turn into a second strength set. It should feel like a genuine change of task, not more of the same effort.
If balance visibly degrades on the B-side once the A-side gets more challenging, that's the signal to ease the A-side back -- balance quality is the priority metric in this track, even above load progression.
This phase is where real, measurable strength gains start showing up in daily function -- point out specific carryover ("you're getting up from the chair without using your hands as much") rather than just praising effort generally.
Red flag: any pain (not fatigue) on the B-side balance work means the A-side load was too much for that session -- address the cause, don't just note the symptom.$t$,
  $t$This population often under-reports symptoms out of not wanting to seem like they're complaining or slowing down the session -- ask specific, direct questions rather than a general "how's that feel."
Progress can be genuinely slower here than with other populations, and that's completely appropriate -- the standard is real, safe improvement, not a particular timeline.$t$,
  'Walking, 2-3x/week, 20-25 min -- gentle terrain variety once flat-terrain walking feels fully confident.'
from public.care_profiles where name = 'Senior & Balance-Focused'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '3',
  'Muscular Development -- volume and consistency, still fully grounded in function.',
  $t$This is the phase doing the most real strength-building work -- protect it, but the functional/balance-aware movement quality standard from Phases 1-2 never relaxes here.
Bonus finishers are genuinely optional -- skip them without hesitation if the session already felt like enough.
Watch fatigue's effect on balance specifically, more than general tiredness -- a client who's simply tired but still steady is fine; a client whose steadiness is degrading needs the session to end there.
Red flag: any compensation pattern (holding the wall more than usual, wider stance than typical) as fatigue sets in -- that's the cue to stop that exercise for the day.$t$,
  $t$This is a legitimate, complete long-term program on its own -- there's no requirement to progress to Phase 4 on any particular timeline, and staying here indefinitely is a full, valid outcome.$t$,
  'Walking or stationary cycling, 2-3x/week, 25-30 min -- more volume, still fully low-impact.'
from public.care_profiles where name = 'Senior & Balance-Focused'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '4',
  'Advanced Functional Strength -- more of Phase 3, never a shift toward impact.',
  $t$There is no jumping, hopping, or impact-based content anywhere in this phase, ever -- for a fall-prevention and bone-density-conscious population, uncontrolled impact is the exact outcome the whole program exists to prevent.
The only thing that changes from Phase 3 is the load and challenge ceiling -- same functional movement quality, same balance-awareness standard, held exactly as strictly as every phase before this one.
This phase is a genuine, well-earned achievement -- name that directly. Building real strength at this level, entirely within a fall-safe framework, is a meaningful outcome worth recognizing explicitly.
Red flag: same standard as every phase before -- no exceptions just because the load or challenge is higher.$t$,
  $t$If a client expresses interest in more dynamic activity (a fitness class, a sport, hiking uneven terrain), treat that as a conversation to have with her physician first -- flag it, don't quietly program toward it independently.$t$,
  'Walking or stationary cycling, 2-3x/week, 25-30 min -- same modalities as always, no interval/high-intensity progression here.'
from public.care_profiles where name = 'Senior & Balance-Focused'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care)
select id, '1',
  'Stabilization Endurance -- rebuilding the deep core connection, safely.',
  $t$Every core exercise here is anti-flexion/anti-rotation by design (Dead Bug, Bird Dog, 90/90 Breathing) -- there is no crunch, sit-up, or loaded flexion movement anywhere in this track, at any phase. That's not a simplification, it's the actual point.
Cue exhale-on-exertion consistently, every rep -- this protects the still-recovering core and pelvic floor from unnecessary intra-abdominal pressure.
If diastasis recti hasn't been formally assessed by a pelvic floor PT, that referral is worth making before progressing much past this phase.
Red flag: any doming, coning, or bulging along the midline during any exercise -- stop that exercise immediately and regress it, don't just note it and continue.$t$,
  $t$This client's stated goals are fat loss and confidence -- both are real and valid, and neither should come at the expense of the DR-safety rules above. There is no version of "working harder" that's worth reintroducing loaded flexion.
The self-compassion language already built into her Welcome pages matters -- reinforce it in session. Motherhood doesn't leave room for slow, deliberate progress elsewhere in her life; this can be the one place it's allowed to be exactly that.
Watch for signs of postpartum mood or anxiety symptoms beyond normal new-parent exhaustion -- this is outside a trainer's scope to treat, but worth a gentle, non-clinical check-in and a referral suggestion if something feels off.$t$
from public.care_profiles where name = 'Postpartum Recovery'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care)
select id, '2',
  'Strength Endurance -- machine leads, free weight follows, same movement both times.',
  $t$The A-side (machine) and B-side (free weight) are the same movement pattern on purpose -- Leg Press into Goblet Squat, Chest Press machine into DB Chest Press. Say that connection out loud; it's what makes the free-weight side feel approachable instead of intimidating.
The free-weight side will feel harder at a lighter load than the machine side did -- that's the stabilizer-muscle demand doing its job, not a sign anything's wrong.
This phase is a natural moment to point out real-world carryover explicitly: free-weight strength is what actually helps with carrying a car seat, hoisting a toddler onto a hip, hauling a stroller up stairs.
Red flag: same as Phase 1 -- any pelvic floor pressure, heaviness, or leaking on either side of a superset means lighten the load and re-cue the exhale, immediately.$t$,
  $t$This is a good phase to ask directly whether solo/home practice between sessions is realistic -- even just the free-weight (B) side of one superset done at home compounds fast.
Confidence-building note: point out specific, concrete strength gains by name ("you're using more weight on the leg press than you were three weeks ago") rather than general encouragement -- specific feedback lands more than vague praise for this population.$t$
from public.care_profiles where name = 'Postpartum Recovery'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care)
select id, '3',
  'Muscular Development -- this is the phase doing the real fat-loss and visible-change work.',
  $t$Volume is the lever here, not intensity -- protect this phase's total weekly volume over any single session's PR if her week gets tight.
Free-weight variety (Bulgarian Split Squat, Incline DB Press, DB Row) enters more deliberately here -- she's had two full phases building comfort with the free-weight pattern already, so this is a natural, not abrupt, progression.
Red flag: same DR-safety rules as every phase before this -- higher volume is never a reason to loosen the anti-flexion/anti-rotation-only core rule.
This is a good phase to revisit the "why" behind fat loss and confidence together -- visible change is starting to show, and it's worth naming that alongside the non-visible wins (energy, mood, capability) so one doesn't crowd out the other.$t$,
  $t$New motherhood sleep is unpredictable -- if a session is clearly an off day, trim volume rather than pushing the written number. Total weekly volume matters more than any single session hitting every prescribed set.
This phase is a legitimate place to stay longer than 4 weeks if she's not ready for Phase 4's more dynamic work -- there's no clock forcing progression.$t$
from public.care_profiles where name = 'Postpartum Recovery'
on conflict (care_profile_id, phase) do nothing;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care)
select id, '4',
  'Power -- controlled and machine-guided, deliberately not impact training.',
  $t$Every "explosive" cue in this phase happens on a machine's fixed path -- leg press, chest press, lat pulldown. There is no jumping, no plyometric work, no true impact anywhere in this phase.
Return to running or impact-based training is a real, separate postpartum milestone that needs its own pelvic floor readiness check -- this phase is not that, and shouldn't be treated as a stepping stone toward it without that separate clearance.
The B-side stays fully controlled throughout -- it's not a lesser version of the A-side, it's doing a different job (control under fatigue) on purpose.
Red flag: same core rules as every phase before -- no exception, even here.$t$,
  $t$This phase is a natural point to reflect together on the whole arc -- from Phase 1's gentle breathing work to genuinely explosive machine-based training is real, hard-won progress, worth naming explicitly rather than moving straight into whatever comes next.
If she's interested in eventually returning to running, higher-impact classes, or sport, this is the moment to have that conversation and make the pelvic-floor-PT referral -- not to gatekeep it, but to make sure that next step is actually safe for her specifically.$t$
from public.care_profiles where name = 'Postpartum Recovery'
on conflict (care_profile_id, phase) do nothing;
