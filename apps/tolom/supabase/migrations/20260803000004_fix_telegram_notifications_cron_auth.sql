-- Fix invoke_telegram_notify_{daily,weekly,monthly}: the project has no
-- app.settings.anon_key / app.settings.functions_url platform GUCs, so the
-- original RPCs silently bailed. Use a shared secret stored in public.app_config
-- + the project's fixed function URL instead. All three periods share one secret.

insert into app_config (key, value)
values ('telegram_notify_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function invoke_telegram_notify_daily()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_secret text;
begin
  select value into cron_secret
  from public.app_config
  where key = 'telegram_notify_secret'
  limit 1;

  if cron_secret is null or cron_secret = '' then
    raise warning 'telegram_notify_secret not configured in app_config';
    return;
  end if;

  perform net.http_post(
    url := 'https://fhzuolncswccxkcqzclg.supabase.co/functions/v1/telegram-notify-owners?period=daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-telegram-notify-secret', cron_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;

create or replace function invoke_telegram_notify_weekly()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_secret text;
begin
  select value into cron_secret
  from public.app_config
  where key = 'telegram_notify_secret'
  limit 1;

  if cron_secret is null or cron_secret = '' then
    raise warning 'telegram_notify_secret not configured in app_config';
    return;
  end if;

  perform net.http_post(
    url := 'https://fhzuolncswccxkcqzclg.supabase.co/functions/v1/telegram-notify-owners?period=weekly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-telegram-notify-secret', cron_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;

create or replace function invoke_telegram_notify_monthly()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cron_secret text;
begin
  select value into cron_secret
  from public.app_config
  where key = 'telegram_notify_secret'
  limit 1;

  if cron_secret is null or cron_secret = '' then
    raise warning 'telegram_notify_secret not configured in app_config';
    return;
  end if;

  perform net.http_post(
    url := 'https://fhzuolncswccxkcqzclg.supabase.co/functions/v1/telegram-notify-owners?period=monthly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-telegram-notify-secret', cron_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;
