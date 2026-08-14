-- Schedule monthly Telegram owner notification
-- Monthly summary: 1st of each month at 22:00 ULAT = 14:00 UTC

-- ============================================================
-- Function: invoke telegram-notify-owners (monthly)
-- ============================================================
create or replace function invoke_telegram_notify_monthly()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  anon_key text;
  functions_url text;
begin
  anon_key := current_setting('app.settings.anon_key', true);
  functions_url := current_setting('app.settings.functions_url', true);

  if anon_key is null or anon_key = '' then
    raise warning 'app.settings.anon_key not set';
    return;
  end if;

  perform net.http_post(
    url := functions_url || '/telegram-notify-owners?period=monthly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- ============================================================
-- Schedule: 1st of each month at 22:00 ULAT (14:00 UTC)
-- ============================================================
select cron.schedule(
  'telegram-notify-owners-monthly',
  '0 14 1 * *',
  $$select invoke_telegram_notify_monthly()$$
);
