-- Self-led clients: someone who bought the standalone program with no
-- ongoing coaching. They get a real roster profile (under session_mode
-- 'virtual', same as any async client) tagged self_led so the coach can
-- tell them apart, track when she last checked on them, and get flagged
-- if it's been a while -- rather than a separate delivery mechanism, this
-- is deliberately the same profile shape a virtual/in-person client has,
-- so opting them into full coaching later is just clearing the flag.
alter table public.clients
  add column if not exists self_led boolean not null default false,
  add column if not exists self_led_last_checkin date;

-- Lets the roster's "no check-in in N+ days" flag for a self-led client be
-- dismissed/overridden the same way inactive/high_risk/session_not_logged
-- already can be.
alter table public.client_flag_overrides
  drop constraint if exists client_flag_overrides_flag_key_check,
  add constraint client_flag_overrides_flag_key_check
    check (flag_key in ('inactive', 'high_risk', 'session_not_logged', 'self_led_no_checkin'));
