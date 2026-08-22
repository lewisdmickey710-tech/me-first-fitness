-- The real "Full Training Assessment Session Packet" (found in the uploaded
-- PreSignUp.zip) lists 7 checkboxes under Bones, Joints & Chronic Conditions:
-- Osteoporosis/osteopenia, A joint replacement, Arthritis, Hypermobility,
-- POTS/dysautonomia, MCAS, Autoimmune condition. 0013 only captured the
-- first 3 as booleans, leaving the other 4 to free text. Those 4 matter
-- most for Mickey's own client base (EDS/hypermobility-adjacent conditions
-- are her specialty and her own lived experience), so this adds them as
-- real fields instead of leaving them buried in notes.

alter table public.lead_intake
  add column if not exists hypermobility boolean not null default false,
  add column if not exists pots_dysautonomia boolean not null default false,
  add column if not exists mcas boolean not null default false,
  add column if not exists autoimmune_condition boolean not null default false;
