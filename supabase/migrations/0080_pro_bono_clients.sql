-- Marks a client as pro bono (charity work) -- payment reminder emails
-- and late-cancellation fees are skipped for them entirely, but
-- pro_bono_rate lets the coach record what a session is actually worth
-- so the value of that work is still tracked, just never charged.
alter table public.clients
  add column if not exists pro_bono boolean not null default false,
  add column if not exists pro_bono_rate numeric(10,2);
