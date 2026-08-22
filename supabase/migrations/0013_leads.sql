-- Leads: prospective clients who requested an assessment through the
-- public "Request an Assessment" page. Distinct from `clients` (the real
-- roster) -- a lead lives here until you convert them.
--
-- The two-part assessment structure (written intake questionnaire +
-- in-person movement screening across 6 functional patterns) is pulled
-- directly from the real Pre-Assessment Packet and Assessment Packet build
-- scripts, not invented.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('coach', 'client', 'lead'));

-- ============================================================
-- leads
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  note text,
  status text not null default 'new' check (status in ('new', 'converted', 'archived')),
  converted_client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "leads: coach full access"
  on public.leads for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "leads: lead reads own"
  on public.leads for select
  using (user_id = auth.uid());

-- ============================================================
-- lead_assessment_requests
-- Mirrors the `requests` table clients use, but for a lead's
-- initial assessment (a request the coach confirms -- never a
-- self-service booking calendar, per how the existing time-
-- request flow already works).
-- ============================================================
create table if not exists public.lead_assessment_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  preferred_date date not null,
  preferred_time time,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.lead_assessment_requests enable row level security;

create policy "lead_assessment_requests: coach full access"
  on public.lead_assessment_requests for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "lead_assessment_requests: lead reads own"
  on public.lead_assessment_requests for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_assessment_requests.lead_id and l.user_id = auth.uid()
    )
  );

create policy "lead_assessment_requests: lead inserts own"
  on public.lead_assessment_requests for insert
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_assessment_requests.lead_id and l.user_id = auth.uid()
    )
  );

-- ============================================================
-- lead_intake
-- The written pre-assessment questionnaire, one row per lead,
-- filled out by the lead themselves after logging in. Field set
-- matches the real Pre-Assessment Packet exactly.
-- ============================================================
create table if not exists public.lead_intake (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads (id) on delete cascade,

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

  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lead_intake enable row level security;

create policy "lead_intake: coach full access"
  on public.lead_intake for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "lead_intake: lead reads own"
  on public.lead_intake for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_intake.lead_id and l.user_id = auth.uid()
    )
  );

create policy "lead_intake: lead inserts own"
  on public.lead_intake for insert
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_intake.lead_id and l.user_id = auth.uid()
    )
  );

create policy "lead_intake: lead updates own"
  on public.lead_intake for update
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_intake.lead_id and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_intake.lead_id and l.user_id = auth.uid()
    )
  );

-- ============================================================
-- lead_movement_screenings + results
-- The in-person movement screening you record -- coach-only
-- (clinical assessment notes; not surfaced to the lead directly,
-- consistent with never handing over raw scoring/pain-flag
-- language without you framing it in conversation).
-- ============================================================
create table if not exists public.lead_movement_screenings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  date date not null default current_date,
  modifications_observations text,
  coach_notes text,
  created_at timestamptz not null default now()
);

alter table public.lead_movement_screenings enable row level security;

create policy "lead_movement_screenings: coach full access"
  on public.lead_movement_screenings for all
  using (public.is_coach())
  with check (public.is_coach());

create table if not exists public.lead_movement_screening_results (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.lead_movement_screenings (id) on delete cascade,
  movement text not null check (movement in ('squat', 'deadlift_hinge', 'lunge', 'push_up', 'plank', 'row')),
  score smallint check (score between 0 and 3),
  pain boolean not null default false,
  plan text check (plan in ('regress', 'maintain', 'progress')),
  notes text,
  unique (screening_id, movement)
);

alter table public.lead_movement_screening_results enable row level security;

create policy "lead_movement_screening_results: coach full access"
  on public.lead_movement_screening_results for all
  using (public.is_coach())
  with check (public.is_coach());
