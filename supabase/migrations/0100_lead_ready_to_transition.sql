-- A lead on a Test the Waters preview can press "Unlock Our Partnership"
-- themselves to signal they're ready -- this just flags the row so it
-- surfaces on the coach's "Waiting to Transition" sub-tab; the coach still
-- does the actual convert-to-client step herself. Covered by the existing
-- "leads: lead updates own" policy from 0024 (the protected-fields guard
-- trigger only blocks status/converted_client_id/user_id, not this).
alter table public.leads
  add column if not exists ready_to_transition boolean not null default false,
  add column if not exists ready_to_transition_at timestamptz;
