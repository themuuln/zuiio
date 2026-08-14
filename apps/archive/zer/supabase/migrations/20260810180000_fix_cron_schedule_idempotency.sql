-- =============================================
-- Fix schedule_daily_report_cron first-run bug
--
-- The original function unconditionally calls
-- `PERFORM cron.unschedule('daily-report-every-30min')` BEFORE scheduling.
-- On the FIRST run (no existing job) cron.unschedule raises
-- "could not find valid entry for job ..." (XX000), so the documented
-- `GET /api/cron/setup` flow fails on a fresh database. Wrap the unschedule
-- so a missing job is ignored (idempotent first run).
--
-- 2026-08-10 addendum: this function references pg_cron + pg_net, which
-- are shipped in the Supabase image but NOT auto-created per database —
-- on a fresh local stack the CREATE FUNCTION below failed with
-- "schema cron does not exist". Enabling both extensions here makes the
-- migration chain reproducible on empty local databases. No-op on remote
-- projects (Supabase pre-enables them).
--
-- The signature below also RENAMES the input parameter from p_app_url
-- (created by 20260617000001 / 20260622000002) to app_url, which
-- CREATE OR REPLACE rejects with "cannot change name of input parameter".
-- Drop the old function first so the rename is a clean create.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DROP FUNCTION IF EXISTS public.schedule_daily_report_cron(text);

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
