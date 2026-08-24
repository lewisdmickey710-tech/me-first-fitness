-- Blocking a day already sends an immediate email to anyone it actually
-- cancels a session for (sendDayBlockedEmail, in blockDate). This adds
-- the second half Mickey asked for: a reminder as the date approaches,
-- for anyone whose recurring day falls on it, so it doesn't just get
-- forgotten if it was blocked weeks out. Sent once per (client, date) --
-- this log is what prevents re-sending it every day within the lookahead
-- window -- and consolidated into one email per client covering every
-- qualifying date found in a single run, rather than one email per date.
create table if not exists public.blocked_date_reminders_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  blocked_date date not null,
  sent_at timestamptz not null default now(),
  unique (client_id, blocked_date)
);

alter table public.blocked_date_reminders_log enable row level security;

create policy "blocked_date_reminders_log: coach full access"
  on public.blocked_date_reminders_log for all
  using (public.is_coach())
  with check (public.is_coach());
