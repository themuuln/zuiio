-- Update get_dashboard_metrics RPC:
--   - customers.total now counts DISTINCT vehicle_id from work_orders
--     (every work order has a vehicle → a real human; walk-ins without
--      formal customer records are still counted)
--   - customers.registered preserves the original customers-table count
--   - vehicles.total added for the vehicle count KPI

CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_org_id uuid)
RETURNS jsonb AS $$
BEGIN
  IF p_org_id != get_user_organization_id() THEN
    RAISE EXCEPTION 'Unauthorized: organization mismatch';
  END IF;

  RETURN jsonb_build_object(
    'work_orders', jsonb_build_object(
      'total',        (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL),
      'active',       (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status NOT IN ('Completed', 'Cancelled')),
      'completed_today', (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status = 'Completed' AND completed_at >= date_trunc('day', now())),
      'completed_week',  (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status = 'Completed' AND completed_at >= date_trunc('week', now()))
    ),
    'revenue', jsonb_build_object(
      'today', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('day', now())), 0),
      'week',  COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('week', now())), 0),
      'month', COALESCE((SELECT sum(amount) FROM payments WHERE organization_id = p_org_id AND deleted_at IS NULL AND paid_at >= date_trunc('month', now())), 0)
    ),
    'customers', jsonb_build_object(
      'total',           (SELECT COUNT(DISTINCT wo.vehicle_id) FROM work_orders wo WHERE wo.organization_id = p_org_id AND wo.deleted_at IS NULL AND wo.vehicle_id IS NOT NULL),
      'registered',      (SELECT count(*) FROM customers WHERE organization_id = p_org_id AND deleted_at IS NULL),
      'new_this_month',  (SELECT count(*) FROM customers WHERE organization_id = p_org_id AND deleted_at IS NULL AND created_at >= date_trunc('month', now()))
    ),
    'vehicles', jsonb_build_object(
      'total', (SELECT count(*) FROM vehicles WHERE organization_id = p_org_id AND deleted_at IS NULL)
    ),
    'inventory', jsonb_build_object(
      'low_stock',    (SELECT count(*) FROM inventory_balances WHERE organization_id = p_org_id AND quantity_on_hand <= 5),
      'out_of_stock', (SELECT count(*) FROM inventory_balances WHERE organization_id = p_org_id AND quantity_on_hand <= 0)
    ),
    'mechanics', jsonb_build_object(
      'active',              (SELECT count(DISTINCT mechanic_id) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND status IN ('In Progress', 'Diagnosing') AND mechanic_id IS NOT NULL),
      'total_orders_today',  (SELECT count(*) FROM work_orders WHERE organization_id = p_org_id AND deleted_at IS NULL AND created_at >= date_trunc('day', now()))
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
