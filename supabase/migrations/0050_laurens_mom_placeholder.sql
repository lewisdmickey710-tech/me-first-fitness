-- Lauren's mother -- real name not yet known. Created now with a clearly
-- marked placeholder name so she's not lost, on the same track as Lauren.
-- Update her name from the client's Profile tab (Full name field) as soon
-- as it's known, ideally before she signs in for the first time.
with new_client (name, care_profile_name, phase, notes, key_health_notes) as (
  values (
    '[Name needed] — Lauren''s mom',
    'Senior & Balance-Focused',
    '1',
    'Mother of Lauren (EDS client). Same EDS/hypermobility background, present at Lauren''s screening but not yet formally assessed herself. Update this client''s real name once known.',
    'Suspected EDS/hypermobility background (same family as Lauren) -- pending her own assessment. Do not assume an identical presentation to Lauren''s.'
  )
),
inserted as (
  insert into public.clients (name, care_profile_id, notes, key_health_notes)
  select nc.name, cp.id, nc.notes, nc.key_health_notes
  from new_client nc
  join public.care_profiles cp on cp.name = nc.care_profile_name
  where not exists (
    select 1 from public.clients c where lower(c.name) = lower(nc.name)
  )
  returning id, name
)
insert into public.client_phase_history (client_id, cycle_number, phase, started_on, planned_weeks)
select i.id, 1, nc.phase, current_date, 4
from inserted i
join new_client nc on nc.name = i.name;
