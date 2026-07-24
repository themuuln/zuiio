-- Create get_full_dashboard_data: single RPC returning ALL dashboard data
-- Replaces ~18 individual PostgREST queries with one DB call.
--
-- Returns jsonb with keys: summary, summaryComparison, workOrderStatusDistribution,
-- revenueTrend, topServices, technicianPerformance, recentWorkOrders,
-- serviceCategoryBreakdown, customerAcquisitionTrend

CREATE OR REPLACE FUNCTION get_full_dashboard_data(
  p_org_id uuid,
  p_period text DEFAULT 'month',
  p_branch_id uuid DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  _date_from date;
  _date_to date;
  _prev_date_from date;
  _prev_date_to date;
  _day_count int;
  _result jsonb;
BEGIN
  -- ── Authorization ──
  IF p_org_id != get_user_organization_id() THEN
    RAISE EXCEPTION 'Unauthorized: organization mismatch';
  END IF;

  -- ── Period calculation: explicit dates override period ──
  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL THEN
    _date_from := p_date_from;
    _date_to := p_date_to;
  ELSE
    _date_to := CURRENT_DATE;
    _date_from := CASE p_period
      WHEN 'today' THEN _date_to
      WHEN 'week'  THEN _date_to - 6
      WHEN 'month' THEN _date_to - 29
      ELSE '2000-01-01'::date
    END;
  END IF;
  _day_count := _date_to - _date_from + 1;

  IF p_period = 'all' AND p_date_from IS NULL THEN
    _prev_date_from := NULL;
    _prev_date_to := NULL;
  ELSE
    _prev_date_to   := _date_from - 1;
    _prev_date_from := _prev_date_to - _day_count + 1;
  END IF;

  -- ── Build all dashboard data in CTEs ──
  WITH
    -- ── Scope helpers ──
    scope_wo AS (
      SELECT * FROM work_orders wo
      WHERE wo.organization_id = p_org_id
        AND wo.deleted_at IS NULL
        AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
    ),
    scope_customers AS (
      SELECT * FROM customers
      WHERE organization_id = p_org_id
        AND deleted_at IS NULL
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    scope_vehicles AS (
      SELECT * FROM vehicles
      WHERE organization_id = p_org_id
        AND deleted_at IS NULL
    ),

    -- ── Counts ──
    wo_active AS (
      SELECT count(*) AS val FROM scope_wo
      WHERE status NOT IN ('Completed', 'Cancelled')
    ),
    wo_completed_today AS (
      SELECT count(*) AS val FROM scope_wo
      WHERE status = 'Completed' AND completed_at >= date_trunc('day', now())
    ),
    customer_total AS (
      SELECT COUNT(DISTINCT vehicle_id) AS val FROM scope_wo
      WHERE vehicle_id IS NOT NULL
    ),
    vehicle_total AS (
      SELECT count(*) AS val FROM scope_vehicles
    ),

    -- ── Completed WOs in current period ──
    completed_in_period AS (
      SELECT id FROM scope_wo
      WHERE status = 'Completed'
        AND updated_at >= _date_from
        AND updated_at < _date_to + 1
    ),
    -- ── all_completed removed — top_services, cat_breakdown now use completed_in_period ──

    -- ── Revenue: services + parts for completed WOs in period ──
    period_services AS (
      SELECT
        COALESCE(sum(wos.final_price), 0) AS service_revenue,
        COALESCE(sum(wos.unit_cost * wos.quantity), 0) AS service_cost
      FROM work_order_services wos
      WHERE wos.work_order_id IN (SELECT id FROM completed_in_period)
    ),
    period_parts AS (
      SELECT
        COALESCE(sum(wop.final_price), 0) AS parts_revenue,
        COALESCE(sum(wop.unit_cost * wop.quantity), 0) AS parts_cost
      FROM work_order_parts wop
      WHERE wop.work_order_id IN (SELECT id FROM completed_in_period)
    ),

    -- ── Status distribution ──
    status_dist AS (
      SELECT status, count(*) AS count
      FROM scope_wo
      GROUP BY status
      ORDER BY count DESC
    ),

    -- ── Revenue trend (daily for the period) ──
    daily_wo AS (
      SELECT id, updated_at::date AS d
      FROM scope_wo
      WHERE status = 'Completed'
        AND updated_at >= _date_from
        AND updated_at < _date_to + 1
    ),
    daily_rev_svcs AS (
      SELECT dw.d, sum(wos.final_price) AS rev
      FROM daily_wo dw
      JOIN work_order_services wos ON wos.work_order_id = dw.id
      GROUP BY dw.d
    ),
    daily_rev_parts AS (
      SELECT dw.d, sum(wop.final_price) AS rev
      FROM daily_wo dw
      JOIN work_order_parts wop ON wop.work_order_id = dw.id
      GROUP BY dw.d
    ),
    daily_rev AS (
      SELECT COALESCE(s.d, p.d) AS d,
        COALESCE(s.rev, 0) + COALESCE(p.rev, 0) AS revenue,
        (SELECT count(*) FROM daily_wo WHERE d = COALESCE(s.d, p.d)) AS work_orders
      FROM daily_rev_svcs s
      FULL JOIN daily_rev_parts p ON p.d = s.d
    ),

    -- ── Top services (current period only) ──
    top_services AS (
      SELECT
        wos.service_name AS name,
        count(*) AS count,
        sum(wos.final_price) AS revenue
      FROM work_order_services wos
      WHERE wos.work_order_id IN (SELECT id FROM completed_in_period)
      GROUP BY wos.service_name
      ORDER BY revenue DESC
      LIMIT 10
    ),

    -- ── Technician performance ──
    tech_perf AS (
      SELECT
        pr.id,
        pr.full_name AS name,
        count(DISTINCT wo.id) AS total_orders,
        count(DISTINCT wo.id) FILTER (WHERE wo.status = 'Completed') AS completed_orders,
        COALESCE(sum(wos.final_price), 0) AS revenue,
        CASE
          WHEN count(DISTINCT wo.id) FILTER (WHERE wo.completed_at IS NOT NULL) > 0
          THEN round(avg(extract(epoch FROM (wo.completed_at - wo.created_at)) / 3600.0), 1)
          ELSE 0
        END AS avg_hours
      FROM profiles pr
      JOIN scope_wo wo ON wo.mechanic_id = pr.id
      LEFT JOIN work_order_services wos ON wos.work_order_id = wo.id
      WHERE wo.created_at >= _date_from
      GROUP BY pr.id, pr.full_name
      ORDER BY revenue DESC
    ),

    -- ── Service category breakdown (current period only) ──
    cat_breakdown AS (
      SELECT
        COALESCE(sc.category, 'Бусад') AS category,
        count(*) AS count,
        sum(wos.final_price) AS revenue
      FROM work_order_services wos
      LEFT JOIN service_catalog sc ON sc.id = wos.service_catalog_id
      WHERE wos.work_order_id IN (SELECT id FROM completed_in_period)
      GROUP BY sc.category
      ORDER BY revenue DESC
    ),

    -- ── Customer acquisition trend (monthly, last 12 months) ──
    monthly_acq AS (
      SELECT
        to_char(created_at, 'YYYY-MM') AS month,
        count(*) AS new_customers
      FROM scope_customers
      WHERE created_at >= date_trunc('month', now()) - interval '11 months'
      GROUP BY month
      ORDER BY month
    ),

    -- ── Recent 10 work orders ──
    recent_ids AS (
      SELECT id FROM scope_wo
      ORDER BY created_at DESC LIMIT 10
    ),
    recent_svcs AS (
      SELECT wos.work_order_id,
        jsonb_agg(jsonb_build_object(
          'id', wos.id,
          'work_order_id', wos.work_order_id,
          'service_name', wos.service_name,
          'final_price', wos.final_price,
          'quantity', wos.quantity,
          'unit_cost', wos.unit_cost,
          'discount_amount', wos.discount_amount
        ) ORDER BY wos.created_at) AS items
      FROM work_order_services wos
      WHERE wos.work_order_id IN (SELECT id FROM recent_ids)
      GROUP BY wos.work_order_id
    ),
    recent_prts AS (
      SELECT wop.work_order_id,
        jsonb_agg(jsonb_build_object(
          'id', wop.id,
          'work_order_id', wop.work_order_id,
          'part_name', wop.part_name,
          'final_price', wop.final_price,
          'quantity', wop.quantity,
          'unit_cost', wop.unit_cost,
          'discount_amount', wop.discount_amount
        ) ORDER BY wop.created_at) AS items
      FROM work_order_parts wop
      WHERE wop.work_order_id IN (SELECT id FROM recent_ids)
      GROUP BY wop.work_order_id
    ),
    recent_wos AS (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', wo.id,
          'organization_id', wo.organization_id,
          'branch_id', wo.branch_id,
          'customer_id', wo.customer_id,
          'vehicle_id', wo.vehicle_id,
          'mechanic_id', wo.mechanic_id,
          'status', wo.status,
          'complaint', wo.complaint,
          'diagnosis', wo.diagnosis,
          'description', wo.description,
          'notes', wo.notes,
          'mechanic_notes', wo.mechanic_notes,
          'diagnosis_label_id', wo.diagnosis_label_id,
          'bay_number', wo.bay_number,
          'queue_order', wo.queue_order,
          'odometer_at_service', wo.odometer_at_service,
          'discount_amount', wo.discount_amount,
          'discount_percentage', wo.discount_percentage,
          'discount_total', wo.discount_total,
          'subtotal', wo.subtotal,
          'total', wo.total,
          'completed_at', wo.completed_at,
          'started_at', wo.started_at,
          'created_at', wo.created_at,
          'updated_at', wo.updated_at,
          'created_by', wo.created_by,
          'updated_by', wo.updated_by,
          'customer', CASE WHEN c.id IS NOT NULL THEN
            jsonb_build_object(
              'id', c.id, 'first_name', c.first_name, 'last_name', c.last_name,
              'phone', c.phone, 'email', c.email,
              'full_name', c.full_name, 'company_name', c.company_name
            )
          ELSE NULL END,
          'vehicle', CASE WHEN v.id IS NOT NULL THEN
            jsonb_build_object(
              'id', v.id, 'plate_number', v.plate_number, 'make', v.make,
              'model', v.model, 'year', v.year, 'color', v.color,
              'vin', v.vin
            )
          ELSE NULL END,
          'services', COALESCE(s.items, '[]'::jsonb),
          'parts', COALESCE(p.items, '[]'::jsonb),
          'helpers', '[]'::jsonb,
          'status_history', '[]'::jsonb,
          'service_history', '[]'::jsonb,
          'attachments', '[]'::jsonb
        ) ORDER BY wo.created_at DESC
      ) AS items
      FROM recent_ids ri
      JOIN work_orders wo ON wo.id = ri.id
      LEFT JOIN customers c ON c.id = wo.customer_id
      LEFT JOIN vehicles v ON v.id = wo.vehicle_id
      LEFT JOIN recent_svcs s ON s.work_order_id = wo.id
      LEFT JOIN recent_prts p ON p.work_order_id = wo.id
    ),

    -- ── Previous period summary (for comparison) ──
    prev_period AS (
      SELECT
        COALESCE(ps.service_revenue + pp.parts_revenue, 0) AS total_revenue,
        0 AS active_work_orders,
        0 AS completed_today,
        0 AS new_customers_today,
        CASE WHEN pc.count > 0
          THEN round(((COALESCE(ps.service_revenue, 0) + COALESCE(pp.parts_revenue, 0)) / pc.count) * 100) / 100
          ELSE 0
        END AS avg_repair_order_value,
        COALESCE(pp.parts_revenue, 0) AS parts_revenue,
        COALESCE(ps.service_revenue, 0) AS service_revenue,
        COALESCE(ps.service_revenue + pp.parts_revenue - ps.service_cost - pp.parts_cost, 0) AS gross_profit,
        CASE WHEN (ps.service_revenue + pp.parts_revenue) > 0
          THEN round(((ps.service_revenue + pp.parts_revenue - ps.service_cost - pp.parts_cost) / (ps.service_revenue + pp.parts_revenue)) * 100)
          ELSE 0
        END AS margin_percent,
        0 AS total_customers,
        0 AS total_vehicles
      FROM (
        SELECT
          COALESCE(sum(wos.final_price), 0) AS service_revenue,
          COALESCE(sum(wos.unit_cost * wos.quantity), 0) AS service_cost
        FROM work_order_services wos
        JOIN work_orders wo ON wo.id = wos.work_order_id
        WHERE wo.organization_id = p_org_id
          AND wo.deleted_at IS NULL
          AND wo.status = 'Completed'
          AND (_prev_date_from IS NULL OR wo.updated_at >= _prev_date_from)
          AND (_prev_date_to IS NULL OR wo.updated_at < _prev_date_to + 1)
          AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
      ) ps,
      (
        SELECT
          COALESCE(sum(wop.final_price), 0) AS parts_revenue,
          COALESCE(sum(wop.unit_cost * wop.quantity), 0) AS parts_cost
        FROM work_order_parts wop
        JOIN work_orders wo ON wo.id = wop.work_order_id
        WHERE wo.organization_id = p_org_id
          AND wo.deleted_at IS NULL
          AND wo.status = 'Completed'
          AND (_prev_date_from IS NULL OR wo.updated_at >= _prev_date_from)
          AND (_prev_date_to IS NULL OR wo.updated_at < _prev_date_to + 1)
          AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
      ) pp,
      (
        SELECT count(*)::numeric AS count
        FROM work_orders wo
        WHERE wo.organization_id = p_org_id
          AND wo.deleted_at IS NULL
          AND wo.status = 'Completed'
          AND (_prev_date_from IS NULL OR wo.updated_at >= _prev_date_from)
          AND (_prev_date_to IS NULL OR wo.updated_at < _prev_date_to + 1)
          AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
      ) pc
    )

  -- ── Assemble final JSON ──
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'totalRevenue', (SELECT COALESCE(ps.service_revenue + pp.parts_revenue, 0) FROM period_services ps, period_parts pp),
      'activeWorkOrders', (SELECT val FROM wo_active),
      'completedToday', (SELECT val FROM wo_completed_today),
      'newCustomersToday', 0,
      'avgRepairOrderValue', CASE WHEN (SELECT count(*) FROM completed_in_period) > 0
        THEN round((SELECT (ps.service_revenue + pp.parts_revenue) / (SELECT count(*)::numeric FROM completed_in_period) FROM period_services ps, period_parts pp) * 100) / 100
        ELSE 0 END,
      'partsRevenue', (SELECT parts_revenue FROM period_parts),
      'serviceRevenue', (SELECT service_revenue FROM period_services),
      'grossProfit', (SELECT (ps.service_revenue + pp.parts_revenue - ps.service_cost - pp.parts_cost) FROM period_services ps, period_parts pp),
      'marginPercent', CASE WHEN (SELECT ps.service_revenue + pp.parts_revenue FROM period_services ps, period_parts pp) > 0
        THEN round(((SELECT (ps.service_revenue + pp.parts_revenue - ps.service_cost - pp.parts_cost) FROM period_services ps, period_parts pp) * 100.0 /
          (SELECT ps.service_revenue + pp.parts_revenue FROM period_services ps, period_parts pp))::numeric)
        ELSE 0 END,
      'totalCustomers', (SELECT val FROM customer_total),
      'totalVehicles', (SELECT val FROM vehicle_total)
    ),
    'summaryComparison', CASE WHEN p_period != 'all' OR p_date_from IS NOT NULL THEN
      (SELECT row_to_json(pp.*)::jsonb FROM prev_period pp)
    ELSE NULL END,
    'workOrderStatusDistribution', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('status', status, 'count', count)) FROM status_dist),
      '[]'::jsonb
    ),
    'revenueTrend', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('date', d::text, 'revenue', revenue, 'workOrders', work_orders)
        ORDER BY d
      ) FROM daily_rev),
      '[]'::jsonb
    ),
    'topServices', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('name', name, 'revenue', revenue, 'count', count)
      ) FROM top_services),
      '[]'::jsonb
    ),
    'technicianPerformance', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id, 'name', name, 'completedOrders', completed_orders,
          'revenue', revenue, 'avgJobValue', 0, 'jobsPerDay', 0
        )
      ) FROM tech_perf),
      '[]'::jsonb
    ),
    'recentWorkOrders', COALESCE(
      (SELECT items FROM recent_wos),
      '[]'::jsonb
    ),
    'serviceCategoryBreakdown', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('category', category, 'revenue', revenue, 'count', count)
      ) FROM cat_breakdown),
      '[]'::jsonb
    ),
    'customerAcquisitionTrend', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('month', month, 'newCustomers', new_customers)
        ORDER BY month
      ) FROM monthly_acq),
      '[]'::jsonb
    )
  ) INTO _result;

  RETURN _result;
END;
$$;
