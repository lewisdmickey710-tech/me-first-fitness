-- A reduced-service arrangement for a client who can't keep up weekly/
-- monthly-virtual billing: she comes in person roughly once a month for
-- measurements/updates and pays per visit (session_mode 'in_person',
-- payment_schedule 'pay_as_you_go'), with no recurring access fee and no
-- standing weekly schedule otherwise. Tagged separately from that combo
-- of fields so the app can tell "genuinely low-cadence, by design" apart
-- from a regular in-person pay-as-you-go client and stop flagging her as
-- inactive/at-risk or nudging her to track between visits -- same idea as
-- self_led getting its own longer check-in window, not a stricter one.
alter table public.clients
  add column if not exists monthly_checkin boolean not null default false;
