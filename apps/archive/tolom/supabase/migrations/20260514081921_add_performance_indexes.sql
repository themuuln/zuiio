-- Performance indexes for dashboard and report queries
-- Targets expensive query patterns in report-service.ts

-- Dashboard: revenue by period (org_id + status + updated_at)
CREATE INDEX IF NOT EXISTS idx_wo_org_status_updated
  ON work_orders(organization_id, status, updated_at)
  WHERE deleted_at IS NULL;

-- Dashboard: active WO count (org_id + NOT completed/cancelled)
CREATE INDEX IF NOT EXISTS idx_wo_org_active
  ON work_orders(organization_id, status)
  WHERE deleted_at IS NULL
    AND status NOT IN ('Completed', 'Cancelled');

-- Dashboard: status distribution (org_id + status)
CREATE INDEX IF NOT EXISTS idx_wo_org_status
  ON work_orders(organization_id, status)
  WHERE deleted_at IS NULL;

-- Dashboard: recent WOs (org_id + created_at desc)
CREATE INDEX IF NOT EXISTS idx_wo_org_created
  ON work_orders(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Dashboard: daily timeline (org_id + updated_at desc)
CREATE INDEX IF NOT EXISTS idx_wo_org_updated
  ON work_orders(organization_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Batch fetch: services per work order
CREATE INDEX IF NOT EXISTS idx_wos_work_order
  ON work_order_services(work_order_id);

-- Batch fetch: parts per work order
CREATE INDEX IF NOT EXISTS idx_wop_work_order
  ON work_order_parts(work_order_id);

-- Timeline / status history per work order
CREATE INDEX IF NOT EXISTS idx_wosh_work_order_created
  ON work_order_status_history(work_order_id, created_at DESC);

-- Technician performance: org + mechanic
CREATE INDEX IF NOT EXISTS idx_wo_org_mechanic
  ON work_orders(organization_id, mechanic_id, status)
  WHERE deleted_at IS NULL;

-- Customer acquisition trend (org + created_at)
CREATE INDEX IF NOT EXISTS idx_customers_org_created
  ON customers(organization_id, created_at)
  WHERE deleted_at IS NULL;

-- Organization user lookups
CREATE INDEX IF NOT EXISTS idx_org_users_org_role
  ON organization_users(organization_id, role_id);

-- Vehicles by org
CREATE INDEX IF NOT EXISTS idx_vehicles_org
  ON vehicles(organization_id)
  WHERE deleted_at IS NULL;