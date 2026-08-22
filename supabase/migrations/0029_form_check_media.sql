-- Lets a client attach a photo or video of their form to a specific
-- exercise when logging a workout (real request: guidance, progress over
-- time, and accountability). Private bucket -- these are photos/videos of
-- someone's body/form, not public content. Path convention is
-- "{client_id}/{filename}", which the RLS policy below uses to scope a
-- client to only their own folder; the coach gets full access to review
-- anyone's. The app generates short-lived signed URLs on read rather than
-- exposing these files publicly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'form-checks',
  'form-checks',
  false,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

create policy "form-checks: coach full access"
  on storage.objects for all
  using (bucket_id = 'form-checks' and public.is_coach())
  with check (bucket_id = 'form-checks' and public.is_coach());

create policy "form-checks: client manages own folder"
  on storage.objects for all
  using (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid()
    )
  );
