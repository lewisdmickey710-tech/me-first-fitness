-- A client hit a server crash attaching a food photo to a nutrition log
-- entry. Most likely cause: the exact MIME string her phone/browser sent
-- for that photo (there are several real-world HEIC/HEIF variants, plus
-- whatever a given camera app reports) wasn't in the original hand-picked
-- allow-list, so Supabase Storage rejected the upload before the app ever
-- got a chance to save anything -- and the generic error page is all
-- Next.js shows for an unhandled server action error.
--
-- Rather than keep guessing individual MIME strings to add, widen the
-- form-checks bucket (shared by nutrition photos, workout form-check
-- photos/videos, progress photos, and community board photos) to accept
-- any image or video, full stop.
update storage.buckets
set allowed_mime_types = array['image/*', 'video/*']
where id = 'form-checks';
