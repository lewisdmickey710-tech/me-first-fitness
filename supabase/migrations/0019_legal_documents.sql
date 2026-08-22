-- Contract / onboarding forms / disclaimers, editable by the coach and
-- acknowledged by clients (view real text + "I have read and agree"
-- checkbox, timestamped). Seeded with 3 placeholder documents -- NOT real
-- legal text. Mickey's own Client Folder material explicitly marks the
-- contract as "insert the signed Onboarding Package here as physical
-- pages" (i.e. it doesn't exist in digital form yet), and the one real
-- consent document found so far (Minor Consent Addendum) references a
-- separate "standard waiver" that wasn't included. Liability/waiver
-- language needs to come from Mickey (ideally attorney-reviewed), not be
-- drafted here -- the placeholder body text says so explicitly and the
-- coach-facing edit UI flags any document still on the placeholder so it
-- can't be silently sent to clients as if it were real.

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('contract', 'onboarding_form', 'disclaimer')),
  title text not null,
  body text not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.legal_documents enable row level security;

create policy "legal_documents: coach full access"
  on public.legal_documents for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "legal_documents: client reads"
  on public.legal_documents for select
  using (true);

create table if not exists public.client_document_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  document_id uuid not null references public.legal_documents (id) on delete cascade,
  document_version integer not null,
  acknowledged_at timestamptz not null default now(),
  unique (client_id, document_id, document_version)
);

alter table public.client_document_acknowledgments enable row level security;

create policy "client_document_acknowledgments: coach full access"
  on public.client_document_acknowledgments for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_document_acknowledgments: client manages own"
  on public.client_document_acknowledgments for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_document_acknowledgments.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_document_acknowledgments.client_id and c.user_id = auth.uid()
    )
  );

insert into public.legal_documents (key, title, body) values
  (
    'contract',
    'Coaching Contract',
    $t$[PLACEHOLDER -- replace with your real coaching contract text before sending this to any client. Your Client Folder material marks this document as "insert the signed Onboarding Package here as physical pages," meaning it doesn't exist in digital form yet. This should cover session rates, cancellation policy, payment terms, and anything else you'd want a client bound to in writing. Consider having it reviewed by a lawyer before use.]$t$
  ),
  (
    'onboarding_form',
    'Client Onboarding Form',
    $t$[PLACEHOLDER -- replace with your real onboarding form text. This is a good place for anything you want every new client to formally acknowledge at sign-on beyond what's already collected in their intake questionnaire -- session expectations, communication policy, what's included at each price tier, etc.]$t$
  ),
  (
    'disclaimer',
    'Liability Waiver & Disclaimer',
    $t$[PLACEHOLDER -- replace with your real liability waiver / disclaimer text. Your Minor Consent & Intake Addendum references a "standard waiver" required alongside it, which wasn't included in the material processed so far -- if you have that text already, drop it in here. This is liability-relevant language; have it reviewed by a lawyer before use.]$t$
  )
on conflict (key) do nothing;
