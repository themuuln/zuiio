-- Add missing indexes for multi-tenant query performance
-- Targets slow query patterns identified in performance audit.

-- Subscription expiry scan: edge function queries status + expires_at
-- subscription_plans has no deleted_at column (immutable lifecycle table).
create index if not exists idx_sub_plans_status_expires
  on subscription_plans(status, expires_at);

-- Parts catalog lookup by part_number within an org
create index if not exists idx_parts_catalog_org_part_number
  on parts_catalog(organization_id, part_number)
  where deleted_at is null;

-- Purchase order listing filtered by status
create index if not exists idx_purchase_orders_org_status
  on purchase_orders(organization_id, status)
  where deleted_at is null;

-- Inventory balances view grouping + ordering
-- inventory_movements is append-only (no soft-delete), so no partial filter.
create index if not exists idx_inventory_movements_org_part_created
  on inventory_movements(organization_id, part_id, created_at desc);

-- Supplier search by name within an org
create index if not exists idx_suppliers_org_name
  on suppliers(organization_id, name)
  where deleted_at is null;
