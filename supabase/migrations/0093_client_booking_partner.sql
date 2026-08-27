-- "Semi-merged" clients -- two separate clients (own care profile, own
-- phase, own program, own everything else) who always attend sessions
-- together and are treated as a pair for booking purposes only. Setting
-- partner_client_id on one side is expected to always be mirrored on the
-- other (enforced in application code, via setClientPartner) rather than
-- with a DB constraint, since a one-way link would be a bug either way.
alter table public.clients
  add column if not exists partner_client_id uuid references public.clients (id) on delete set null;
