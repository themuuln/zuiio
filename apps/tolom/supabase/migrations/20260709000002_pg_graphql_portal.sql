-- Migration: pg_graphql for customer portal
-- Exposes customer-facing tables via GraphQL at /graphql/v1
-- All views are org-scoped via RLS (security_invoker) + explicit org_id filter

-- 1. Ensure pg_graphql is installed
CREATE EXTENSION IF NOT EXISTS pg_graphql;

-- 2. GraphQL-friendly schema
CREATE SCHEMA IF NOT EXISTS graphql_api;

-- 3. Customer portal view (org-scoped)
CREATE OR REPLACE VIEW graphql_api.customer_portal AS
SELECT
  c.id AS customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.company_name,
  c.created_at
FROM public.customers c
WHERE c.organization_id = get_user_organization_id()
  AND c.deleted_at IS NULL;

-- 4. Portal vehicles view (org-scoped via RLS)
CREATE OR REPLACE VIEW graphql_api.portal_vehicles AS
SELECT
  v.id AS vehicle_id,
  v.plate_number,
  v.make,
  v.model,
  v.year,
  v.vin,
  v.color,
  v.odometer,
  v.last_visit_at,
  v.next_service_at,
  v.organization_id
FROM public.vehicles v
WHERE v.organization_id = get_user_organization_id()
  AND v.deleted_at IS NULL;

-- 5. Service history view (org-scoped via RLS)
CREATE OR REPLACE VIEW graphql_api.portal_service_history AS
SELECT
  wo.id AS work_order_id,
  wo.created_at,
  wo.completed_at,
  wo.status,
  wo.total,
  wo.complaint,
  wo.diagnosis,
  wo.mechanic_notes,
  v.plate_number,
  v.make AS vehicle_make,
  v.model AS vehicle_model
FROM public.work_orders wo
JOIN public.vehicles v ON v.id = wo.vehicle_id
WHERE wo.organization_id = get_user_organization_id()
  AND wo.deleted_at IS NULL;

-- 6. Access grants
GRANT USAGE ON SCHEMA graphql_api TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA graphql_api TO authenticated;

-- 7. GraphQL annotations
COMMENT ON VIEW graphql_api.customer_portal IS '@graphql(name "Customer")';
COMMENT ON VIEW graphql_api.portal_vehicles IS '@graphql(name "Vehicle")';
COMMENT ON VIEW graphql_api.portal_service_history IS '@graphql(name "ServiceHistory")';

-- 8. RLS enforcement via security invoker
ALTER VIEW graphql_api.customer_portal SET (security_invoker = true);
ALTER VIEW graphql_api.portal_vehicles SET (security_invoker = true);
ALTER VIEW graphql_api.portal_service_history SET (security_invoker = true);
