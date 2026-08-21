-- MeFirstFitness coaching app — initial schema + RLS
-- Run this against a fresh Supabase project (SQL editor, or `supabase db push`).

-- ============================================================
-- profiles
-- One row per authenticated user (coach or client), used to
-- drive role-aware routing and RLS. Created automatically for
-- every new auth.users row via trigger below.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('coach', 'client')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Every signed-in user can read their own profile (needed to know
-- whether to route them to /coach or /client after login).
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

-- ============================================================
-- helper: is_coach()
-- security definer so it can read profiles regardless of the
-- caller's own RLS visibility, without recursing into profiles'
-- own policies.
-- ============================================================
create or replace function public.is_coach()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

-- ============================================================
-- clients
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  track text not null,
  phase text not null default 'n/a',
  sessions_allotted integer,
  notes text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

alter table public.clients enable row level security;

create policy "clients: coach full access"
  on public.clients for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "clients: client reads own row"
  on public.clients for select
  using (user_id = auth.uid());

-- ============================================================
-- sessions (coach-logged training sessions)
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  day_label text not null,
  date date not null,
  entries jsonb not null default '[]'::jsonb, -- [{exercise, sets, reps, weight}]
  rating integer check (rating between 1 and 5),
  day_notes text,
  logged_by text not null default 'coach',
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "sessions: coach full access"
  on public.sessions for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "sessions: client reads own"
  on public.sessions for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = sessions.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- checkins
-- ============================================================
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  sleep text,
  water text,
  food text,
  energy text,
  mood text,
  notes text,
  logged_by text not null default 'client' check (logged_by in ('coach', 'client')),
  created_at timestamptz not null default now()
);

alter table public.checkins enable row level security;

create policy "checkins: coach full access"
  on public.checkins for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "checkins: client reads own"
  on public.checkins for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = checkins.client_id and c.user_id = auth.uid()
    )
  );

create policy "checkins: client inserts own"
  on public.checkins for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = checkins.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- activities (out-of-session activity, client self-logged)
-- ============================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  type text not null,
  duration text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "activities: coach full access"
  on public.activities for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "activities: client reads own"
  on public.activities for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = activities.client_id and c.user_id = auth.uid()
    )
  );

create policy "activities: client inserts own"
  on public.activities for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = activities.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- requests (client-proposed session times)
-- ============================================================
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  preferred_date date not null,
  preferred_time time,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;

create policy "requests: coach full access"
  on public.requests for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "requests: client reads own"
  on public.requests for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = requests.client_id and c.user_id = auth.uid()
    )
  );

create policy "requests: client inserts own"
  on public.requests for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = requests.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- new-user trigger: create a profiles row on signup, defaulting
-- to 'client'. Promote the coach to role='coach' manually after
-- their first login (see README) — there's only ever one coach.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
