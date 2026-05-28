-- Migration: Add cross-org data sharing support
-- Adds sharing_enabled column to organizations and updates RLS policies
-- to allow read-only access to customers/vehicles/work orders from
-- organizations that have sharing enabled.

-- 1. Add sharing_enabled column
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS sharing_enabled boolean NOT NULL DEFAULT false;

-- 2. Update RLS SELECT policies on customers
DROP POLICY IF EXISTS "Users can view customers in their org" ON customers;
DROP POLICY IF EXISTS "customers_select" ON customers;

CREATE POLICY "customers_select_own"
  ON customers FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "customers_select_shared"
  ON customers FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = customers.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 3. Update RLS SELECT policies on vehicles
DROP POLICY IF EXISTS "Users can view vehicles in their org" ON vehicles;
DROP POLICY IF EXISTS "vehicles_select" ON vehicles;

CREATE POLICY "vehicles_select_own"
  ON vehicles FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "vehicles_select_shared"
  ON vehicles FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = vehicles.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 4. Update RLS SELECT policies on work_orders
DROP POLICY IF EXISTS "Users can view work orders in their org" ON work_orders;
DROP POLICY IF EXISTS "work_orders_select" ON work_orders;
DROP POLICY IF EXISTS "wo_select" ON work_orders;

CREATE POLICY "work_orders_select_own"
  ON work_orders FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "work_orders_select_shared"
  ON work_orders FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = work_orders.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 5. Update RLS SELECT policies on work_order_services
DROP POLICY IF EXISTS "Users can view work_order_services in their org" ON work_order_services;
DROP POLICY IF EXISTS "work_order_services_select" ON work_order_services;
DROP POLICY IF EXISTS "wos_select" ON work_order_services;

CREATE POLICY "work_order_services_select_own"
  ON work_order_services FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "work_order_services_select_shared"
  ON work_order_services FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = work_order_services.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 6. Update RLS SELECT policies on work_order_parts
DROP POLICY IF EXISTS "Users can view work_order_parts in their org" ON work_order_parts;
DROP POLICY IF EXISTS "work_order_parts_select" ON work_order_parts;
DROP POLICY IF EXISTS "wop_select" ON work_order_parts;

CREATE POLICY "work_order_parts_select_own"
  ON work_order_parts FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "work_order_parts_select_shared"
  ON work_order_parts FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = work_order_parts.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 7. Update RLS SELECT policies on work_order_status_history
DROP POLICY IF EXISTS "Users can view status history in their org" ON work_order_status_history;
DROP POLICY IF EXISTS "wosh_select" ON work_order_status_history;

CREATE POLICY "work_order_status_history_select_own"
  ON work_order_status_history FOR SELECT
  TO public
  USING (organization_id = get_user_organization_id());

CREATE POLICY "work_order_status_history_select_shared"
  ON work_order_status_history FOR SELECT
  TO public
  USING (
    organization_id != get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = work_order_status_history.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 8. Add cross-org SELECT policies on invoices (existing ALL policy handles own-org)
CREATE POLICY "invoices_select_shared"
  ON invoices FOR SELECT
  TO public
  USING (
    organization_id NOT IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = invoices.organization_id
        AND sharing_enabled = true
        AND deleted_at IS NULL
    )
  );

-- 9. Add cross-org SELECT policies on invoice_items
CREATE POLICY "invoice_items_select_shared"
  ON invoice_items FOR SELECT
  TO public
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id NOT IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM organizations
        WHERE id = invoices.organization_id
          AND sharing_enabled = true
          AND deleted_at IS NULL
      )
    )
  );
