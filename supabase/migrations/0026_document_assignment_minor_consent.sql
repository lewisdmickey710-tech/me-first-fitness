-- Two changes, both from real coach feedback after testing:
--
-- 1. Not every document goes to every client. Adds an assigned_to_all flag
--    (default true, so the existing 3 universal documents keep working
--    exactly as before) plus a client_document_assignments join table for
--    documents that only go to specific clients. Flips the Minor Consent &
--    Intake Addendum to assigned_to_all = false, since it should only ever
--    reach the handful of clients who are minors, not everyone.
--
-- 2. The Minor Consent document was previously just read-and-sign text.
--    Migration 0020 already noted the real PDF pairs that consent language
--    with a genuine fillable form (minor's info, guardian contact, medical
--    history) and left it as separate future work. This is that work:
--    client_minor_consent holds the structured fields, filled in by the
--    parent/guardian directly (mirrors the lead_intake/client_intake
--    pattern), with its own guardian signature -- separate from the
--    generic legal_documents signature flow, since this one has real
--    fields to fill in rather than just a body of text to agree to.

alter table public.legal_documents
  add column if not exists assigned_to_all boolean not null default true;

update public.legal_documents set assigned_to_all = false where key = 'minor_consent';

create table if not exists public.client_document_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  document_id uuid not null references public.legal_documents (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (client_id, document_id)
);

alter table public.client_document_assignments enable row level security;

create policy "client_document_assignments: coach full access"
  on public.client_document_assignments for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_document_assignments: client reads own"
  on public.client_document_assignments for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_document_assignments.client_id and c.user_id = auth.uid()
    )
  );

create table if not exists public.client_minor_consent (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,

  minor_full_name text,
  minor_date_of_birth date,
  minor_age integer,
  minor_grade text,
  minor_sports text,

  guardian_full_name text,
  guardian_phone text,
  guardian_email text,
  guardian_relationship text,
  guardian_update_preference text check (guardian_update_preference in ('text', 'email', 'in_person')),

  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,

  physician_name text,
  physician_phone text,
  diagnosis_treatment text,
  other_conditions_meds_allergies text,
  athletic_training_clearance text,

  guardian_signature_name text,
  signed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_minor_consent enable row level security;

create policy "client_minor_consent: coach full access"
  on public.client_minor_consent for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_minor_consent: client manages own"
  on public.client_minor_consent for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_minor_consent.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_minor_consent.client_id and c.user_id = auth.uid()
    )
  );
