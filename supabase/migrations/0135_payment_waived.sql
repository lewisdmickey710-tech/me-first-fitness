-- Lets the coach waive any payment row outright -- a session fee, a late
-- cancellation fee, a hold/retainer fee, anything in `payments` -- as
-- distinct from marking it paid (which would wrongly count it as real
-- income). A waived payment keeps paid_on null forever; every "unpaid" /
-- "overdue" / "due" check across the app needs to also check this column
-- is null before treating a payment as still outstanding.
alter table public.payments
  add column waived_on timestamptz;
