-- The same real intake questionnaire content built for leads (0013, 0016,
-- 0017 -- the Full Training Assessment Session Packet + Pre-Assessment
-- Questionnaire, both from real MeFirstFitness PDFs) made available to
-- clients directly, for existing clients who never went through the
-- lead/assessment pipeline. Deliberately its own table rather than reusing
-- lead_intake with a nullable client_id: a lead and a client are different
-- lifecycle stages, and RLS/ownership rules read more clearly kept
-- separate. Column set is an exact mirror of lead_intake's current shape.
--
-- When a lead converts to a client (see convertLeadToClient), their
-- existing lead_intake answers get copied into a new client_intake row so
-- they aren't asked to redo the whole questionnaire.

create table if not exists public.client_intake (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,

  date_of_birth date,
  why_here text,
  why_worthwhile text,

  fall_past_year boolean not null default false,
  near_fall boolean not null default false,
  fear_of_falling boolean not null default false,
  balance_notes text,

  osteoporosis boolean not null default false,
  joint_replacement boolean not null default false,
  arthritis boolean not null default false,
  hypermobility boolean not null default false,
  pots_dysautonomia boolean not null default false,
  mcas boolean not null default false,
  autoimmune_condition boolean not null default false,
  bones_notes text,

  medications text,
  doctor_name text,
  medical_clearance text check (medical_clearance in ('have_clearance', 'in_progress', 'not_needed')),

  lives_alone boolean not null default false,
  drives_self boolean not null default false,
  stairs_daily boolean not null default false,
  day_to_day_notes text,

  pain_location text,
  pain_duration text,
  pain_better text,
  pain_worse text,
  pain_type text[],

  energy_scale smallint check (energy_scale between 1 and 10),
  sleep_scale smallint check (sleep_scale between 1 and 10),
  stress_scale smallint check (stress_scale between 1 and 10),
  confidence_scale smallint check (confidence_scale between 1 and 10),

  nutrition_relationship text check (nutrition_relationship in ('comfortable', 'complicated', 'actively_working', 'rather_not_say')),
  nutrition_notes text,

  support_system text,
  competing_demands text,

  fitness_level text check (fitness_level in ('complete_beginner', 'some_experience', 'moderately_active', 'previously_very_active', 'athlete_competitive')),
  body_satisfaction_scale smallint check (body_satisfaction_scale between 1 and 10),
  strong_areas text,
  injuries_limitations text,

  heart_condition boolean not null default false,
  high_blood_pressure boolean not null default false,
  diabetes boolean not null default false,
  thyroid_condition boolean not null default false,
  joint_issues boolean not null default false,
  asthma boolean not null default false,
  anxiety_depression boolean not null default false,
  eating_disorder_history boolean not null default false,
  pregnancy_postpartum boolean not null default false,

  goal_change_description text,
  goal_success_3_months text,
  goal_held_back_before text,
  goal_importance_scale smallint check (goal_importance_scale between 1 and 10),
  confidence_to_change_scale smallint check (confidence_to_change_scale between 1 and 10),

  foods_loved text,
  foods_scary text,
  diet_history text check (diet_history in ('never', 'once_or_twice', 'many_times', 'currently_on_one')),
  food_stress_scale smallint check (food_stress_scale between 1 and 10),

  average_sleep_hours text,
  sleep_duration_pattern text,
  stress_sources text,
  stress_coping text,

  coaching_style text check (coaching_style in ('lots_of_encouragement', 'push_me_challenge_me', 'quiet_and_focused', 'flexible_read_my_mood')),
  feedback_style text check (feedback_style in ('direct_and_honest', 'mix_of_both', 'gentle_and_encouraging', 'mostly_positive_correct_big_issues')),
  contact_method text check (contact_method in ('text', 'email', 'call', 'reach_out_if_needed')),
  checkin_frequency text check (checkin_frequency in ('weekly', 'every_session_only', 'only_if_i_reach_out', 'not_at_all_session_time_only')),
  accountability_style text check (accountability_style in ('regular_checkins_from_mickey', 'tracking_own_progress', 'scheduled_sessions_enough', 'friendly_reminders_nudges')),
  past_coach_what_didnt_work text,

  anything_else text,
  referral_source text check (referral_source in ('friend_family', 'social_media', 'flyer', 'google', 'other')),

  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.client_intake enable row level security;

create policy "client_intake: coach full access"
  on public.client_intake for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_intake: client manages own"
  on public.client_intake for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_intake.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_intake.client_id and c.user_id = auth.uid()
    )
  );
