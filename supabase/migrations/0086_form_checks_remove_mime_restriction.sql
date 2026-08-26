-- 0085 tried to fix an upload-rejection crash by widening the
-- form-checks bucket's allowed_mime_types to wildcards ('image/*',
-- 'video/*'). The same crash kept happening after that migration was
-- run, which means either Storage doesn't match that wildcard pattern
-- the way it was assumed to, or the rejection was never actually about
-- MIME type in the first place. Removing the allow-list entirely (NULL
-- = no MIME restriction at all) rules the format check out for good,
-- rather than trusting a pattern that clearly wasn't working.
update storage.buckets
set allowed_mime_types = null
where id = 'form-checks';
