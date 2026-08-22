-- The only existing profiles policy ("profiles: read own") lets a user see
-- their own row and nothing else -- fine for normal login-routing, but it
-- means the coach couldn't query "everyone with role='client'" to find
-- self-signed-up accounts that still need linking to a clients row. Adds a
-- coach-only read-all policy, matching the is_coach() pattern already used
-- everywhere else.

create policy "profiles: coach reads all"
  on public.profiles for select
  using (public.is_coach());
