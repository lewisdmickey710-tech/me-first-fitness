-- Lets the coach leave a client-visible emoji and/or text reply on a
-- specific logged workout (session or activity) or nutrition entry --
-- deliberately separate from the existing coach_notes columns on
-- sessions/activities, which are coach's-eyes-only by design (see
-- comments in src/app/client/*). One reply per item (upsertable, not a
-- thread), referenced generically via item_type + item_id rather than a
-- column on each of three different tables.
create table if not exists public.coach_item_replies (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('session', 'activity', 'nutrition')),
  item_id uuid not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  emoji text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id),
  check (emoji is not null or note is not null)
);

create index if not exists coach_item_replies_client_id_idx
  on public.coach_item_replies (client_id);

alter table public.coach_item_replies enable row level security;

create policy "coach_item_replies: coach full access"
  on public.coach_item_replies for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "coach_item_replies: client reads own"
  on public.coach_item_replies for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = coach_item_replies.client_id and c.user_id = auth.uid()
    )
  );

-- Dedup guard for the daily "good morning" digest push, same shape as
-- the existing weekly digest's last_digest_email_sent_on.
alter table public.business_settings
  add column if not exists last_morning_digest_sent_on date;
