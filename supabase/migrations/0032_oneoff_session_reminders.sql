-- The day-before session reminder email only ever checked recurring
-- client_schedules -- a one-off confirmed request (session_occurrences
-- with status = 'scheduled', no backing recurring schedule) never got a
-- reminder. session_reminders_log can't be reused as-is (client_schedule_id
-- is not null there), so this tracks it directly on the occurrence row
-- instead, same pattern as payments.reminder_sent_at.
alter table public.session_occurrences
  add column if not exists reminder_sent_at timestamptz;
