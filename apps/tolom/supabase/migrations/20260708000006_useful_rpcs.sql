-- Migration: 5 Useful RPCs for common high-traffic queries
-- Each replaces multiple PostgREST round-trips with a single DB call

-- ============================================================
-- 1. get_dashboard_metrics — KPI dashboard
--    Replaces 5+ parallel PostgREST queries with one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_org_id uuid)
RETURNS jsonb AS $$
BEGIN
  IF p_org_id != get_user_organization_id() THEN RAISE EXCEPTION 'Unauthorized: organization mismatch'; END IF;

  RETURN jsonb_build_object(
    'work_orders', jsonb_build_object(
      'total', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL),
      'active', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status NOT IN ('Completed', 'Cancelled')),
      'completed_today', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status = 'Completed' AND completed_at >= date_trunc('day', now())),
      'completed_week', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status = 'Completed' AND completed_at >= date_trunc('week', now()))
    ),
    'revenue', jsonb_build_object(
      'today', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('day', now())), 0),
      'week', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('week', now())), 0),
      'month', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('month', now())), 0)
    ),
    'customers', jsonb_build_object(
      'total', (SELECT count(*) FROM customers WHERE organization_id = p_org_id AND deleted_at IS NULL),
      'new_this_month', (SELECT count(*) FROM customers WHERE organization_id = p_org_id AND deleted_at IS NULL AND created_at >= date_trunc('month', now()))
    ),
    'inventory', jsonb_build_object(
      'low_stock', (SELECT count(*) FROM inventory_balances WHERE organization_id = p_org_id AND quantity_on_hand <= 5),
      'out_of_stock', (SELECT count(*) FROM inventory_balances WHERE organization_id = p_org_id AND quantity_on_hand <= 0)
    ),
    'mechanics', jsonb_build_object(
      'active', (SELECT count(DISTINCT mechanic_id) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status IN ('In Progress', 'Diagnosing') AND mechanic_id IS NOT NULL),
      'total_orders_today', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND created_at >= date_trunc('day', now()))
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 2. get_customers_with_value — Customer list + lifetime value
--    Replaces 3 nested joins with one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_customers_with_value(
  p_org_id uuid,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb AS $$
BEGIN
  IF p_org_id != get_user_organization_id() THEN RAISE EXCEPTION 'Unauthorized: organization mismatch'; END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        c.id, c.full_name, c.first_name, c.last_name, c.phone, c.email,
        c.company_name, c.created_at, c.last_visit_at,
        COALESCE(visits.total_visits, 0) AS total_visits,
        COALESCE(spent.total_spent, 0) AS total_spent,
        COALESCE(veh.vehicles_count, 0) AS vehicles_count
      FROM customers c
      LEFT JOIN LATERAL (SELECT count(*) AS total_visits FROM work_orders wo WHERE wo.customer_id = c.id AND wo.deleted_at IS NULL) visits ON true
      LEFT JOIN LATERAL (SELECT COALESCE(sum(py.amount), 0) AS total_spent FROM work_orders wo2 JOIN payments py ON py.work_order_id = wo2.id AND py.deleted_at IS NULL WHERE wo2.customer_id = c.id AND wo2.deleted_at IS NULL) spent ON true
      LEFT JOIN LATERAL (SELECT count(*) AS vehicles_count FROM vehicles v WHERE v.customer_id = c.id AND v.deleted_at IS NULL) veh ON true
      WHERE c.organization_id = p_org_id AND c.deleted_at IS NULL
        AND (p_search IS NULL OR c.full_name ILIKE '%' || p_search || '%' OR c.phone ILIKE '%' || p_search || '%' OR c.company_name ILIKE '%' || p_search || '%')
      ORDER BY c.created_at DESC LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 3. get_inventory_with_stock — Inventory + stock levels + thresholds
--    Replaces 2 joins + LATERAL with one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_inventory_with_stock(
  p_org_id uuid,
  p_search text DEFAULT NULL,
  p_low_stock_only boolean DEFAULT false,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb AS $$
BEGIN
  IF p_org_id != get_user_organization_id() THEN RAISE EXCEPTION 'Unauthorized: organization mismatch'; END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT ib.part_id, ib.part_name, ib.part_number, ib.category, ib.unit,
        ib.default_price, ib.quantity_on_hand, ib.last_movement_at,
        COALESCE(st.minimum_quantity, 0) AS min_threshold,
        COALESCE(st.maximum_quantity, 0) AS max_threshold,
        CASE
          WHEN ib.quantity_on_hand <= 0 THEN 'out_of_stock'
          WHEN ib.quantity_on_hand <= COALESCE(st.minimum_quantity, 5) THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM inventory_balances ib
      LEFT JOIN stock_thresholds st ON st.part_id = ib.part_id AND st.organization_id = ib.organization_id
      WHERE ib.organization_id = p_org_id
        AND (p_search IS NULL OR ib.part_name ILIKE '%' || p_search || '%' OR ib.part_number ILIKE '%' || p_search || '%')
        AND (p_low_stock_only = false OR ib.quantity_on_hand <= COALESCE(st.minimum_quantity, 5))
      ORDER BY ib.quantity_on_hand ASC, ib.part_name LIMIT p_limit OFFSET p_offset
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 4. get_finance_summary — Revenue/expense/net profit
--    Replaces 4+ parallel queries with one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_finance_summary(
  p_org_id uuid,
  p_period text DEFAULT 'month'
)
RETURNS jsonb AS $$
DECLARE _start_date timestamptz;
BEGIN
  IF p_org_id != get_user_organization_id() THEN RAISE EXCEPTION 'Unauthorized: organization mismatch'; END IF;

  _start_date := date_trunc(p_period, now());
  RETURN jsonb_build_object(
    'period', p_period, 'start_date', _start_date,
    'revenue', jsonb_build_object(
      'total', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= _start_date), 0),
      'count', (SELECT count(*) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= _start_date),
      'by_method', COALESCE((SELECT jsonb_object_agg(payment_method, total) FROM (SELECT payment_method, sum(amount) AS total FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= _start_date GROUP BY payment_method) m), '{}'::jsonb)
    ),
    'expenses', jsonb_build_object(
      'total', COALESCE((SELECT sum(amount) FROM expenses WHERE organization_id = p_org_id AND deleted_at IS NULL AND expense_date >= _start_date::date), 0),
      'count', (SELECT count(*) FROM expenses WHERE organization_id = p_org_id AND deleted_at IS NULL AND expense_date >= _start_date::date),
      'by_category', COALESCE((SELECT jsonb_object_agg(category_name, total) FROM (SELECT ec.name AS category_name, sum(e.amount) AS total FROM expenses e JOIN expense_categories ec ON ec.id = e.category_id WHERE e.organization_id = p_org_id AND e.deleted_at IS NULL AND e.expense_date >= _start_date::date GROUP BY ec.name) c), '{}'::jsonb)
    ),
    'refunds', jsonb_build_object(
      'total', COALESCE((SELECT sum(amount) FROM invoice_refunds WHERE organization_id = p_org_id AND refunded_at >= _start_date), 0),
      'count', (SELECT count(*) FROM invoice_refunds WHERE organization_id = p_org_id AND refunded_at >= _start_date)
    ),
    'net_profit', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= _start_date), 0)
      - COALESCE((SELECT sum(amount) FROM expenses WHERE organization_id = p_org_id AND deleted_at IS NULL AND expense_date >= _start_date::date), 0)
      - COALESCE((SELECT sum(amount) FROM invoice_refunds WHERE organization_id = p_org_id AND refunded_at >= _start_date), 0)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================
