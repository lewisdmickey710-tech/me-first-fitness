-- Tracks the last time the coach opened a given client's profile, so
-- purely informational flags on the Motherboard (a recent cancellation, a
-- just-signed document) can clear themselves once she's actually seen
-- them, while flags that still need an action (a pending request, an
-- unpaid fee) keep showing regardless of whether she's looked.
alter table public.clients
  add column if not exists last_viewed_at timestamptz;
