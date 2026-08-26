-- The original policy's subquery ("from public.clients c ... storage.
-- foldername(name)") used a bare `name` meant to mean the uploaded
-- object's path (storage.objects.name) -- but clients ALSO has its own
-- `name` column (the client's actual name), and Postgres resolves an
-- unqualified column inside a subquery to the closest FROM clause, not
-- the outer one. So this was silently checking
-- storage.foldername('Jane Doe') = client_id, which is never true for
-- anyone -- every client-initiated upload to this bucket (progress
-- photos, workout form-check media, nutrition photos) has been
-- rejected by this policy since it was written. Fully qualifying it as
-- objects.name (same pattern already used correctly in the 0063
-- community-photos policy) fixes the column resolution.
drop policy if exists "form-checks: client manages own folder" on storage.objects;

create policy "form-checks: client manages own folder"
  on storage.objects for all
  using (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(objects.name))[1] and c.user_id = auth.uid()
    )
  );
