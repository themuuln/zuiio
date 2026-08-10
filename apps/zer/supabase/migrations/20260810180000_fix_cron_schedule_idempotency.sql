-- =============================================
-- Fix schedule_daily_report_cron first-run bug
--
-- The original function unconditionally calls
-- `PERFORM cron.unschedule('daily-report-every-30min')` BEFORE scheduling.
-- On the FIRST run (no existing job) cron.unschedule raises
-- "could not find valid entry for job ..." (XX000), so the documented
-- `GET /api/cron/setup` flow fails on a fresh database. Wrap the unschedule
-- so a missing job is ignored (idempotent first run).
-- =============================================

CREATE OR REPLACE FUNCTION public.schedule_daily_report_cron(app_url text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  job_id bigint;
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-report-every-30min');
  EXCEPTION WHEN OTHERS THEN
    -- First run: no job exists yet; unschedule raises XX000. Ignore it.
    NULL;
  END;

  SELECT cron.schedule(
    'daily-report-every-30min',
    '*/30 * * * *',
    format(
      'SELECT net.http_post(
        url:=%L,
        headers:=''{"Content-Type": "application/json"}''::jsonb,
        body:=''{}''::jsonb
      )',
      app_url || '/api/cron/daily-report'
    )
  ) INTO job_id;

  RETURN 'Scheduled job ID: ' || job_id;
END;
$function$;
