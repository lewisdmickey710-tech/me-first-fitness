-- Belt-and-suspenders follow-up to 0087: that fix referenced the column
-- as objects.name, which should be equivalent to the fully-qualified
-- storage.objects.name (the form already proven correct in 0063's
-- community-photos policy) -- but since this exact policy has already
-- burned us once on a subtle column-resolution mistake, removing any
-- remaining ambiguity here rather than assuming it's fine.
drop policy if exists "form-checks: client manages own folder" on storage.objects;

create policy "form-checks: client manages own folder"
  on storage.objects for all
  using (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(storage.objects.name))[1]
        and c.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'form-checks'
    and exists (
      select 1 from public.clients c
      where c.id::text = (storage.foldername(storage.objects.name))[1]
        and c.user_id = auth.uid()
    )
  );
