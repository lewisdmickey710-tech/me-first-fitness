-- Dedup guard for the day-before class/workshop reminder, same shape as
-- session_occurrences.reminder_sent_at -- a single nullable timestamp
-- rather than a separate log table, since each event only ever needs one.
alter table public.coach_events
  add column if not exists reminder_sent_at timestamptz;
