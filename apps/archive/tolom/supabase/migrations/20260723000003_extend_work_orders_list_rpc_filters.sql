-- ============================================================
-- RPC: get_work_orders_list_with_costs (extended)
--
-- Extended version of the original RPC with support for
-- mechanic_id, date, and multi-status filters. This enables
-- the API route to use the single-query RPC even for complex
-- filter combinations, eliminating the last 2-query fallback.
--
-- New params vs original:
--   p_mechanic_id  — filter by assigned mechanic
--   p_date         — filter by single calendar day (ISO date string)
--   p_statuses     — filter by multiple statuses (overrides p_status)
-- ============================================================

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
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
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
        wo.id,
        wo.organization_id,
        wo.branch_id,
        wo.customer_id,
        wo.vehicle_id,
        wo.status,
        wo.complaint,
        wo.description,
        wo.bay_number,
        wo.created_at,
        wo.updated_at,
        wo.mechanic_id,
        wo.total,
        wo.subtotal,
        wo.discount_total,
        wo.discount_amount,
        wo.discount_percentage,
        wo.odometer_at_service,
        wo.queue_order,
        wo.notes,
        wo.completed_at,
        wo.started_at,
        wo.loss_reason,

        -- Customer
        CASE WHEN c.id IS NOT NULL THEN
          jsonb_build_object(
            'first_name', c.first_name,
            'last_name', c.last_name,
            'phone', c.phone
          )
        ELSE NULL END AS customer,

        -- Vehicle
        CASE WHEN v.id IS NOT NULL THEN
          jsonb_build_object(
            'plate_number', v.plate_number,
            'make', v.make,
            'model', v.model
          )
        ELSE NULL END AS vehicle,

        -- Mechanic profile
        CASE WHEN wo.mechanic_id IS NOT NULL THEN
          jsonb_build_object(
            'id', p_m.id,
            'full_name', p_m.full_name,
            'avatar_url', p_m.avatar_url
          )
        ELSE NULL END AS mechanic,

        -- Costs from the work_order_costs view
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
        -- Status filters: p_statuses (multi) takes priority
        AND (
          (p_statuses IS NOT NULL AND array_length(p_statuses, 1) > 0 AND wo.status = ANY(p_statuses))
          OR (p_statuses IS NULL AND p_status IS NOT NULL AND wo.status = p_status)
          OR (p_statuses IS NULL AND p_status IS NULL)
        )
        AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
        AND (p_mechanic_id IS NULL OR wo.mechanic_id = p_mechanic_id)
        AND (
          p_date IS NULL
          OR (wo.created_at >= p_date::timestamptz AND wo.created_at < (p_date::timestamptz + interval '1 day'))
        )
        AND (
          v_search_pattern IS NULL
          OR COALESCE(c.full_name, '') ILIKE v_search_pattern
          OR COALESCE(v.plate_number, '') ILIKE v_search_pattern
        )
      ORDER BY wo.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) t
  );
END;
$$;
