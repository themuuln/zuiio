-- Migration: P3 Query Optimization — RPC functions + composite indexes
-- Replaces expensive PostgREST queries with optimized RPC functions

-- ============================================================
-- 1. Fast subscription status check (cached per request)
-- ============================================================
CREATE OR REPLACE FUNCTION check_org_subscription_status_fast(
  target_org_id uuid
) RETURNS jsonb AS $$
DECLARE
  _result jsonb;
  _cache_key text;
BEGIN
  _cache_key := 'cache.sub_status_' || target_org_id::text;
  _result := current_setting(_cache_key, true)::jsonb;

  IF _result IS NOT NULL THEN
    RETURN _result;
  END IF;

  SELECT jsonb_build_object(
    'organization_id', o.id,
    'plan_type', COALESCE(s.plan_type, 'none'),
    'status', COALESCE(s.status, 'inactive'),
    'expires_at', s.expires_at,
    'is_active', COALESCE(s.status, 'inactive') = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  ) INTO _result
  FROM organizations o
  LEFT JOIN subscriptions s ON s.organization_id = o.id
  WHERE o.id = target_org_id;

  PERFORM set_config(_cache_key, _result::text, true);

  RETURN COALESCE(_result, jsonb_build_object(
    'organization_id', target_org_id,
    'plan_type', 'none',
    'status', 'inactive',
    'is_active', false
  ));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 2. Work orders list RPC — replaces 44.7ms LATERAL join query
-- ============================================================
CREATE OR REPLACE FUNCTION get_work_orders_list(
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        wo.id,
        wo.status,
        wo.bay_number,
        wo.queue_order,
        wo.created_at,
        wo.completed_at,
        wo.started_at,
        jsonb_build_object(
          'id', c.id,
          'full_name', c.full_name,
          'phone', c.phone
        ) AS customer,
        jsonb_build_object(
          'id', v.id,
          'plate_number', v.plate_number,
          'make', v.make,
          'model', v.model
        ) AS vehicle,
        jsonb_build_object(
          'id', p_m.id,
          'full_name', p_m.full_name
        ) AS mechanic,
        (SELECT count(*) FROM work_order_services WHERE work_order_id = wo.id AND deleted_at IS NULL) AS services_count,
        (SELECT count(*) FROM work_order_parts WHERE work_order_id = wo.id AND deleted_at IS NULL) AS parts_count
      FROM work_orders wo
      LEFT JOIN customers c ON c.id = wo.customer_id
      LEFT JOIN vehicles v ON v.id = wo.vehicle_id
      LEFT JOIN profiles p_m ON p_m.id = wo.mechanic_id
      WHERE wo.organization_id = p_org_id
        AND wo.deleted_at IS NULL
        AND (p_status IS NULL OR wo.status = p_status)
      ORDER BY wo.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 3. Vehicles list RPC — replaces 36.1ms nested join query
-- ============================================================
CREATE OR REPLACE FUNCTION get_vehicles_list(
  p_org_id uuid,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        v.id,
        v.plate_number,
        v.make,
        v.model,
        v.year,
        v.color,
        v.vin,
        v.created_at,
        jsonb_build_object(
          'id', c.id,
          'full_name', c.full_name,
          'phone', c.phone
        ) AS customer,
        (SELECT count(*) FROM work_orders WHERE vehicle_id = v.id AND deleted_at IS NULL) AS work_orders_count
      FROM vehicles v
      LEFT JOIN customers c ON c.id = v.customer_id
      WHERE v.organization_id = p_org_id
        AND v.deleted_at IS NULL
        AND (
          p_search IS NULL
          OR v.plate_number ILIKE '%' || p_search || '%'
          OR v.make ILIKE '%' || p_search || '%'
          OR v.model ILIKE '%' || p_search || '%'
          OR c.full_name ILIKE '%' || p_search || '%'
        )
      ORDER BY v.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 4. Composite indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_work_orders_org_status_created
  ON work_orders (organization_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_org_plate
  ON vehicles (organization_id, plate_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_org_status
  ON invoices (organization_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_org_created
  ON expenses (organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Subquery indexes for RPC count queries
CREATE INDEX IF NOT EXISTS idx_work_order_services_wo_deleted
  ON work_order_services (work_order_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_work_order_parts_wo_deleted
  ON work_order_parts (work_order_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_customer_deleted
  ON vehicles (customer_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_deleted
  ON work_orders (vehicle_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_work_order_deleted
  ON payments (work_order_id)
  WHERE deleted_at IS NULL;
