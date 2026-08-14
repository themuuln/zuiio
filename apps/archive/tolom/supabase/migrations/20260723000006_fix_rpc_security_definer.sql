-- ============================================================
-- Migration: Add SECURITY DEFINER + search_path to RPCs
-- that were created without them in migrations 00001-00003.
--
-- Without SECURITY DEFINER, these functions run as the calling
-- user (e.g. authenticated role via PostgREST/REST API) and RLS
-- policies are applied to every table access within the function.
-- This causes them to return 0 rows when called via API despite
-- the caller having the correct org_id, because RLS filters
-- interact unpredictably with the function's own WHERE clauses.
--
-- With SECURITY DEFINER, the function runs as the owner (postgres)
-- and bypasses RLS, accepting only the explicit p_org_id param
-- for org scoping. This is the standard pattern across all other
-- RPCs in the codebase.
-- ============================================================

-- 1. Drop the basic overload (6 params) — only keep the extended one
DROP FUNCTION IF EXISTS get_work_orders_list_with_costs(
  p_org_id uuid,
  p_status text,
  p_search text,
  p_branch_id uuid,
  p_limit int,
  p_offset int
);

-- 2. Recreate extended overload with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_work_orders_list_with_costs(
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_mechanic_id uuid DEFAULT NULL,
  p_date text DEFAULT NULL,
  p_statuses text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_search_pattern text;
BEGIN
  v_search_pattern := CASE WHEN p_search IS NOT NULL AND p_search != ''
    THEN '%' || p_search || '%'
    ELSE NULL
  END;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        wo.id, wo.organization_id, wo.branch_id, wo.customer_id, wo.vehicle_id,
        wo.status, wo.complaint, wo.description, wo.bay_number,
        wo.created_at, wo.updated_at, wo.mechanic_id,
        wo.total, wo.subtotal, wo.discount_total, wo.discount_amount, wo.discount_percentage,
        wo.odometer_at_service, wo.queue_order, wo.notes, wo.completed_at, wo.started_at, wo.loss_reason,

        CASE WHEN c.id IS NOT NULL THEN
          jsonb_build_object('first_name', c.first_name, 'last_name', c.last_name, 'phone', c.phone)
        ELSE NULL END AS customer,

        CASE WHEN v.id IS NOT NULL THEN
          jsonb_build_object('plate_number', v.plate_number, 'make', v.make, 'model', v.model)
        ELSE NULL END AS vehicle,

        CASE WHEN wo.mechanic_id IS NOT NULL THEN
          jsonb_build_object('id', p_m.id, 'full_name', p_m.full_name, 'avatar_url', p_m.avatar_url)
        ELSE NULL END AS mechanic,

        COALESCE(wc.services_cost, 0) AS services_cost,
        COALESCE(wc.parts_cost, 0) AS parts_cost,
        COALESCE(wc.services_revenue, 0) AS services_revenue,
        COALESCE(wc.parts_revenue, 0) AS parts_revenue,
        COALESCE(wc.gross_profit, 0) AS gross_profit,
        COALESCE(wc.margin_percent, 0) AS margin_percent,
        COALESCE(wo.total, 0) AS grand_total

      FROM work_orders wo
      LEFT JOIN customers c ON c.id = wo.customer_id AND c.deleted_at IS NULL
      LEFT JOIN vehicles v ON v.id = wo.vehicle_id AND v.deleted_at IS NULL
      LEFT JOIN profiles p_m ON p_m.id = wo.mechanic_id
      LEFT JOIN work_order_costs wc ON wc.work_order_id = wo.id
      WHERE wo.organization_id = p_org_id
        AND wo.deleted_at IS NULL
        AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
        AND (p_mechanic_id IS NULL OR wo.mechanic_id = p_mechanic_id)
        AND (p_status IS NULL OR wo.status = p_status)
        AND (p_statuses IS NULL OR wo.status = ANY(p_statuses))
        AND (p_date IS NULL OR wo.created_at::date = p_date::date)
        AND (
          v_search_pattern IS NULL
          OR COALESCE(c.full_name, '') ILIKE v_search_pattern
          OR COALESCE(v.plate_number, '') ILIKE v_search_pattern
        )
      ORDER BY wo.created_at DESC
      LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$;

-- 3. Recreate get_work_order_revenue_details with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_work_order_revenue_details(
  p_wo_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_wo_ids IS NULL OR array_length(p_wo_ids, 1) IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        wc.work_order_id,
        wc.services_revenue,
        wc.parts_revenue,
        wc.total_revenue,
        wc.total_cost,
        wc.gross_profit,
        wc.margin_percent
      FROM work_order_costs wc
      WHERE wc.work_order_id = ANY(p_wo_ids)
    ) t
  );
END;
$$;
