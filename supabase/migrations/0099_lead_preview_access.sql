-- "While you think about it" preview access: a lead can be assigned a
-- track + starting phase so they can explore a read-only version of the
-- real client program (Day 1 in full, later days visible but locked)
-- before ever signing on. Turning previewing off just reverts them to a
-- plain lead -- it never deletes their login or answers.
alter table public.leads
  add column if not exists previewing boolean not null default false,
  add column if not exists preview_care_profile_id uuid
    references public.care_profiles (id) on delete set null,
  add column if not exists preview_phase text
    check (preview_phase in ('1', '2', '3', '4'));
