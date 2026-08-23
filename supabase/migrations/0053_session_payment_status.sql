-- Replace the paid/not-paid boolean with a three-state status so a coach
-- can log "this session was free" (waived) distinctly from "not paid yet" --
-- a waived session shouldn't ever show up as money owed.
alter table public.sessions
  add column if not exists payment_status text
    check (payment_status in ('paid', 'unpaid', 'waived'));

update public.sessions
  set payment_status = case
    when payment_made = true then 'paid'
    when payment_made = false then 'unpaid'
    else null
  end
  where payment_status is null;

alter table public.sessions drop column if exists payment_made;
