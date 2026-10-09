-- "Flex" clients: no standing weekly client_schedules row, booking a
-- time via a fresh request most weeks instead -- a real, nameable
-- category the coach wants visible (roster badge) rather than looking
-- like an ordinary client who just hasn't settled in yet. Pricing stays
-- on the existing clients.session_rate field (already editable, already
-- what pre-fills a logged session's payment amount) -- this flag is
-- purely the "make it notable" label, not a second pricing mechanism.
alter table public.clients
  add column if not exists flex_scheduling boolean not null default false;

-- Replies were originally allowed on sessions, activities, and nutrition
-- logs; narrowed to just the things a client does on their own between
-- sessions (activities, nutrition) -- a coach reply on a session she
-- logged herself doesn't make sense to begin with.
alter table public.coach_item_replies
  drop constraint if exists coach_item_replies_item_type_check,
  add constraint coach_item_replies_item_type_check
  check (item_type in ('activity', 'nutrition'));
