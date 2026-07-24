-- ============================================================
-- RPC: get_work_orders_list_with_costs
--
-- Single-query replacement for the 2-query pattern in
-- getWorkOrders() (PostgREST join + separate work_order_costs
-- view fetch). Returns everything the list page needs in one
-- DB round-trip: work order fields, customer, vehicle, mechanic
-- profile, and cost/revenue/profit data from work_order_costs.
--
-- Supports filtering by status, search (id, customer name,
-- plate number), and branch.
-- ============================================================

CREATE OR REPLACE FUNCTION get_work_orders_list_with_costs(
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
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
        -- grand_total isn't in the view but maps to wo.total
        COALESCE(wo.total, 0) AS grand_total

      FROM work_orders wo
      LEFT JOIN customers c ON c.id = wo.customer_id AND c.deleted_at IS NULL
      LEFT JOIN vehicles v ON v.id = wo.vehicle_id AND v.deleted_at IS NULL
      LEFT JOIN profiles p_m ON p_m.id = wo.mechanic_id
      LEFT JOIN work_order_costs wc ON wc.work_order_id = wo.id
      WHERE wo.organization_id = p_org_id
        AND wo.deleted_at IS NULL
        AND (p_status IS NULL OR wo.status = p_status)
        AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
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
