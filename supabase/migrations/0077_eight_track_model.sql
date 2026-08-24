-- Lines care_profiles up with Mickey's new "Track Criteria Reference" doc
-- (8 lettered tracks A-J, skipping E/H -- those were retired as duplicate
-- content, not distinct tracks). General Population and Chronic Illness
-- Support stay exactly as they are: Mickey chose to keep both rather than
-- fold them into the 8-track set, so their existing clients (Cindy,
-- Kristal, Melanie, KAT, Hina, Erica, Lauren) and programming are
-- untouched by this migration.
--
-- Rehab-Forward and Medically Conservative already match tracks D and F
-- by name, so nothing to do there either.
--
-- Renames are id-preserving (`update ... where name = `), so Marta,
-- Karla, Dottie, Georgia (Senior & Balance-Focused) and any Postpartum
-- Recovery clients keep their care_profile_id and existing program_days
-- content -- only the label changes.
update public.care_profiles
  set name = 'Senior/Fall-Prevention'
  where name = 'Senior & Balance-Focused';

update public.care_profiles
  set name = 'Postpartum/Pelvic-Health'
  where name = 'Postpartum Recovery';

-- New tracks from the 8-track model with no existing counterpart. No
-- program_days/exercises content yet -- that's a separate later build.
-- These exist now so care_profile_packets (the PDF tracker delivery
-- system) has somewhere to attach uploads for these tracks today.
insert into public.care_profiles (name, description) values
  ('3-Day PPL', 'Track A. Legs/Push/Pull split, 3x/week. Delivery (self-guided vs. fully-coached) is a service-tier choice within this track, not a separate program.'),
  ('2-Day Upper/Lower + Class', 'Track B. 3x/week structured days for clients who already attend, or want to add, a class.'),
  ('Once-Weekly Full Body', 'Track C. 3 rotating full-body day variants for clients limited to one in-person session a week; an optional bodyweight home day can be added.'),
  ('Virtual-Only', 'Track G. Same 3-day structure as the 3-Day PPL track, built around home/minimal equipment (bands and dumbbells) for clients training remotely.')
on conflict (name) do nothing;
