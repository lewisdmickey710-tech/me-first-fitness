-- Milestones the coach sets up for a client to look forward to and
-- celebrate hitting (a first pain-free week, a strength number, 3 months
-- in, whatever fits) -- coach-managed since these represent things Mickey
-- is deliberately setting up for the client, distinct from the
-- client-authored habit tracker. Achieving one triggers a congratulatory
-- email (see sendMilestoneAchievedEmail) -- the "celebrate with them" part.
create table if not exists public.client_milestones (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  notes text,
  target_date date,
  achieved_at timestamptz,
  achieved_note text,
  created_at timestamptz not null default now()
);

alter table public.client_milestones enable row level security;

create policy "client_milestones: coach full access"
  on public.client_milestones for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_milestones: client reads own"
  on public.client_milestones for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_milestones.client_id and c.user_id = auth.uid()
    )
  );
