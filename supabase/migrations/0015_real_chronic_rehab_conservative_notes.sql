-- Real, verified phase-level coaching guidance for Chronic Illness Support,
-- Rehab-Forward, and Medically Conservative -- pulled directly from the
-- same Coach Planner PDFs as 0014 (Track F, Track C.3, Track D), not
-- researched or guessed. Uses $t$ dollar-quoting throughout instead of
-- ''-escaping (same fix as 0006/0011 -- the doubled-quote convention is
-- fragile against mobile browser paste behavior).

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '1',
  $t$Stabilization Endurance -- joint control is the actual goal here, not a warm-up to it.$t$,
  $t$Cue controlled range explicitly -- for a hypermobile joint, "how far can you go" is the wrong question; "how controlled can you keep it" is the right one.
Single-leg work exposes asymmetry fast, and with joint laxity that asymmetry can be more pronounced than in a typical client -- note it, don't rush to correct it in one session.
This phase never fully ends for this population, even once Phase 2+ begins -- the stability elements stay built into every superset going forward, permanently.
Red flag: any joint feeling like it's "clicking into place" or moving past a normal, comfortable stop -- that's the hypermobility itself being used instead of the surrounding muscle, and it's the opposite of the goal.$t$,
  $t$Confirm physician clearance and any documented movement restrictions are on file before progressing this client past initial sessions -- this isn't optional paperwork, it's the foundation the rest of this program assumes is in place.
Cushing's or similar conditions affecting bone density: be gentle with any equipment contact (straps, bars) given real bruising/skin fragility risk, and keep loading progression conservative and closely monitored.
This client's own sense of "too easy" is not a reliable guide -- hypermobile joints often feel stable at end-range when they aren't. Trust the visible control, not the client's subjective sense of stability.$t$,
  $t$Low-impact only -- walking, stationary cycling, swimming, or an elliptical, 2-3x/week, 20-30 min steady-state.$t$
from public.care_profiles where name = 'Medically Conservative'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '2',
  $t$Strength Endurance -- the A-side earns the load, the B-side is permanent, not a phase-specific add-on.$t$,
  $t$A and B share rest, not effort -- the B-side should feel noticeably easier, and it should never be cut for time. It's doing real protective work, not filling space.
