-- Lets a coach record a document as already signed outside the app (a
-- paper form filled out before this feature existed, or before the app
-- itself existed) and attach a scan/photo of it, instead of making the
-- client redo it digitally. external_file_path points into the existing
-- "form-checks" storage bucket -- reused rather than adding a new bucket,
-- since it's already private with the right RLS shape (coach full access,
-- client reads/writes only their own folder).
alter table public.client_document_acknowledgments
  add column if not exists signed_via text not null default 'app'
    check (signed_via in ('app', 'external')),
  add column if not exists external_file_path text;
