-- Seed standard permissions and role-permission mappings for all organizations
-- Phase 6: RBAC system
-- Creates idempotent seed functions, seeds existing orgs, and auto-seeds new orgs via trigger

-- ============================================================
-- 0. Unique index for idempotent permission inserts
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_org_name_active
  ON public.permissions(organization_id, name) WHERE deleted_at IS NULL;

-- ============================================================
-- 1. Function: seed_org_permissions(p_org_id uuid)
-- Creates standard permissions for an organization across all resources.
-- Idempotent: skips existing permissions via unique index.
-- ============================================================
CREATE OR REPLACE FUNCTION seed_org_permissions(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.permissions (organization_id, name, resource, action, description)
  VALUES
    -- work_orders
    (p_org_id, 'work_orders.create', 'work_orders', 'create', 'Create work orders'),
    (p_org_id, 'work_orders.read',   'work_orders', 'read',   'View work orders'),
    (p_org_id, 'work_orders.update', 'work_orders', 'update', 'Update work orders'),
    (p_org_id, 'work_orders.delete', 'work_orders', 'delete', 'Delete work orders'),
    -- invoices
    (p_org_id, 'invoices.create', 'invoices', 'create', 'Create invoices'),
    (p_org_id, 'invoices.read',   'invoices', 'read',   'View invoices'),
    (p_org_id, 'invoices.update', 'invoices', 'update', 'Update invoices'),
    (p_org_id, 'invoices.delete', 'invoices', 'delete', 'Delete invoices'),
    -- inventory
    (p_org_id, 'inventory.read',   'inventory', 'read',   'View inventory'),
    (p_org_id, 'inventory.update', 'inventory', 'update', 'Update inventory'),
    -- customers
    (p_org_id, 'customers.create', 'customers', 'create', 'Create customers'),
    (p_org_id, 'customers.read',   'customers', 'read',   'View customers'),
    (p_org_id, 'customers.update', 'customers', 'update', 'Update customers'),
    -- vehicles
    (p_org_id, 'vehicles.create', 'vehicles', 'create', 'Create vehicles'),
    (p_org_id, 'vehicles.read',   'vehicles', 'read',   'View vehicles'),
    (p_org_id, 'vehicles.update', 'vehicles', 'update', 'Update vehicles'),
    -- reports
    (p_org_id, 'reports.read', 'reports', 'read', 'View reports and analytics'),
    -- settings
    (p_org_id, 'settings.read',   'settings', 'read',   'View organization settings'),
    (p_org_id, 'settings.update', 'settings', 'update', 'Update organization settings'),
    -- members
    (p_org_id, 'members.read',   'members', 'read',   'View team members'),
    (p_org_id, 'members.update', 'members', 'update', 'Update team members')
  ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;
END;
$$;

-- ============================================================
-- 2. Function: seed_org_role_permissions(p_org_id uuid)
-- Ensures standard system roles exist, then links permissions
-- to each role according to the RBAC matrix.
-- Idempotent: skips existing role_permission pairs.
-- ============================================================
CREATE OR REPLACE FUNCTION seed_org_role_permissions(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id    UUID;
  v_manager_id  UUID;
  v_mechanic_id UUID;
  v_guest_id    UUID;
BEGIN
  -- --------------------------------------------------
  -- a) Ensure all standard system roles exist
  -- --------------------------------------------------
  INSERT INTO public.roles (organization_id, name, description, is_system)
  SELECT p_org_id, r.name, r.description, true
  FROM (
    VALUES
      ('Org Owner', 'Full access to all organization features and settings'),
      ('Manager',   'Day-to-day operations manager with access to reports and approvals'),
      ('Mechanic',  'Service technician who performs repairs and maintenance'),
      ('Guest',     'External invoice viewer with limited portal access')
  ) AS r (name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE organization_id = p_org_id AND name = r.name AND deleted_at IS NULL
  );

  -- --------------------------------------------------
  -- b) Resolve role IDs
  -- --------------------------------------------------
  SELECT id INTO v_owner_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Org Owner' AND deleted_at IS NULL;
  SELECT id INTO v_manager_id  FROM public.roles WHERE organization_id = p_org_id AND name = 'Manager'   AND deleted_at IS NULL;
  SELECT id INTO v_mechanic_id FROM public.roles WHERE organization_id = p_org_id AND name = 'Mechanic'  AND deleted_at IS NULL;
  SELECT id INTO v_guest_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Guest'     AND deleted_at IS NULL;

  -- --------------------------------------------------
  -- c) Link permissions to roles
  -- --------------------------------------------------

  -- Org Owner: ALL permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_owner_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Manager: full access to work_orders, invoices, inventory, customers, vehicles
  --          plus reports.read, settings.read, members.read
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_manager_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND (
      p.resource IN ('work_orders', 'invoices', 'inventory', 'customers', 'vehicles')
      OR (p.resource = 'reports'  AND p.action = 'read')
      OR (p.resource = 'settings' AND p.action = 'read')
      OR (p.resource = 'members'  AND p.action = 'read')
    )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Mechanic: work_orders (read/update), inventory (read), customers (read), vehicles (read)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_mechanic_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.resource IN ('work_orders', 'inventory', 'customers', 'vehicles')
    AND p.action IN ('read', 'update')
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Guest: invoices (read) only
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_guest_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.resource = 'invoices' AND p.action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;

-- ============================================================
-- 3. Seed ALL existing organizations
-- ============================================================
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    PERFORM seed_org_permissions(org_record.id);
    PERFORM seed_org_role_permissions(org_record.id);
  END LOOP;
END;
$$;

-- ============================================================
-- 4. Auto-seed trigger for newly created organizations
-- ============================================================
CREATE OR REPLACE FUNCTION auto_seed_org_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM seed_org_permissions(NEW.id);
  PERFORM seed_org_role_permissions(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_seed_permissions
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_org_permissions();
