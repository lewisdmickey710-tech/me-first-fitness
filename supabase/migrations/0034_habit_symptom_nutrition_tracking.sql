-- Optional client-side tracking tools, separate from the coaching-driven
-- checkins/measurements: (1) a habit tracker for whatever the client wants
-- to build consistency on, (2) a symptom log clients can keep for their own
-- doctor/PT visits (private by default -- each entry has its own
-- shared_with_coach flag, since medical detail isn't something a coach
-- should see unless the client chooses to surface it), and (3) a nutrition
-- log flexible enough to support both non-diet tracking (meals,
-- hunger/fullness, satisfaction) and numeric macro counting, matching the
-- "choose your nutrition coaching style" options already in the Wellness
-- guide -- every field here is optional so a client uses whichever style
-- fits them.

create table if not exists public.client_habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.client_habits (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create table if not exists public.client_symptom_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  log_date date not null default current_date,
  symptom text not null,
  severity integer check (severity between 1 and 5),
  notes text,
  shared_with_coach boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.client_nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  log_date date not null default current_date,
  meal_label text,
  description text,
  hunger_before integer check (hunger_before between 1 and 10),
  fullness_after integer check (fullness_after between 1 and 10),
  satisfaction integer check (satisfaction between 1 and 5),
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.client_habits enable row level security;
alter table public.client_habit_logs enable row level security;
alter table public.client_symptom_logs enable row level security;
alter table public.client_nutrition_logs enable row level security;

-- Habits: coach can see them (useful training context), client manages
-- their own fully.
create policy "client_habits: coach full access"
  on public.client_habits for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_habits: client manages own"
  on public.client_habits for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_habits.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_habits.client_id and c.user_id = auth.uid()
    )
  );

create policy "client_habit_logs: coach full access"
  on public.client_habit_logs for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_habit_logs: client manages own"
  on public.client_habit_logs for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_habit_logs.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_habit_logs.client_id and c.user_id = auth.uid()
    )
  );

-- Symptoms: client fully owns their entries. Coach only ever sees a row
-- once the client flips shared_with_coach on it -- no coach write access
-- at all, this stays entirely the client's call.
create policy "client_symptom_logs: client manages own"
  on public.client_symptom_logs for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_symptom_logs.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_symptom_logs.client_id and c.user_id = auth.uid()
    )
  );

create policy "client_symptom_logs: coach reads shared"
  on public.client_symptom_logs for select
  using (public.is_coach() and shared_with_coach = true);

-- Nutrition: part of the coaching relationship (Mickey is a certified
-- nutritionist), so coach gets the same full visibility as checkins.
create policy "client_nutrition_logs: coach full access"
  on public.client_nutrition_logs for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_nutrition_logs: client manages own"
  on public.client_nutrition_logs for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_nutrition_logs.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_nutrition_logs.client_id and c.user_id = auth.uid()
    )
  );
