-- Lets a client (or the coach, logging on their behalf) attach a photo to
-- an out-of-session activity log entry -- e.g. a picture from a class or a
-- hike. Reuses the existing form-checks bucket/RLS, same as every other
-- client photo in the app (progress photos, nutrition photos, workout
-- form-check media).
alter table public.activities
  add column if not exists photo_path text;
