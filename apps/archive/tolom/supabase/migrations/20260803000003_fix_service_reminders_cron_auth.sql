-- Fix invoke_check_service_reminders: the project has no app.settings.anon_key /
-- app.settings.functions_url platform GUCs, so the original RPC (mirroring the
-- service-reminders cron) silently bailed. Use a shared secret stored in
-- public.app_config + the project's fixed function URL instead.

insert into app_config (key, value)
values ('service_reminder_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function invoke_check_service_reminders()
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
  where key = 'service_reminder_secret'
  limit 1;

  if cron_secret is null or cron_secret = '' then
    raise warning 'service_reminder_secret not configured in app_config';
    return;
  end if;

  perform net.http_post(
    url := 'https://fhzuolncswccxkcqzclg.supabase.co/functions/v1/check-service-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-service-reminder-secret', cron_secret
    ),
    body := '{}'::jsonb
  );
end;
$$;
