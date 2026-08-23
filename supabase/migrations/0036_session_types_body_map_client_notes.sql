-- Not every session is a structured workout -- some are pulled straight
-- from the program, some are freestyled, and plenty are pure conversation,
-- recovery work (foam rolling, stretching, Theragun), or a measurements /
-- movement screening check-in. session_type records which one so the log
-- form can show the right fields and history can reflect what actually
-- happened, not just exercise rows.
--
-- body_map holds point-and-click markers on a body diagram (front/back,
-- x/y percent position, a 1-3 color level matching the habit tracker's
-- teal/gold/pink scale, and a short label) so a coach can flag pain,
-- tightness, or numbness at a specific spot during a session -- separate
-- from the freeform day_notes text.
alter table public.sessions
  add column if not exists session_type text not null default 'freestyle'
    check (session_type in ('program', 'freestyle', 'conversation', 'recovery', 'assessment')),
  add column if not exists body_map jsonb;

-- General, running per-client notes -- distinct from day_notes (which are
-- tied to one specific logged workout). This is an append-only log
-- (injuries, preferences, longer-term observations) that isn't meant to be
-- overwritten the way a single "client notes" text field would be, and it
-- stays coach-only -- no client read policy, unlike day_notes which
-- clients already see on their own session history.
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.client_notes enable row level security;

create policy "client_notes: coach full access"
  on public.client_notes for all
  using (public.is_coach())
  with check (public.is_coach());
