-- Distinguishes an actual coached session (Mickey present, in-person or
-- virtual) from a client doing their prescribed program on their own.
-- Every existing row defaults to true (coached) -- that's the accurate
-- assumption for all historical data; the solo case is what's new here.
-- Going forward: the coach's own Log Session form defaults this true and
-- lets her uncheck it for something she's recording on a client's behalf
-- after the fact. When a client logs their own workout, the app infers
-- it from whether that date matches an actual scheduled/confirmed time
-- rather than asking them each time.
alter table public.sessions
  add column if not exists coached boolean not null default true;

-- activities never had a logged_by column -- coach full access already
-- covered writes, but there was no way to tell whether a given row was
-- the client's own entry or one the coach logged on their behalf (the
-- new "log activity for this client" flow on the Activity tab). All
-- existing rows really were client-logged (that coach-side flow didn't
-- exist before now), hence the default.
alter table public.activities
  add column if not exists logged_by text not null default 'client'
    check (logged_by in ('coach', 'client'));
