-- Three additions from the same round of business-model changes:
--
-- 1. Membership hold/retainer: a client who wants their spot reserved
--    without training pays a flat $10/week retainer (kept in application
--    code as RETAINER_FEE_PER_WEEK in src/lib/retainer.ts, same convention
--    as the late-cancellation fee constants). clients.hold_started_at
--    non-null means currently on hold; the coach starts/ends it (client
--    self-service isn't offered here, so it stays in the protected-fields
--    guard). The weekly payment is created by the coach when hold starts
--    and then rolled forward by the existing daily cron.
--
-- 2. Virtual-async coaching: a new session_mode for fully-virtual clients
--    who get programming updated on the coach's own cadence instead of
--    per-session video calls. No new scheduling machinery needed -- these
--    clients simply have no client_schedules rows. clients.program_last_updated_at
--    is bumped by the coach (also protected) whenever she updates their
--    program, and drives a "Program last updated" card on their dashboard
--    in place of a next-session card.
--
-- 3. Bookable 30-minute check-in calls, for any client type (including
--    in-person). Reuses the existing requests/session_occurrences request
--    flow end to end (date/time picking, availability + conflict checks,
--    reminders) -- request_type just distinguishes it from a normal
--    session request while it's pending, so the coach knows what she's
--    confirming. Once confirmed it becomes an ordinary one-off scheduled
--    occurrence like any other, no different from a regular session.

alter table public.clients
  add column if not exists hold_started_at timestamptz,
  add column if not exists program_last_updated_at timestamptz;

alter table public.clients
  drop constraint if exists clients_session_mode_check,
  add constraint clients_session_mode_check
    check (session_mode in ('in_person', 'virtual', 'mixed', 'virtual_async'));

alter table public.payments
  drop constraint if exists payments_kind_check,
  add constraint payments_kind_check
    check (kind in ('session', 'late_cancellation_fee', 'retainer'));

alter table public.requests
  add column if not exists request_type text not null default 'session'
    check (request_type in ('session', 'checkin_call'));

-- hold_started_at and program_last_updated_at are coach-set only.
create or replace function public.clients_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if new.user_id is distinct from old.user_id
      or new.care_profile_id is distinct from old.care_profile_id
      or new.days_per_week is distinct from old.days_per_week
      or new.session_mode is distinct from old.session_mode
      or new.sessions_allotted is distinct from old.sessions_allotted
      or new.notes is distinct from old.notes
      or new.track is distinct from old.track
      or new.phase is distinct from old.phase
      or new.start_date is distinct from old.start_date
      or new.primary_goal is distinct from old.primary_goal
      or new.secondary_goal is distinct from old.secondary_goal
      or new.key_health_notes is distinct from old.key_health_notes
      or new.hold_started_at is distinct from old.hold_started_at
      or new.program_last_updated_at is distinct from old.program_last_updated_at
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;
