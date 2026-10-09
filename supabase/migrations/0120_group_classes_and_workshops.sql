-- Group classes and workshops: one-off events the coach schedules on her
-- own calendar (distinct from 1:1 sessions), each one reserving its time
-- window the same way any other blocked time does -- via a linked
-- coach_blocked_dates row -- so clients simply can't request a 1:1
-- session into it. visible_to_clients is a separate, coach-controlled
-- flag: creating the event always blocks the time, but it's only shown
-- on a client's schedule once she opts to share it. No self-serve sign-up
-- or payment yet -- a client just expresses interest (see below) and she
-- follows up herself.
create table if not exists public.coach_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('class', 'workshop')),
  title text not null,
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  pdf_path text,
  visible_to_clients boolean not null default false,
  blocked_date_id uuid references public.coach_blocked_dates (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists coach_events_event_date_idx
  on public.coach_events (event_date);

alter table public.coach_events enable row level security;

create policy "coach_events: coach full access"
  on public.coach_events for all
  using (public.is_coach())
  with check (public.is_coach());

-- Clients-only for now, not the public -- only a signed-in user with a
-- clients row can see a shared event, and only once it's shared.
create policy "coach_events: client reads shared"
  on public.coach_events for select
  using (
    visible_to_clients
    and exists (select 1 from public.clients c where c.user_id = auth.uid())
  );

-- Private bucket, coach-only write -- same shape as the existing
-- "packets" bucket. Reads (for a client viewing a shared event's PDF) go
-- through a server-generated signed URL, not a client-facing storage
-- policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('class-pdfs', 'class-pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "class-pdfs: coach full access"
  on storage.objects for all
  using (bucket_id = 'class-pdfs' and public.is_coach())
  with check (bucket_id = 'class-pdfs' and public.is_coach());

-- A client tapping "I'm interested" on a shared class/workshop reuses the
-- existing requests table/inbox (same place reschedule and video-session
-- requests already land) rather than a brand new mechanism. event_id
-- links it to the specific event; confirming or declining it never
-- touches session_occurrences the way a real session request does.
alter table public.requests
  add column if not exists event_id uuid references public.coach_events (id) on delete cascade;

alter table public.requests
  drop constraint if exists requests_request_type_check,
  add constraint requests_request_type_check
  check (request_type in ('session', 'checkin_call', 'video_session', 'class_interest'));
