-- Schedule Telegram owner notifications
-- Daily summary: 22:00 ULAT = 14:00 UTC
-- Weekly summary: Monday 22:00 ULAT = 14:00 UTC

-- ============================================================
-- 1. Function: invoke telegram-notify-owners (daily)
-- ============================================================
create or replace function invoke_telegram_notify_daily()
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
    url := functions_url || '/telegram-notify-owners?period=daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- ============================================================
-- 2. Function: invoke telegram-notify-owners (weekly)
-- ============================================================
create or replace function invoke_telegram_notify_weekly()
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
    url := functions_url || '/telegram-notify-owners?period=weekly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- ============================================================
-- 3. Schedule: daily at 22:00 ULAT (14:00 UTC)
-- ============================================================
select cron.schedule(
  'telegram-notify-owners-daily',
  '0 14 * * *',
  $$select invoke_telegram_notify_daily()$$
);

-- ============================================================
-- 4. Schedule: weekly on Monday at 22:00 ULAT (14:00 UTC)
-- ============================================================
select cron.schedule(
  'telegram-notify-owners-weekly',
  '0 14 * * 1',
  $$select invoke_telegram_notify_weekly()$$
);
