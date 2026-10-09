-- Lets a client browse past announcements (FAQ page) -- previously
-- coach_announcements had no client-facing read policy at all, so a
-- missed push (phone off, notifications not yet enabled, swiped away)
-- meant that message was just gone for them. Visible regardless of a
-- client's own notify_announcements preference, since that only
-- controls the push, not whether the history is browsable.
create policy "coach_announcements: client reads"
  on public.coach_announcements for select
  using (exists (select 1 from public.clients c where c.user_id = auth.uid()));