-- 5. get_mechanic_leaderboard — Mechanic performance ranking
--    Replaces 3 joins + aggregation with one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_mechanic_leaderboard(
  p_org_id uuid,
  p_period text DEFAULT 'month'
)
RETURNS jsonb AS $$
DECLARE _start_date timestamptz;
BEGIN
  IF p_org_id != get_user_organization_id() THEN RAISE EXCEPTION 'Unauthorized: organization mismatch'; END IF;

  _start_date := CASE p_period WHEN 'week' THEN date_trunc('week', now()) WHEN 'year' THEN date_trunc('year', now()) ELSE date_trunc('month', now()) END;
  RETURN (SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.revenue DESC), '[]'::jsonb) FROM (
    SELECT
      p.id AS mechanic_id, p.full_name AS mechanic_name, p.avatar_url,
      count(DISTINCT wo.id) AS total_orders,
      count(DISTINCT wo.id) FILTER (WHERE wo.status = 'Completed') AS completed_orders,
      sum(COALESCE(wos_rev.total, 0)) AS revenue,
      sum(COALESCE(wop_cost.total, 0)) AS parts_cost,
      CASE WHEN count(DISTINCT wo.id) FILTER (WHERE wo.completed_at IS NOT NULL) > 0 THEN round(avg(extract(epoch FROM (wo.completed_at - wo.created_at)) / 3600.0), 1) ELSE 0 END AS avg_hours_per_order
    FROM profiles p
    JOIN work_orders wo ON wo.mechanic_id = p.id AND wo.deleted_at IS NULL AND wo.created_at >= _start_date
    LEFT JOIN LATERAL (SELECT COALESCE(sum(final_price), 0) AS total FROM work_order_services WHERE work_order_id = wo.id) wos_rev ON true
    LEFT JOIN LATERAL (SELECT COALESCE(sum(final_price), 0) AS total FROM work_order_parts WHERE work_order_id = wo.id) wop_cost ON true
    WHERE p.organization_id = p_org_id
    GROUP BY p.id, p.full_name, p.avatar_url
  ) t);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
