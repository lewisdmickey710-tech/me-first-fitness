-- MeFirstFitness — v2 program system
-- Care profiles + a shared 3-day exercise library, per-client phase/cycle
-- tracking, measurements, and a coach/client edit trail.
--
-- Purely additive: no existing columns are dropped or renamed, and no new
-- column on `clients` is required. The old `track`/`phase` text columns and
-- the app's current UI keep working unchanged until the matching screens
-- are rebuilt against this new structure in a later deploy.

-- ============================================================
-- care_profiles
-- Replaces the old 13-track list as the thing that actually
-- drives exercise selection (general population, chronic
-- illness, postpartum, senior/fall-risk, rehab-forward,
-- medically conservative, ...). Real-world scheduling (days/
-- week, in-person vs virtual) lives on the client directly,
-- not baked into a profile.
-- ============================================================
create table if not exists public.care_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.care_profiles enable row level security;

create policy "care_profiles: any signed-in user reads"
  on public.care_profiles for select
  using (auth.uid() is not null);

create policy "care_profiles: coach writes"
  on public.care_profiles for all
  using (public.is_coach())
  with check (public.is_coach());

-- ============================================================
-- exercises
-- The shared movement library. client_description is the
-- longer how-to a client reads on their own; coach_cues are
-- the mechanical/in-session notes. regress_to/progress_to
-- point at the designated easier/harder swap for this
-- movement (used by the future client-facing swap feature).
-- ============================================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_description text,
  coach_cues text,
  regress_to_id uuid references public.exercises (id) on delete set null,
  progress_to_id uuid references public.exercises (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises: any signed-in user reads"
  on public.exercises for select
  using (auth.uid() is not null);

create policy "exercises: coach writes"
  on public.exercises for all
  using (public.is_coach())
  with check (public.is_coach());

-- ============================================================
-- program_days
-- The generic Day 1/2/3 slots for a care profile's phase.
-- Every care profile has exactly 3 strength days per phase;
-- day_label can differ by profile (e.g. "Legs & Glutes" vs
-- "Balance & Lower Body").
-- ============================================================
create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  phase text not null check (phase in ('1', '2', '3', '4')),
  day_number integer not null check (day_number between 1 and 3),
  day_label text not null,
  created_at timestamptz not null default now(),
  unique (care_profile_id, phase, day_number)
);

alter table public.program_days enable row level security;

create policy "program_days: any signed-in user reads"
  on public.program_days for select
  using (auth.uid() is not null);

create policy "program_days: coach writes"
  on public.program_days for all
  using (public.is_coach())
  with check (public.is_coach());

-- ============================================================
-- program_day_exercises
-- The exercises assigned to one program_day, in order.
-- superset_group holds an 'A'/'B' pairing label for phases 2
-- and 4; null for the flat phases 1 and 3.
-- ============================================================
create table if not exists public.program_day_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null default 0,
  superset_group text,
  sets text,
  reps text,
  created_at timestamptz not null default now()
);

alter table public.program_day_exercises enable row level security;

create policy "program_day_exercises: any signed-in user reads"
  on public.program_day_exercises for select
  using (auth.uid() is not null);

create policy "program_day_exercises: coach writes"
  on public.program_day_exercises for all
  using (public.is_coach())
  with check (public.is_coach());

-- ============================================================
-- client_phase_history
-- Tracks which phase a client is/was in and when, so phase
-- length can vary per client and the 16-week cycle can auto-
-- advance without a rigid fixed calendar. The row with
-- ended_on is null is the client's current phase.
-- ============================================================
create table if not exists public.client_phase_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  cycle_number integer not null default 1,
  phase text not null check (phase in ('1', '2', '3', '4')),
  started_on date not null default current_date,
  planned_weeks integer not null default 4,
  ended_on date,
  created_at timestamptz not null default now()
);

alter table public.client_phase_history enable row level security;

create policy "client_phase_history: coach full access"
  on public.client_phase_history for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_phase_history: client reads own"
  on public.client_phase_history for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_phase_history.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- client_program_overrides
-- Per-client edits to a program_day_exercise: a substitute
-- movement and/or different sets/reps. edited_by records who
-- made the change so the coach can see client-side edits at a
-- glance. Coach-only for now — client-initiated swaps (via the
-- regress_to/progress_to links) are a later feature; when that
-- ships this table gets a client insert policy constrained to
-- the exercise's own regress/progress targets.
-- ============================================================
create table if not exists public.client_program_overrides (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  program_day_exercise_id uuid not null references public.program_day_exercises (id) on delete cascade,
  substitute_exercise_id uuid references public.exercises (id),
  sets_override text,
  reps_override text,
  edited_by text not null check (edited_by in ('coach', 'client')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.client_program_overrides enable row level security;

create policy "client_program_overrides: coach full access"
  on public.client_program_overrides for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_program_overrides: client reads own"
  on public.client_program_overrides for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_program_overrides.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- measurements
-- ============================================================
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  weight numeric,
  neck numeric,
  chest numeric,
  waist numeric,
  hips numeric,
  thigh_l numeric,
  thigh_r numeric,
  bicep_l numeric,
  bicep_r numeric,
  notes text,
  logged_by text not null default 'coach' check (logged_by in ('coach', 'client')),
  created_at timestamptz not null default now()
);

alter table public.measurements enable row level security;

create policy "measurements: coach full access"
  on public.measurements for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "measurements: client reads own"
  on public.measurements for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = measurements.client_id and c.user_id = auth.uid()
    )
  );

create policy "measurements: client inserts own"
  on public.measurements for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = measurements.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- clients: new columns for the v2 model. All nullable — existing
-- rows (still driven by the old track/phase columns) are
-- unaffected until a client is migrated onto a care profile.
-- ============================================================
alter table public.clients
  add column if not exists care_profile_id uuid references public.care_profiles (id),
  add column if not exists days_per_week integer check (days_per_week between 1 and 3),
  add column if not exists session_mode text check (session_mode in ('in_person', 'virtual', 'mixed'));

-- ============================================================
-- seed: starting care profiles. Safe to re-run.
-- ============================================================
insert into public.care_profiles (name, description) values
  ('General Population', 'No ongoing medical complexity — standard 4-phase progression.'),
  ('Chronic Illness Support', 'Extra-care pacing for EDS, POTS, MCAS, autoimmune, and similar conditions.'),
  ('Postpartum Recovery', 'Pelvic floor and core reconnection informs early programming.'),
  ('Senior & Balance-Focused', 'Functional independence and fall-risk reduction as the primary goal, regardless of age.'),
  ('Rehab-Forward', 'Active injury or post-rehab — pain-led, mobility-first programming.'),
  ('Medically Conservative', 'Stays stability-forward long-term for compounding medical complexity (bone density, surgical history, etc.).')
on conflict (name) do nothing;
