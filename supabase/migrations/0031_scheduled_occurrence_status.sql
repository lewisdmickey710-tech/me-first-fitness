-- Confirming a plain "request time" (not tied to an existing session --
-- see requests.reschedule_from_date) previously only flipped a status flag
-- on the request itself; nothing else in the app reflected it anywhere,
-- so from the coach's side confirming looked like it did nothing. Adds a
-- 'scheduled' status so confirming a request can create a real one-off
-- session_occurrences row for that date -- both the coach's aggregate
-- schedule calendar and the client's own calendar already render
-- whatever status is on a row for a given date, so this alone makes the
-- confirmed date actually show up everywhere, with no other changes
-- needed to either calendar.
alter table public.session_occurrences
  drop constraint session_occurrences_status_check,
  add constraint session_occurrences_status_check
    check (status in ('scheduled', 'completed', 'rescheduled', 'cancelled', 'late_cancelled'));
