-- The service check-in prompt was only ever a passive dashboard card --
-- easy to scroll past and miss entirely (confirmed: it happened). Gives it
-- the same active-nudge treatment as pending documents: an email when it's
-- actually due (a measurement was logged this month but the check-in
-- wasn't yet), with the same cooldown-tracking pattern.
alter table public.clients
  add column if not exists last_service_checkin_nudge_sent_at timestamptz;
