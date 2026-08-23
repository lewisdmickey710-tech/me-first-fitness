-- Client-facing display label for care profiles, so a track's internal/
-- coach-facing name (e.g. "Senior & Balance-Focused") doesn't have to be
-- what shows on the client's own dashboard. Falls back to `name` when null.
alter table public.care_profiles
  add column if not exists client_label text;

update public.care_profiles
  set client_label = 'Foundations & Balance'
  where name = 'Senior & Balance-Focused' and client_label is null;

-- Bulk-import Mickey's current real clients. These are pre-created client
-- records with no user_id -- each client still creates their own login
-- (client tab on the login page) and Mickey links them from Signups,
-- same as the existing single-client-at-a-time flow. Guarded by name so
-- re-running this migration is a no-op if any of these already exist.
with new_clients (name, care_profile_name, days_per_week, phase, notes, key_health_notes) as (
  values
    ('Cindy', 'General Population', 4, '2',
      'Custom 4-day Phase 2 program: Days 1-2 unchanged from her original 3-day PPL split, Day 3 rebuilt around lat activation (reported not feeling lat pulldown), Day 4 fully open/client''s choice.',
      null),
    ('Kristal', 'General Population', 3, '1',
      '3-year client. Given a complete self-led 4-phase system (built from her real Body Recomp Split program) to address reported disengagement and history of backsliding -- also tracks outside activity (classes, other coaching, workouts with friends). Advance her phase manually as she progresses through the system on her own.',
      'Coach-only watch items (not to be raised directly with client): possible overtraining, inconsistent eating, alcohol use -- programming is structured to address these without naming the concern to her.'),
    ('Sandra', 'Medically Conservative', 3, '1',
      'New 3-Day Bosu Ball Phase 1 program (permanent change, up from a 2-day schedule).',
      null),
    ('Marta', 'Senior & Balance-Focused', 3, '1',
      'New client. Goal: full functionality. Phase 1 "Foundations" program: Day 1 Machine, Day 2 Stability (coached), Day 3 Repeat-or-Swim (client checkbox choice).',
      'Osteoporosis -- no spinal flexion/rotation under load, no high-impact. Rheumatoid arthritis, near-total hand function loss -- every exercise uses a wrist/forearm strap instead of a grip. History of broken ribs -- no prone chest-loading. Plate in one arm -- no end-range loading without specific clearance. Bilateral foot surgery -- standing/balance work stays supported. Confirm specific medical clearance/restrictions with her physician or PT before finalizing loads.'),
    ('Melanie', 'General Population', null, '1', 'Advanced, no medical issues.', null),
    ('KAT', 'General Population', null, '1', 'Advanced, no medical issues.', null),
    ('Karla', 'Senior & Balance-Focused', null, '1', null, null),
    ('Dottie', 'Senior & Balance-Focused', null, '1', null, null),
    ('Georgia', 'Senior & Balance-Focused', null, '1', null, null),
    ('Erica', 'Chronic Illness Support', null, '1', null,
      'Ehlers-Danlos Syndrome / hypermobility -- apply the EDS cue bank and correction chart. Screen for POTS/dysautonomia (dizziness on standing) each session.'),
    ('Lauren', 'Chronic Illness Support', 1, '1',
      'Met through an EDS support group; coach and client share the same condition. Lives too far for more than once-weekly in-person sessions.',
      'Ehlers-Danlos Syndrome / hypermobility -- apply the EDS cue bank and correction chart. Screen for POTS/dysautonomia (dizziness on standing) each session.'),
    ('Hina', 'General Population', null, '1', 'New client, less advanced/beginner.', null)
),
inserted as (
  insert into public.clients (name, care_profile_id, days_per_week, notes, key_health_notes)
  select nc.name, cp.id, nc.days_per_week, nc.notes, nc.key_health_notes
  from new_clients nc
  join public.care_profiles cp on cp.name = nc.care_profile_name
  where not exists (
    select 1 from public.clients c where lower(c.name) = lower(nc.name)
  )
  returning id, name
)
insert into public.client_phase_history (client_id, cycle_number, phase, started_on, planned_weeks)
select i.id, 1, nc.phase, current_date, 4
from inserted i
join new_clients nc on nc.name = i.name;
