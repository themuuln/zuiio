-- Optimize public stats RPC queries with targeted indexes
-- get_public_stats runs 3 sequential-scan subqueries on every landing page visit
-- These partial indexes enable index-only scans for count/avg aggregations

-- organizations: count of active (non-deleted) orgs
CREATE INDEX IF NOT EXISTS idx_organizations_active_non_deleted
  ON public.organizations (id)
  WHERE is_active = true AND deleted_at IS NULL;

-- work_orders: count of non-deleted work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_non_deleted
  ON public.work_orders (id)
  WHERE deleted_at IS NULL;

-- service_completion_data: avg satisfaction among non-null entries
CREATE INDEX IF NOT EXISTS idx_service_completion_satisfaction
  ON public.service_completion_data (customer_satisfaction)
  WHERE customer_satisfaction IS NOT NULL;
