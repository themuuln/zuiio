-- Add missing indexes for multi-tenant query performance
-- Targets slow query patterns identified in performance audit.

-- Subscription expiry scan: edge function queries status + expires_at
-- Currently does sequential scan on subscription_plans.
create index if not exists idx_sub_plans_status_expires
  on subscription_plans(status, expires_at)
  where deleted_at is null;

-- Parts catalog lookup by part_number within an org
-- Common in work order creation and inventory management.
create index if not exists idx_parts_catalog_org_part_number
  on parts_catalog(organization_id, part_number)
  where deleted_at is null;

-- Purchase order listing filtered by status
create index if not exists idx_purchase_orders_org_status
  on purchase_orders(organization_id, status)
  where deleted_at is null;

-- Inventory balances view grouping + ordering
-- Supports the ledger-based inventory_balances computation.
create index if not exists idx_inventory_movements_org_part_created
  on inventory_movements(organization_id, part_id, created_at desc);

-- Supplier search by name within an org
create index if not exists idx_suppliers_org_name
  on suppliers(organization_id, name)
  where deleted_at is null;
