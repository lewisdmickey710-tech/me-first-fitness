-- Client Profile fields, transcribed from the real "CLIENT PROFILE" page in
-- MeFirstFitness Client Folder.pdf (Active_Client_Material.zip): Basic
-- Information, Emergency Contact, Program Overview, and Key Health Notes.
-- session_mode already covers "Session Type" (In-Person/Virtual/Mixed) and
-- notes already covers general coach notes -- both pre-existing columns,
-- not duplicated here.

alter table public.clients
  add column if not exists preferred_name text,
  add column if not exists date_of_birth date,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists physician_name text,
  add column if not exists physician_phone text,
  add column if not exists start_date date,
  add column if not exists payment_schedule text check (payment_schedule in ('pay_as_you_go', 'monthly')),
  add column if not exists primary_goal text,
  add column if not exists secondary_goal text,
  add column if not exists key_health_notes text;
