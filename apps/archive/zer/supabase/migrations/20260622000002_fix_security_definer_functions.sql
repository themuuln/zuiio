-- =============================================
-- Critical security fixes:
-- 1. Revoke EXECUTE on dangerous SECURITY DEFINER
--    functions from anon/authenticated
-- 2. Fix set_role_permissions: add permission check
-- 3. Fix increment_smtp_count: add search_path
-- 4. Fix schedule/unschedule cron: add search_path
-- 5. Fix generate_* number functions: add search_path
-- =============================================

-- 1. Revoke EXECUTE from public for dangerous functions
REVOKE EXECUTE ON FUNCTION public.increment_smtp_count(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_daily_report_cron(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unschedule_daily_report_cron() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_role_permissions(UUID, public.app_permission[]) FROM PUBLIC, anon, authenticated;

-- 2. Fix set_role_permissions with permission check + search_path
CREATE OR REPLACE FUNCTION public.set_role_permissions(
  p_role_id UUID,
  p_permissions public.app_permission[]
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_permission('roles.manage') THEN
    RETURN json_build_object('error', 'Permission denied');
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT p_role_id, unnest(p_permissions);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_role_permissions(UUID, public.app_permission[]) TO authenticated;

-- 3. Fix increment_smtp_count with search_path
CREATE OR REPLACE FUNCTION public.increment_smtp_count(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.smtp_configs
  SET daily_count = daily_count + 1, updated_at = now()
  WHERE id = p_config_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_smtp_count(UUID) TO authenticated;

-- 4. Fix schedule/unschedule cron with search_path
CREATE OR REPLACE FUNCTION public.schedule_daily_report_cron(p_app_url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  job_id bigint;
BEGIN
  PERFORM cron.unschedule('daily-report-every-30min');

  SELECT cron.schedule(
    'daily-report-every-30min',
    '*/30 * * * *',
    format(
      'SELECT net.http_post(
        url:=%L,
        headers:=''{"Content-Type": "application/json"}''::jsonb,
        body:=''{}''::jsonb
      )',
      p_app_url || '/api/cron/daily-report'
    )
  ) INTO job_id;

  RETURN 'Scheduled job ID: ' || job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unschedule_daily_report_cron()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM cron.unschedule('daily-report-every-30min');
  RETURN 'Unscheduled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_daily_report_cron(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unschedule_daily_report_cron() TO authenticated;

-- 5. Fix number generation functions with search_path
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(invoice_number_prefix, 'INV') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.invoice_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_purchase_order_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(po_number_prefix, 'PO') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.po_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_quote_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(quote_number_prefix, 'Q') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.quote_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_return_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(return_number_prefix, 'R') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.return_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT COALESCE(je_number_prefix, 'JE') INTO v_prefix
  FROM public.organizations WHERE id = p_org_id;

  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.je_number_seq'::regclass);

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;
