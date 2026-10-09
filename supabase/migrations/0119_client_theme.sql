-- Lets a client pick their own accent color for their own view of the app
-- (buttons, links, nav highlights) -- independent of the phase colors
-- (teal/pink/green/gold), which stay fixed for everyone since they carry
-- real meaning (Stability/Strength/Size/Power), not just decoration.
alter table public.clients
  add column if not exists theme text not null default 'rose';

alter table public.clients
  add constraint clients_theme_check
  check (theme = any (array['rose'::text, 'ocean'::text, 'slate'::text, 'amber'::text]));