If the A-side load causes any B-side instability, that's the A-side load being too heavy for this client specifically -- back it off rather than pushing to hit a number.
This phase can genuinely take longer to progress through than it would for a standard client -- that's appropriate, not a sign of falling behind.
Red flag: any pain (not fatigue) anywhere in a superset means the load was too much for that joint that day -- address the cause before the next session, don't just note it and continue.$t$,
  $t$Bone fragility considerations (Cushing's, osteoporosis, or similar): progressive overload should be genuinely gradual here -- smaller jumps, more sessions per increase, than a standard client would need.
This client may minimize discomfort more than most, either from experience with dismissive providers or from genuine difficulty distinguishing normal fatigue from joint instability -- ask specific questions rather than a general "how does that feel."$t$,
  $t$Same low-impact modalities, 2-3x/week, 20-30 min -- no interval progression planned; intensity comes from resistance work, not cardio.$t$
from public.care_profiles where name = 'Medically Conservative'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '3',
  $t$Muscular Development -- volume within the same protected range, never a reason to loosen it.$t$,
  $t$This is the phase doing the most real strength and conditioning work for this client -- protect it, but never at the cost of the range/tempo standard held in Phases 1-2.
Bonus finishers are genuinely optional here more than in any other track -- skip them without a second thought if the session already felt like enough.
Watch total weekly volume more than any single session's intensity -- fatigue affecting joint control specifically is the thing to watch for, not just general tiredness.
Red flag: any joint feeling unstable as fatigue sets in, even late in a set -- stop that exercise entirely for the session, don't just reduce the rep count.$t$,
  $t$This is a legitimate long-term home for this client -- there's no requirement to progress to Phase 4 on any particular timeline, or at all. Staying here indefinitely is a complete, valid program.$t$,
  $t$Low-impact, 2-3x/week, 25-35 min -- highest volume phase, same modality guidance throughout.$t$
from public.care_profiles where name = 'Medically Conservative'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '4',
  $t$Advanced Controlled Strength -- more of Phase 3, not a different training quality.$t$,
  $t$There is no explosive, plyometric, or impact content anywhere in this phase, on purpose. If a movement ever starts to feel like it wants to become a jump or a fast, uncontrolled rep, that's the cue to slow it back down, not lean into it.
The only thing that changes from Phase 3 is the load ceiling -- same tempo, same range, same joint-stability standard, held exactly as strictly as every phase before this one.
This phase is a genuine achievement for this client specifically -- name that directly. Real strength built entirely within a protected range is a harder, more disciplined thing to do than training without those constraints.
Red flag: same standard as every phase before -- no exceptions here just because the load is heavier.$t$,
  $t$If this client ever expresses interest in more dynamic or higher-impact training, that's a conversation for her physician first, not a programming decision to make independently -- flag it, don't quietly accommodate it.$t$,
  $t$Low-impact, 2x/week, 25-30 min -- same modalities as always, no interval/high-intensity cardio here either.$t$
from public.care_profiles where name = 'Medically Conservative'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '1',
  $t$Stabilization Endurance -- tempo and control, not load.$t$,
  $t$Cue the eccentric out loud ("4 seconds down") until it's automatic -- tempo is the whole point of this phase.
Single-leg work exposes asymmetry fast. If one side is visibly weaker, don't rush to balance it out -- note it and keep training both sides at their own pace.
This phase earns the right to load in Phase 2. Don't progress a client to heavier work until movement quality is clean here.
Red flag: if Hip Thrust or Glute Bridge produces low-back arch instead of glute squeeze, regress the range of motion before chasing more reps.$t$,
  $t$Chronic fatigue conditions (long COVID, autoimmune flares, POTS): this phase's lighter loading is naturally appropriate -- let pacing, not intensity, be the main lever.
Postpartum: prioritize the breath-core-pelvic floor connection above the exercise list itself.
Older adults: name the balance/single-leg work as fall-prevention explicitly, out loud -- it improves buy-in.
Joint hypermobility (EDS and similar): treat the top of the rep range (20) as the ceiling, not the goal -- quality of the stop matters more than the count.$t$,
  $t$Keep any extra cardio light -- easy walking is plenty while movement patterns are being rebuilt.$t$
from public.care_profiles where name = 'Chronic Illness Support'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '2',
  $t$Strength Endurance -- the A-side earns the load, the B-side keeps the receipts.$t$,
  $t$A and B share rest, not effort -- don't let the B-side accessory turn into a second warm-up.
If a client's balance/stability visibly degrades on the B-side once the A-side gets heavier, that's the cue to hold the A-side load steady, not push it.
This is usually where clients feel the most "progress" -- numbers are moving and it's motivating.
Red flag: any pain (not fatigue) on the B-side stability work means the A-side load is ahead of what the client can currently stabilize.$t$,
  $t$The A/B structure is naturally good pacing for chronic-fatigue clients -- the B-side can be scaled down independently of the A-side.
Older adults: prioritize eccentric control on the A-side even more than usual before adding weight.
Postpartum, diastasis recti not yet cleared: avoid heavy anti-flexion loading on the A-side until cleared.
Clients with unpredictable sleep: expect this phase's numbers to fluctuate week to week -- that's expected, not a setback.$t$,
  $t$The built-in tempo and rest structure covers conditioning here -- no separate cardio days needed on top of it.$t$
from public.care_profiles where name = 'Chronic Illness Support'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '3',
  $t$Muscular Development -- volume and consistency, not maximal effort.$t$,
  $t$This is the phase doing the most actual body-composition work. If a client is short on time, protect the volume here before anything else.
Bonus finishers are genuinely optional -- use them as a recovery-dependent add-on, not a requirement.
Watch total weekly volume here more than any single session's intensity -- hypertrophy responds to accumulated work.
Red flag: noticeably degrading form on the last 2 reps of a set is the cue to stop the set, not push through.$t$,
  $t$Higher volume can be genuinely fatiguing for chronic illness clients -- this is a good phase to trim a set rather than trim intensity.
Clients with limited or broken sleep: total weekly volume is the lever to adjust, not any single session.
Older adults and anyone with bone density concerns: this phase's volume is still joint-friendly -- confirm tempo stays controlled as fatigue sets in.
Postpartum: this phase is a natural point to reassess core and pelvic floor readiness before Phase 4's explosive work.$t$,
  $t$The Ab/Core finisher each day covers the conditioning piece for this phase.$t$
from public.care_profiles where name = 'Chronic Illness Support'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '4',
  $t$Power -- landing and control outrank height, speed, or load, always.$t$,
  $t$Coach the landing before the jump. If landing mechanics break down, regress to a controlled step-down instead.
The B-side here is deliberately calmer than the A-side (moderate load, controlled tempo) -- it's active recovery inside the same superset.
This phase can double as a natural check-in point: ask if the client wants to keep progressing or hold here before repeating.
Red flag: any client who hasn't had genuinely clean Phase 1-3 movement doesn't move on to full explosive intent -- regress instead.$t$,
  $t$This phase is genuinely optional for many older or chronically ill clients -- offer the B-side's controlled work as the whole session where impact isn't appropriate.
Where true impact isn't appropriate, the B-side's moderate/controlled work can BE the session -- that's still a legitimate Phase 4.
Postpartum returning to higher-impact training: confirm pelvic floor readiness before any jumping or explosive lower-body work.
If in doubt, drop the A-side to the B-side's tempo for the day -- the pairing still works as a strength-endurance day.$t$,
  $t$This phase's power work is intentionally short and explosive -- no additional cardio needed on session days.$t$
from public.care_profiles where name = 'Chronic Illness Support'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '1',
  $t$Foundational Corrective -- the goal is nervous-system safety, not effort.$t$,
  $t$Every session should follow the sequence in order -- Inhibit (foam roll) before Lengthen (stretch) before Activate (isolated strengthening) before Integrate (movement pattern). Skipping ahead undercuts why the sequence works.
Foam rolling should feel like firm pressure, uncomfortable but tolerable -- sharp pain means move to a different spot or reduce pressure.
This phase can run for as long as it needs to. There's no clock forcing progression to Phase 2 -- advance only when the foundational pattern is genuinely clean and pain-free.
Red flag: any sharp, shooting, numb, or radiating sensation during any exercise -- stop that exercise immediately and reassess, don't just reduce reps.$t$,
  $t$Plantar fasciitis specifically: the ankle/calf mobility work here is doing real therapeutic work -- don't treat it as a warm-up formality, it's the actual treatment.
Chronic pain conditions: pain that moves around or feels different day to day is common and doesn't necessarily mean regression -- track patterns over weeks, not single sessions.
Older adults: the balance elements woven into Integrate exercises are fall-prevention work -- name that explicitly so it doesn't read as "too easy."
If a client has a diagnosed condition (herniated disc, recent surgery, autoimmune flare), coordinate this program with their PT or physician rather than adjusting independently.$t$,
  $t$Walking only, as tolerated -- 5-15 min, pain-free pace. Confirming gentle movement doesn't provoke symptoms, not a calorie target.$t$
from public.care_profiles where name = 'Rehab-Forward'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '2',
  $t$Loaded Corrective -- same pattern, a little more real-world demand.$t$,
  $t$The added resistance (bands, light DB) should never change the quality of the movement -- if form degrades with load added, the load is too much, full stop.
This is often where clients start feeling meaningfully better day-to-day -- worth pointing out explicitly, since corrective work's payoff isn't always visible in the mirror.
Keep checking in on the original pain complaint specifically at the start of every session, not just generally -- track it as its own data point.
Red flag: any return of the original pain pattern as load increases is the cue to hold at Phase 1 loading a while longer, not push through.$t$,
  $t$This phase is a good checkpoint to ask whether solo home practice is realistic yet -- even 10 minutes of the Lengthen + Activate steps between sessions accelerates everything.
Postpartum: confirm any core-loading additions here are pelvic-floor-appropriate before adding -- coordinate with a pelvic floor PT if one is involved.
Older adults: light dumbbells are genuinely light here -- 1-3 lbs is often plenty to add meaningful activation demand without changing the movement quality.$t$,
  $t$Walking, 10-20 min, 2-3x/week -- any return of pain is the cue to hold at the previous duration, not push forward on schedule.$t$
from public.care_profiles where name = 'Rehab-Forward'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '3',
  $t$Higher-Volume Corrective -- repetition is the therapy.$t$,
  $t$More sets of the same pattern, not new complexity -- the volume itself is what rewires the movement long-term, so resist the urge to make this phase more interesting by adding new exercises.
Sessions will take a bit longer here -- set that expectation up front so it doesn't feel like scope creep to the client.
This is a good phase to start layering in real functional context ("notice how this feels like [daily activity]") since volume has built real competence in the pattern.
Red flag: compensation patterns (favoring one side, rushing reps to finish) mean the prescribed volume is ahead of where the client's tissue actually is -- reduce, don't push through.$t$,
  $t$Chronic illness / fatigue-limited clients: this is the phase most worth breaking into two shorter sessions in a day if a single longer session isn't sustainable -- same total volume, different distribution.
This phase is a legitimate long-term home for clients who don't need or want to progress further -- higher-volume corrective work is real, valuable training on its own.$t$,
  $t$Walking or easy stationary cycling, 15-25 min, 2-3x/week -- steady-state only, nothing interval-based yet.$t$
from public.care_profiles where name = 'Rehab-Forward'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;

insert into public.care_profile_phase_notes (care_profile_id, phase, headline, coach_tips, extra_care, cardio_guidance)
select id, '4',
  $t$Functional Integration -- more directions, same control.$t$,
  $t$This is still corrective exercise, not power training -- multi-planar and single-leg work here should stay controlled and pain-free, never explosive.
This phase is where the corrected pattern gets tested against real-world demand (uneven surfaces, multiple directions, single-leg stance) -- that's the whole point of it.
Not every client needs this phase. Higher-volume Phase 3 work is a completely legitimate place to stay long-term if functional integration isn't a goal.
Red flag: any new pain in an unfamiliar position or direction -- regress that specific movement back to Phase 3's version rather than pushing through it.$t$,
  $t$This phase is a natural bridge point toward a standard training track once a client is ready -- use it to gauge readiness rather than assuming.
Balance loss in multi-directional work is common and not itself a red flag -- it's only a concern if it's paired with pain or if it doesn't improve with practice.$t$,
  $t$Walking, easy cycling, or swimming, 20-30 min, 2-3x/week -- low-impact only. True intervals wait for graduation to a standard track.$t$
from public.care_profiles where name = 'Rehab-Forward'
on conflict (care_profile_id, phase) do update set
  headline = excluded.headline, coach_tips = excluded.coach_tips,
  extra_care = excluded.extra_care, cardio_guidance = excluded.cardio_guidance;
