-- The uploaded PreSignUp.zip contains a second real intake document,
-- "MeFirstFitness PreAssessment Questionnaire.pdf" -- distinct from the
-- "Full Training Assessment Session Packet" that 0013's lead_intake was
-- originally modeled on. It covers real ground the first document doesn't:
-- self-rated fitness level, a broader general health-history checklist,
-- goal-setting questions, food relationship detail, sleep/stress detail,
-- and an entire section on coaching/communication preferences. This adds
-- all of it as new columns, transcribed directly from the PDF (verified via
-- pdfminer layout-position extraction to correctly reconstruct the
-- checkbox grid reading order, not just linear text order).

alter table public.lead_intake
  -- Part 2 -- Your Body Right Now
  add column if not exists fitness_level text check (fitness_level in ('complete_beginner', 'some_experience', 'moderately_active', 'previously_very_active', 'athlete_competitive')),
  add column if not exists body_satisfaction_scale smallint check (body_satisfaction_scale between 1 and 10),
  add column if not exists strong_areas text,
  add column if not exists injuries_limitations text,

  -- Part 3 -- Your Health History (general checklist, distinct from the
  -- EDS-adjacent bones/joints checklist already captured in 0016)
  add column if not exists heart_condition boolean not null default false,
  add column if not exists high_blood_pressure boolean not null default false,
  add column if not exists diabetes boolean not null default false,
  add column if not exists thyroid_condition boolean not null default false,
  add column if not exists joint_issues boolean not null default false,
  add column if not exists asthma boolean not null default false,
  add column if not exists anxiety_depression boolean not null default false,
  add column if not exists eating_disorder_history boolean not null default false,
  add column if not exists pregnancy_postpartum boolean not null default false,

  -- Part 4 -- Your Goals
  add column if not exists goal_change_description text,
  add column if not exists goal_success_3_months text,
  add column if not exists goal_held_back_before text,
  add column if not exists goal_importance_scale smallint check (goal_importance_scale between 1 and 10),
  add column if not exists confidence_to_change_scale smallint check (confidence_to_change_scale between 1 and 10),

  -- Part 5 -- Your Relationship With Food (additions alongside the
  -- existing nutrition_relationship/nutrition_notes from 0013)
  add column if not exists foods_loved text,
  add column if not exists foods_scary text,
  add column if not exists diet_history text check (diet_history in ('never', 'once_or_twice', 'many_times', 'currently_on_one')),
  add column if not exists food_stress_scale smallint check (food_stress_scale between 1 and 10),

  -- Part 6 -- Your Lifestyle & Stress (additions alongside the existing
  -- stress_scale from 0013)
  add column if not exists average_sleep_hours text,
  add column if not exists sleep_duration_pattern text,
  add column if not exists stress_sources text,
  add column if not exists stress_coping text,

  -- Part 7 -- Training Structure & Support Preferences (entirely new
  -- section, not captured anywhere before)
  add column if not exists coaching_style text check (coaching_style in ('lots_of_encouragement', 'push_me_challenge_me', 'quiet_and_focused', 'flexible_read_my_mood')),
  add column if not exists feedback_style text check (feedback_style in ('direct_and_honest', 'mix_of_both', 'gentle_and_encouraging', 'mostly_positive_correct_big_issues')),
  add column if not exists contact_method text check (contact_method in ('text', 'email', 'call', 'reach_out_if_needed')),
  add column if not exists checkin_frequency text check (checkin_frequency in ('weekly', 'every_session_only', 'only_if_i_reach_out', 'not_at_all_session_time_only')),
  add column if not exists accountability_style text check (accountability_style in ('regular_checkins_from_mickey', 'tracking_own_progress', 'scheduled_sessions_enough', 'friendly_reminders_nudges')),
  add column if not exists past_coach_what_didnt_work text,

  -- Part 8 -- Anything Else
  add column if not exists anything_else text,
  add column if not exists referral_source text check (referral_source in ('friend_family', 'social_media', 'flyer', 'google', 'other'));
