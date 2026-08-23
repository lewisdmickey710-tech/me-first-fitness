-- Client-uploaded progress photos, self-serve like the nutrition-log
-- photo -- lets a client build their own before/after timeline without
-- waiting on the coach to log it. Reuses the existing form-checks
-- bucket/RLS (client's own folder, coach full access, signed URLs on
-- read) rather than a new bucket.
create table if not exists public.client_progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  angle text check (angle in ('front', 'side', 'back', 'other')),
  photo_path text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.client_progress_photos enable row level security;

create policy "client_progress_photos: coach full access"
  on public.client_progress_photos for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_progress_photos: client manages own"
  on public.client_progress_photos for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_progress_photos.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_progress_photos.client_id and c.user_id = auth.uid()
    )
  );

-- A client's service check-in words can only ever be shared as a
-- testimonial with their explicit opt-in -- off by default.
alter table public.service_checkins
  add column if not exists testimonial_consent boolean not null default false;
