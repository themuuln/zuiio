-- Backfill Mongolian as the default language for all existing organizations.
-- Only sets language where it's not already configured in the settings JSONB.

update organizations
set
  settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{language}', '"mn"'),
  updated_at = now()
where deleted_at is null
  and (
    settings is null
    or settings = '{}'::jsonb
    or not (settings ? 'language')
  );
