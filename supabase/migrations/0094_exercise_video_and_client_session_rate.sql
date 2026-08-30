-- A demo video link per exercise (typically YouTube), shown to clients
-- alongside the written description/cues.
alter table public.exercises
  add column if not exists video_url text;

-- A coach-set, negotiated per-session rate override -- friends & family
-- pricing, a shorter session, or any other one-off deal. Null means "my
-- standard rate", nothing here is client-facing or self-service; it just
-- reminds the coach and pre-fills the amount when she adds a payment.
alter table public.clients
  add column if not exists session_rate numeric(10,2);
