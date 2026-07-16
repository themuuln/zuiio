-- Fix: Remove SECURITY DEFINER from all 3 views flagged by Supabase Advisor
--
-- 1. v_security_definer_audit: Pure audit view calling SECURITY INVOKER function.
--    Removing SECURITY DEFINER is safe -- the function itself is INVOKER.
--
-- 2. work_order_costs: Pure SQL aggregation view.
--    Removing SECURITY DEFINER allows RLS on underlying tables to apply.
--
-- 3. app_config_view: Calls vault_get_secret() (SECURITY DEFINER, service_role only).
--    Removing SECURITY DEFINER means authenticated role can no longer call vault_get_secret.
--    Remove authenticated's SELECT grant -- secrets should never be client-accessible.

-- 1. Fix v_security_definer_audit
DROP VIEW IF EXISTS public.v_security_definer_audit;
CREATE VIEW public.v_security_definer_audit AS
SELECT * FROM audit_security_definer_functions();

-- 2. Fix work_order_costs
DROP VIEW IF EXISTS public.work_order_costs;
CREATE VIEW public.work_order_costs AS
SELECT
  wo.id AS work_order_id,
  wo.organization_id,
  COALESCE(s.services_cost, 0::numeric) AS services_cost,
  COALESCE(p.parts_cost, 0::numeric) AS parts_cost,
  COALESCE(s.services_revenue, 0::numeric) AS services_revenue,
  COALESCE(p.parts_revenue, 0::numeric) AS parts_revenue,
  COALESCE(s.services_revenue, 0::numeric) + COALESCE(p.parts_revenue, 0::numeric) AS total_revenue,
  COALESCE(s.services_cost, 0::numeric) + COALESCE(p.parts_cost, 0::numeric) AS total_cost,
  COALESCE(s.services_revenue, 0::numeric) + COALESCE(p.parts_revenue, 0::numeric) - (COALESCE(s.services_cost, 0::numeric) + COALESCE(p.parts_cost, 0::numeric)) AS gross_profit,
  CASE
    WHEN (COALESCE(s.services_revenue, 0::numeric) + COALESCE(p.parts_revenue, 0::numeric)) > 0::numeric
    THEN round((COALESCE(s.services_revenue, 0::numeric) + COALESCE(p.parts_revenue, 0::numeric) - (COALESCE(s.services_cost, 0::numeric) + COALESCE(p.parts_cost, 0::numeric))) / (COALESCE(s.services_revenue, 0::numeric) + COALESCE(p.parts_revenue, 0::numeric)) * 100::numeric, 2)
    ELSE 0::numeric
  END AS margin_percent
FROM work_orders wo
LEFT JOIN (
  SELECT work_order_services.work_order_id,
    sum(work_order_services.unit_cost * work_order_services.quantity::numeric) AS services_cost,
    sum(work_order_services.final_price) AS services_revenue
  FROM work_order_services
  GROUP BY work_order_services.work_order_id
) s ON s.work_order_id = wo.id
LEFT JOIN (
  SELECT work_order_parts.work_order_id,
    sum(work_order_parts.unit_cost * work_order_parts.quantity::numeric) AS parts_cost,
    sum(work_order_parts.final_price) AS parts_revenue
  FROM work_order_parts
  GROUP BY work_order_parts.work_order_id
) p ON p.work_order_id = wo.id;

-- 3. Fix app_config_view -- remove SECURITY DEFINER
DROP VIEW IF EXISTS public.app_config_view;
CREATE VIEW public.app_config_view AS
SELECT
  ac.key,
  COALESCE(vault_get_secret(ac.key), ac.value) AS value,
  ac.updated_at,
  (vault_get_secret(ac.key) IS NOT NULL) AS in_vault
FROM public.app_config ac;

-- Revoke authenticated access to app_config_view (vault_get_secret not available to them)
REVOKE SELECT ON public.app_config_view FROM authenticated;
REVOKE SELECT ON public.app_config_view FROM anon;

-- Ensure service_role retains access (has EXECUTE on vault_get_secret)
GRANT SELECT ON public.app_config_view TO service_role;
