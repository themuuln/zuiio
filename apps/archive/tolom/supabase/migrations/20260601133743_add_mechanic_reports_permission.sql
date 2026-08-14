-- Add reports.read permission to Mechanic role
--
-- The Mechanic role was missing reports.read, causing 403 errors on:
--   - Main dashboard page (type=dashboard)
--   - Daily timeline (type=timeline)
--   - Mechanic dashboard page (type=eod, type=mechanic-trend)
--   - Mechanic selector (type=mechanics)
--
-- This migration:
--   1. Updates seed_org_role_permissions() to include reports.read for Mechanic
--   2. Seeds the missing role_permission entry for all existing orgs

-- ============================================================
-- 1. Update the seed function so new orgs get the fix
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

  -- Mechanic: work_orders (read/update), inventory (read), customers (read),
  --           vehicles (read), reports (read)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_mechanic_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND (
      (p.resource IN ('work_orders', 'inventory', 'customers', 'vehicles') AND p.action IN ('read', 'update'))
      OR (p.resource = 'reports' AND p.action = 'read')
    )
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
-- 2. Add reports.read to Mechanic role for ALL existing orgs
-- ============================================================
DO $$
DECLARE
  v_org_id     UUID;
  v_mechanic_role_id UUID;
  v_reports_read_perm_id UUID;
BEGIN
  FOR v_org_id IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    -- Find the Mechanic role for this org
    SELECT id INTO v_mechanic_role_id
    FROM public.roles
    WHERE organization_id = v_org_id AND name = 'Mechanic' AND deleted_at IS NULL;

    -- Find the reports.read permission for this org
    SELECT id INTO v_reports_read_perm_id
    FROM public.permissions
    WHERE organization_id = v_org_id AND resource = 'reports' AND action = 'read' AND deleted_at IS NULL;

    -- Insert the link (skip if already exists)
    IF v_mechanic_role_id IS NOT NULL AND v_reports_read_perm_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      VALUES (v_mechanic_role_id, v_reports_read_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

