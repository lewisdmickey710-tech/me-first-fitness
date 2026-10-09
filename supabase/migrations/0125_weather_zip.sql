-- Business zip code for the morning digest's weather line -- nullable,
-- left blank the whole weather feature just stays silent (no API key
-- needed either; the cron geocodes this via a free lookup and calls the
-- National Weather Service's public API).
alter table public.business_settings
  add column if not exists weather_zip text;
