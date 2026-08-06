-- Schedule ITP reminder check to run daily at 4:00 AM UTC
-- Uses pg_cron + pg_net to invoke the Edge Function

-- First, create the function to call our reminders endpoint
create or replace function invoke_check_itp_reminders()
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
    url := current_setting('app.settings.functions_url', true) || '/itp-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- Schedule it: run daily at 4:00 AM UTC
select cron.schedule(
  'check-itp-reminders-daily',
  '0 4 * * *',
  $$select invoke_check_itp_reminders()$$
);
