-- The old track/phase columns are superseded by care_profile_id +
-- client_phase_history. Make them optional rather than dropping them —
-- existing rows keep their data, but new clients no longer need to supply
-- a legacy track/phase.

alter table public.clients alter column track drop not null;
alter table public.clients alter column phase drop not null;
alter table public.clients alter column phase drop default;
