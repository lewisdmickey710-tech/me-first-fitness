-- Not everyone wants to describe or measure a meal -- sometimes a quick
-- photo is the whole point (the "sending food pictures" style already
-- described in the Wellness guide). Reuses the existing form-checks
-- bucket/RLS (client's own folder, coach full access, signed URLs on
-- read) rather than a new bucket.
alter table public.client_nutrition_logs
  add column if not exists photo_path text;
