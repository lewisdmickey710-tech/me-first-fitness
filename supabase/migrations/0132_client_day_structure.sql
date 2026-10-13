-- Lets a client's day list genuinely differ from their track's shared
-- template: hide a prescribed day she's not doing with this client right
-- now, or add a day that only exists for this client. Neither touches
-- program_days (the shared template) or any other client on the same
-- care profile.

create table public.client_hidden_program_days (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, program_day_id)
);

alter table public.client_hidden_program_days enable row level security;

create policy "client_hidden_program_days: coach writes"
  on public.client_hidden_program_days for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_hidden_program_days: client reads own"
  on public.client_hidden_program_days for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_hidden_program_days.client_id and c.user_id = auth.uid()
    )
  );

create table public.client_extra_program_days (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  phase text not null,
  day_number integer not null,
  day_label text not null,
  created_at timestamptz not null default now(),
  unique (client_id, phase, day_number)
);

alter table public.client_extra_program_days enable row level security;

create policy "client_extra_program_days: coach writes"
  on public.client_extra_program_days for all
  using (public.is_coach())
  with check (public.is_coach());

create policy "client_extra_program_days: client reads own"
  on public.client_extra_program_days for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_extra_program_days.client_id and c.user_id = auth.uid()
    )
  );

-- client_custom_program_days (0129) already holds the exercises for an
-- existing template day a client's version fully replaces, keyed by
-- program_day_id. Extend it so the same row shape also holds the
-- exercises for a day that only exists for this client
-- (client_extra_program_days), without touching the already-shipped
-- program_day_id column or any existing rows -- exactly one of the two
-- target columns is set per row.
alter table public.client_custom_program_days
  alter column program_day_id drop not null,
  add column extra_day_id uuid references public.client_extra_program_days(id) on delete cascade,
  add constraint client_custom_program_days_target_check
    check (
      (program_day_id is not null and extra_day_id is null) or
      (program_day_id is null and extra_day_id is not null)
    );

create index client_custom_program_days_extra_day_idx
  on public.client_custom_program_days (client_id, extra_day_id);
