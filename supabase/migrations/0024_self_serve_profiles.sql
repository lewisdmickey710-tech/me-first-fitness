-- Splits "profile" (name, preferred name, DOB, phone, email, emergency
-- contact, physician -- the quick, always-current contact info) out from
-- "intake" (the deep questionnaire) so both leads and clients can keep
-- their own contact info current themselves, prompted on first sign-in,
-- while the deeper intake questionnaire stays a separate, later step that
-- becomes mandatory once someone is an accepted client.
--
-- Leads previously had no self-serve UPDATE policy at all (only read-own),
-- and clients likewise -- both get one here, guarded by a trigger so a
-- lead/client can only ever touch their own profile fields, never the
-- coach-managed fields (status, care_profile_id, sessions_allotted, etc.)
-- on their own row, even via a raw API call.

alter table public.leads
  add column if not exists preferred_name text,
  add column if not exists date_of_birth date,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists physician_name text,
  add column if not exists physician_phone text,
  add column if not exists profile_completed_at timestamptz;

create policy "leads: lead updates own"
  on public.leads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.leads_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if new.status is distinct from old.status
      or new.converted_client_id is distinct from old.converted_client_id
      or new.user_id is distinct from old.user_id
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_guard_protected_fields_trigger on public.leads;
create trigger leads_guard_protected_fields_trigger
  before update on public.leads
  for each row execute procedure public.leads_guard_protected_fields();

alter table public.clients
  add column if not exists profile_completed_at timestamptz,
  add column if not exists last_document_nudge_sent_at timestamptz;

create policy "clients: client updates own row"
  on public.clients for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.clients_guard_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    if new.user_id is distinct from old.user_id
      or new.care_profile_id is distinct from old.care_profile_id
      or new.days_per_week is distinct from old.days_per_week
      or new.session_mode is distinct from old.session_mode
      or new.sessions_allotted is distinct from old.sessions_allotted
      or new.notes is distinct from old.notes
      or new.track is distinct from old.track
      or new.phase is distinct from old.phase
      or new.payment_schedule is distinct from old.payment_schedule
      or new.start_date is distinct from old.start_date
      or new.primary_goal is distinct from old.primary_goal
      or new.secondary_goal is distinct from old.secondary_goal
      or new.key_health_notes is distinct from old.key_health_notes
    then
      raise exception 'Not permitted to change this field.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_guard_protected_fields_trigger on public.clients;
create trigger clients_guard_protected_fields_trigger
  before update on public.clients
  for each row execute procedure public.clients_guard_protected_fields();
