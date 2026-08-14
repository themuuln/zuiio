DROP MATERIALIZED VIEW IF EXISTS mv_active_bay_work_orders;
CREATE MATERIALIZED VIEW mv_active_bay_work_orders AS
SELECT
  wo.id,
  wo.organization_id,
  wo.branch_id,
  wo.status,
  wo.bay_number,
  wo.queue_order,
  wo.created_at,
  wo.started_at,
  wo.mechanic_id,
  wo.customer_id,
  wo.vehicle_id,
  wo.complaint,
  wo.description,
  wo.notes,
  wo.total,
  wo.subtotal,
  wo.discount_total,
  wo.loss_reason,
  wo.odometer_at_service,
  wo.labor_hours,
  wo.labor_cost,
  v.plate_number,
  v.make AS vehicle_make,
  v.model AS vehicle_model,
  v.year AS vehicle_year,
  v.color AS vehicle_color,
  v.vin AS vehicle_vin,
  v.odometer AS vehicle_odometer,
  c.full_name AS customer_name,
  c.company_name AS customer_company,
  c.phone AS customer_phone,
  p.full_name AS mechanic_name,
  p.avatar_url AS mechanic_avatar,
  COALESCE(svc.services_count, 0) AS services_count,
  COALESCE(svc.services_total, 0) AS services_total,
  COALESCE(pts.parts_count, 0) AS parts_count,
  COALESCE(pts.parts_total, 0) AS parts_total
FROM work_orders wo
LEFT JOIN vehicles v ON v.id = wo.vehicle_id
LEFT JOIN customers c ON c.id = wo.customer_id
LEFT JOIN profiles p ON p.id = wo.mechanic_id
LEFT JOIN LATERAL (
  SELECT count(*) AS services_count, COALESCE(sum(wos.final_price), 0) AS services_total
  FROM work_order_services wos WHERE wos.work_order_id = wo.id
) svc ON true
LEFT JOIN LATERAL (
  SELECT count(*) AS parts_count, COALESCE(sum(wop.final_price), 0) AS parts_total
  FROM work_order_parts wop WHERE wop.work_order_id = wo.id
) pts ON true
WHERE wo.deleted_at IS NULL
  AND wo.status NOT IN ('Completed', 'Cancelled');

CREATE UNIQUE INDEX idx_mv_active_bay_wo_id ON mv_active_bay_work_orders (id);
CREATE INDEX idx_mv_active_bay_wo_org ON mv_active_bay_work_orders (organization_id, bay_number);
CREATE INDEX idx_mv_active_bay_wo_org_status ON mv_active_bay_work_orders (organization_id, status);

SELECT cron.schedule(
  'refresh_mv_active_bay_work_orders',
  '*/2 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_bay_work_orders'
);