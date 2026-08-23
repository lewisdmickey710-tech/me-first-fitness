-- There was previously no way to remove a client from the active roster
-- at all. Archiving (not deleting) so nothing is ever actually lost --
-- an archived client's full history stays intact, just hidden from the
-- default roster view.
alter table public.clients
  add column if not exists archived_at timestamptz;
