-- Logging a session and marking it "paid" (sessions.payment_status) never
-- created anything in the payments table -- that field is a lightweight
-- per-session status flag for pay-as-you-go clients (see payment-status.ts:
-- monthly/scheduled clients are tracked via payments, pay-as-you-go via
-- this column instead). Since Finances' Year-to-date income is built
-- entirely from payments.paid_on, a pay-as-you-go client's income was
-- invisible there no matter how many sessions got marked paid.
--
-- This column links a logged session to the payments row it generated, so
-- logSession/updateSession can keep one in sync with the other (create it
-- when payment_status becomes "paid", update its amount/date on edit,
-- delete it if payment_status is changed away from "paid").
alter table public.sessions
  add column if not exists payment_id uuid references public.payments (id) on delete set null;

-- Backfill: every already-logged session marked "paid" before this existed
-- gets a matching payments row now, using the client's session_rate as the
-- amount. Clients with no session_rate on file are skipped -- there's no
-- safe amount to guess, and coalesce-filling a wrong number into real
-- income would be worse than leaving it for the coach to fix by hand.
do $$
declare
  r record;
  new_payment_id uuid;
begin
  for r in
    select s.id as session_id, s.client_id, s.date, c.session_rate
    from public.sessions s
    join public.clients c on c.id = s.client_id
    where s.payment_status = 'paid'
      and s.payment_id is null
      and c.session_rate is not null
  loop
    insert into public.payments (client_id, description, amount, due_date, paid_on, kind)
    values (r.client_id, 'Session — ' || r.date, r.session_rate, r.date, r.date, 'session')
    returning id into new_payment_id;

    update public.sessions set payment_id = new_payment_id where id = r.session_id;
  end loop;
end $$;
