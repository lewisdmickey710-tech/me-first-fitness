-- Automates packet delivery: the coach uploads one Phase 1 PDF per care
-- profile ("track"), and confirming a lead's paid packet request now
-- actually emails it -- through the same Resend pipeline every other app
-- email goes through, not a personal text/email -- instead of just
-- flipping a status flag she then had to fulfill by hand.
--
-- Private bucket, coach-only write. Reads never go through client-side
-- RLS at all -- every signed URL (in the confirmation email, and the
-- fallback download link on the lead's own dashboard) is generated
-- server-side with the admin/service-role client, so no lead-facing
-- storage.objects policy is needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('packets', 'packets', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "packets: coach full access"
  on storage.objects for all
  using (bucket_id = 'packets' and public.is_coach())
  with check (bucket_id = 'packets' and public.is_coach());

alter table public.care_profiles
  add column if not exists phase1_packet_path text;
