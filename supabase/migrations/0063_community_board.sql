-- Client community board: clients post wins, questions, progress
-- pictures, or anything else to a shared feed visible to every other
-- client (and the coach), with comments and a lightweight "support"
-- reaction. Nothing here is auto-populated from a client's private
-- tracking (progress photos, measurements, etc.) -- posting is always a
-- deliberate, separate action, which is what makes this opt-in rather
-- than exposing anything by default.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null default 'general' check (kind in ('win', 'question', 'progress', 'general')),
  body text,
  photo_path text,
  created_at timestamptz not null default now(),
  constraint community_posts_has_content check (body is not null or photo_path is not null)
);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  -- null client_id + author_role='coach' is Mickey's own comment --
  -- everything else is a client, matching the logged_by convention used
  -- elsewhere in the app.
  client_id uuid references public.clients (id) on delete cascade,
  author_role text not null check (author_role in ('client', 'coach')),
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_post_comments_author_matches_role check (
    (author_role = 'coach' and client_id is null)
    or (author_role = 'client' and client_id is not null)
  )
);

create table if not exists public.community_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, client_id)
);

alter table public.community_posts enable row level security;
alter table public.community_post_comments enable row level security;
alter table public.community_post_reactions enable row level security;

-- Read access is intentionally shared -- any linked client can see any
-- other client's post, which is the whole point of a community board.
-- Nothing else in this app grants that; everywhere else a client only
-- ever sees their own rows.
create policy "community_posts: any linked client or coach reads"
  on public.community_posts for select
  using (
    public.is_coach()
    or exists (select 1 from public.clients c where c.user_id = auth.uid())
  );

create policy "community_posts: client creates own"
  on public.community_posts for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = community_posts.client_id and c.user_id = auth.uid()
    )
  );

create policy "community_posts: author or coach deletes"
  on public.community_posts for delete
  using (
    public.is_coach()
    or exists (
      select 1 from public.clients c
      where c.id = community_posts.client_id and c.user_id = auth.uid()
    )
  );

create policy "community_post_comments: any linked client or coach reads"
  on public.community_post_comments for select
  using (
    public.is_coach()
    or exists (select 1 from public.clients c where c.user_id = auth.uid())
  );

create policy "community_post_comments: client creates own"
  on public.community_post_comments for insert
  with check (
    author_role = 'client'
    and exists (
      select 1 from public.clients c
      where c.id = community_post_comments.client_id and c.user_id = auth.uid()
    )
  );

create policy "community_post_comments: coach creates own"
  on public.community_post_comments for insert
  with check (author_role = 'coach' and public.is_coach());

create policy "community_post_comments: author or coach deletes"
  on public.community_post_comments for delete
  using (
    public.is_coach()
    or exists (
      select 1 from public.clients c
      where c.id = community_post_comments.client_id and c.user_id = auth.uid()
    )
  );

create policy "community_post_reactions: any linked client or coach reads"
  on public.community_post_reactions for select
  using (
    public.is_coach()
    or exists (select 1 from public.clients c where c.user_id = auth.uid())
  );

create policy "community_post_reactions: client creates own"
  on public.community_post_reactions for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = community_post_reactions.client_id and c.user_id = auth.uid()
    )
  );

create policy "community_post_reactions: author or coach deletes"
  on public.community_post_reactions for delete
  using (
    public.is_coach()
    or exists (
      select 1 from public.clients c
      where c.id = community_post_reactions.client_id and c.user_id = auth.uid()
    )
  );

-- A community post's photo needs to be readable by every other client,
-- not just its own author -- the existing form-checks policies only ever
-- grant a client their own folder. This adds a narrow extra read path:
-- any signed-in client or the coach can read a form-checks object, but
-- only if it's actually referenced by a real community post (so it can't
-- be used to browse someone's private form-check videos or nutrition
-- photos, which never appear in community_posts).
create policy "form-checks: community post photos readable by any client or coach"
  on storage.objects for select
  using (
    bucket_id = 'form-checks'
    and exists (select 1 from public.community_posts cp where cp.photo_path = storage.objects.name)
    and (
      public.is_coach()
      or exists (select 1 from public.clients c where c.user_id = auth.uid())
    )
  );
