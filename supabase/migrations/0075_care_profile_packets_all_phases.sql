-- The $50 packet purchase covers all 4 phases of a track, not just the
-- first one -- replaces the single phase1_packet_path column from 0074
-- (never used yet, nothing to migrate) with a proper per-phase table,
-- same shape as the existing care_profile_phase_notes.
--
-- No lead/client read policy: every reader of this table's paths is
-- server-side code using the admin client (markPacketSent, the lead
-- dashboard's fallback download links), same as the packets storage
-- bucket itself -- so only the coach ever needs a real RLS grant here.
alter table public.care_profiles
  drop column if exists phase1_packet_path;

create table if not exists public.care_profile_packets (
  id uuid primary key default gen_random_uuid(),
  care_profile_id uuid not null references public.care_profiles (id) on delete cascade,
  phase text not null check (phase in ('1', '2', '3', '4')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (care_profile_id, phase)
);

alter table public.care_profile_packets enable row level security;

create policy "care_profile_packets: coach full access"
  on public.care_profile_packets for all
  using (public.is_coach())
  with check (public.is_coach());
