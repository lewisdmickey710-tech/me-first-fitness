-- Lets a lead buy a track's Phase 1 PDF tracker packet ($50) up front,
-- before their free assessment -- money in the door and a warmer lead to
-- follow up with, using the pre-built phase trackers Mickey already has
-- per track. Deliberately doesn't touch the assessment-request flow at
-- all: buying a packet never replaces or skips the free assessment, it's
-- purely additive (per Mickey: everyone still gets a conversation before
-- she hands them programming, by default).
--
-- Payment/delivery stays fully manual, same as everything else in this
-- app -- Cash App/Zelle, then Mickey sends the PDF herself -- so this is
-- just a status flag (pending -> paid_and_sent), not a real payments-table
-- row (leads aren't clients, and there's no file-delivery infrastructure
-- to build here).
create table if not exists public.lead_packet_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  care_profile_id uuid not null references public.care_profiles (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'paid_and_sent')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

alter table public.lead_packet_requests enable row level security;

create policy "lead_packet_requests: coach full access"
  on public.lead_packet_requests for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "lead_packet_requests: lead reads own"
  on public.lead_packet_requests for select
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_packet_requests.lead_id and l.user_id = auth.uid()
    )
  );

create policy "lead_packet_requests: lead inserts own"
  on public.lead_packet_requests for insert
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_packet_requests.lead_id and l.user_id = auth.uid()
    )
  );
