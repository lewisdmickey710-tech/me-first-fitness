-- Per-session payment flag for pay-as-you-go clients, who pay in cash/
-- Cash App/Zelle as they go rather than against a scheduled invoice (the
-- existing `payments` table is for the monthly/invoice schedule). Only
-- ever set from the coach's Log Session form, never from a client's own
-- self-logged session -- null means "not recorded / not applicable",
-- not "unpaid", so self-logged sessions never get misread as unpaid.
alter table public.sessions
  add column if not exists payment_made boolean;
