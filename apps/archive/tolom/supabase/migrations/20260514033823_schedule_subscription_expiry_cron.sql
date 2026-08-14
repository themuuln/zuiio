-- Schedule subscription expiry check to run daily at 2:00 AM
-- Uses pg_cron + pg_net to invoke the Edge Function

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- First, create the function to call our expiry endpoint
create or replace function invoke_expire_subscriptions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  anon_key text;
begin
  anon_key := current_setting('app.settings.anon_key', true);
  if anon_key is null or anon_key = '' then
    raise warning 'app.settings.anon_key not set';
    return;
  end if;

  perform net.http_post(
    url := current_setting('app.settings.functions_url', true) || '/expire-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- Schedule it: run daily at 2:00 AM UTC
select cron.schedule(
  'expire-subscriptions-daily',
  '0 2 * * *',
  $$select invoke_expire_subscriptions()$$
);
