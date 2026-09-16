-- The weekly digest: one glanceable card per virtual client summarizing
-- their last 7 days (sessions, check-ins, habits, measurements, how stale
-- their program is) instead of clicking into each profile cold.
--
-- digest_reviewed_at is deliberately separate from program_last_updated_at
-- -- reviewing a client and deciding nothing needs to change is a real,
-- distinct outcome from actually editing their program, and conflating the
-- two would make "last updated" lie about whether the program itself
-- changed.
alter table public.clients
  add column if not exists digest_reviewed_at timestamptz;

-- Dedup guard for the weekly nudge email -- the reminders cron runs daily,
-- so without this a retried or double-triggered run could send the digest
-- nudge more than once in the same week.
alter table public.business_settings
  add column if not exists last_digest_email_sent_on date;
