-- Phase-level coaching guidance per care profile: a headline, coach tips,
-- extra-care/red-flag notes, and cardio guidance. Distinct from per-exercise
-- coach_cues on `exercises` -- this is guidance for the whole phase
-- regardless of which day/exercise a client is on (e.g. "any doming or
-- bulging along the midline means stop and regress immediately," or
-- "walking, 2-3x/week, 15-20 min to start"). Coach-only content, same
-- pattern as exercises.coach_cues -- readable via RLS by any signed-in
-- user, but only coach-facing screens render it.

create table if not exists public.care_profile_phase_notes (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  phase text not null check (phase in ('1', '2', '3', '4')),
  headline text,
  coach_tips text,
  extra_care text,
  cardio_guidance text,
  created_at timestamptz not null default now(),
  unique (care_profile_id, phase)
);

alter table public.care_profile_phase_notes enable row level security;

create policy "care_profile_phase_notes: any signed-in user reads"
  on public.care_profile_phase_notes for select
  using (auth.uid() is not null);

create policy "care_profile_phase_notes: coach writes"
  on public.care_profile_phase_notes for all
  using (public.is_coach())
  with check (public.is_coach());
