-- ============================================================
-- Secure Organization RBAC: owner-managed custom roles
-- ============================================================
-- This migration:
--   1. Creates private-schema SECURITY DEFINER helpers
--   2. Fixes get_user_organization_id() to filter removed_at
--   3. Adds new permission catalog entries (service_reminders, day_close, dashboard, bay_view)
--   4. Repairs seed functions to create 4 immutable system roles
--   5. Adds case-insensitive role name uniqueness index
--   6. Adds triggers protecting system roles from mutation
--   7. Adds triggers rejecting cross-org role/permission/membership writes
--   8. Replaces overly permissive foundation RLS policies
--   9. Hardens accept_invite to reject cross-org and owner-role assignment
--  10. Backfills all existing organizations

-- ============================================================
-- 0. Create private schema for helper functions
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================
-- 1. Private-schema helper functions
-- ============================================================

-- Check if the current user is an active member of the given organization
CREATE OR REPLACE FUNCTION private.is_active_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = (SELECT auth.uid())
      AND organization_id = p_org_id
      AND removed_at IS NULL
  );
$$;

-- Check if the current user is the active Org Owner of the given organization
CREATE OR REPLACE FUNCTION private.is_active_org_owner(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_users ou
    JOIN public.roles r ON r.id = ou.role_id
    WHERE ou.user_id = (SELECT auth.uid())
      AND ou.organization_id = p_org_id
      AND ou.removed_at IS NULL
      AND r.name = 'Org Owner'
      AND r.organization_id = p_org_id
      AND r.deleted_at IS NULL
  );
$$;

-- Check if the current user is the creator of the given organization
CREATE OR REPLACE FUNCTION private.is_org_creator(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id
      AND created_by = (SELECT auth.uid())
  );
$$;

-- Revoke default EXECUTE from public roles
REVOKE EXECUTE ON FUNCTION private.is_active_org_member(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_active_org_owner(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_org_creator(UUID) FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE back to authenticated — RLS policies call these functions
-- and need EXECUTE privilege even though the functions are SECURITY DEFINER.
-- The REVOKE above removes default PUBLIC access; this selectively re-grants
-- only the authenticated role so RLS policy evaluation succeeds.
GRANT EXECUTE ON FUNCTION private.is_active_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_org_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_org_creator(UUID) TO authenticated;

-- ============================================================
-- 2. Fix get_user_organization_id() to filter removed_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.organization_users
  WHERE user_id = (SELECT auth.uid())
    AND removed_at IS NULL
  ORDER BY is_primary DESC, joined_at ASC
  LIMIT 1;
$$;

-- ============================================================
-- 3. New permission catalog entries
-- ============================================================
-- Backfill new permissions for ALL existing orgs
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    INSERT INTO public.permissions (organization_id, name, resource, action, description)
    VALUES
      (org_record.id, 'service_reminders.create', 'service_reminders', 'create', 'Create service reminders'),
      (org_record.id, 'service_reminders.read',   'service_reminders', 'read',   'View service reminders'),
      (org_record.id, 'service_reminders.update', 'service_reminders', 'update', 'Update service reminders'),
      (org_record.id, 'service_reminders.delete', 'service_reminders', 'delete', 'Delete service reminders'),
      (org_record.id, 'service_reminders.manage', 'service_reminders', 'manage', 'Send and sync service reminders'),
      (org_record.id, 'day_close.read',           'day_close',         'read',   'View end-of-day status'),
      (org_record.id, 'day_close.manage',         'day_close',         'manage', 'Run end-of-day close'),
      (org_record.id, 'dashboard.read',           'dashboard',         'read',   'View dashboard'),
      (org_record.id, 'bay_view.read',            'bay_view',          'read',   'View bay view')
    ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- 4. Repaired seed_org_permissions — includes ALL catalog entries
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_org_permissions(p_org_id UUID)
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
    (p_org_id, 'inventory.create', 'inventory', 'create', 'Add inventory items'),
    (p_org_id, 'inventory.read',   'inventory', 'read',   'View inventory'),
    (p_org_id, 'inventory.update', 'inventory', 'update', 'Update inventory items'),
    (p_org_id, 'inventory.delete', 'inventory', 'delete', 'Delete inventory items'),
    -- customers
    (p_org_id, 'customers.create', 'customers', 'create', 'Add customers'),
    (p_org_id, 'customers.read',   'customers', 'read',   'View customers'),
    (p_org_id, 'customers.update', 'customers', 'update', 'Update customers'),
    (p_org_id, 'customers.delete', 'customers', 'delete', 'Delete customers'),
    -- vehicles
    (p_org_id, 'vehicles.create', 'vehicles', 'create', 'Add vehicles'),
    (p_org_id, 'vehicles.read',   'vehicles', 'read',   'View vehicles'),
    (p_org_id, 'vehicles.update', 'vehicles', 'update', 'Update vehicles'),
    (p_org_id, 'vehicles.delete', 'vehicles', 'delete', 'Delete vehicles'),
    -- reports
    (p_org_id, 'reports.read', 'reports', 'read', 'View reports and analytics'),
    -- payroll
    (p_org_id, 'payroll.read',  'payroll', 'read',  'View payroll records'),
    (p_org_id, 'payroll.write', 'payroll', 'write', 'Manage payroll settings and run calculations'),
    -- settings
    (p_org_id, 'settings.read',   'settings', 'read',   'View organization settings'),
    (p_org_id, 'settings.update', 'settings', 'update', 'Update organization settings'),
    -- members
    (p_org_id, 'members.read',   'members', 'read',   'View team members'),
    (p_org_id, 'members.update', 'members', 'update', 'Update team member roles and info'),
    (p_org_id, 'members.invite', 'members', 'invite', 'Invite new members'),
    -- expenses
    (p_org_id, 'expenses.create', 'expenses', 'create', 'Create expenses'),
    (p_org_id, 'expenses.read',   'expenses', 'read',   'View expenses'),
    (p_org_id, 'expenses.update', 'expenses', 'update', 'Update expenses'),
    (p_org_id, 'expenses.delete', 'expenses', 'delete', 'Delete expenses'),
    -- services
    (p_org_id, 'services.create', 'services', 'create', 'Create service catalog entries'),
    (p_org_id, 'services.read',   'services', 'read',   'View service catalog'),
    (p_org_id, 'services.update', 'services', 'update', 'Update service catalog entries'),
    (p_org_id, 'services.delete', 'services', 'delete', 'Delete service catalog entries'),
    -- appointments
    (p_org_id, 'appointments.create', 'appointments', 'create', 'Create appointments'),
    (p_org_id, 'appointments.read',   'appointments', 'read',   'View appointments'),
    (p_org_id, 'appointments.update', 'appointments', 'update', 'Update appointments'),
    (p_org_id, 'appointments.delete', 'appointments', 'delete', 'Delete appointments'),
    -- branches
    (p_org_id, 'branches.create', 'branches', 'create', 'Create branches'),
    (p_org_id, 'branches.read',   'branches', 'read',   'View branches'),
    (p_org_id, 'branches.update', 'branches', 'update', 'Update branches'),
    (p_org_id, 'branches.delete', 'branches', 'delete', 'Delete branches'),
    -- commission_rules
    (p_org_id, 'commission_rules.create', 'commission_rules', 'create', 'Create commission rules'),
    (p_org_id, 'commission_rules.read',   'commission_rules', 'read',   'View commission rules'),
    (p_org_id, 'commission_rules.update', 'commission_rules', 'update', 'Update commission rules'),
    (p_org_id, 'commission_rules.delete', 'commission_rules', 'delete', 'Delete commission rules'),
    -- diagnosis_labels
    (p_org_id, 'diagnosis_labels.create', 'diagnosis_labels', 'create', 'Create diagnosis labels'),
    (p_org_id, 'diagnosis_labels.read',   'diagnosis_labels', 'read',   'View diagnosis labels'),
    (p_org_id, 'diagnosis_labels.update', 'diagnosis_labels', 'update', 'Update diagnosis labels'),
    (p_org_id, 'diagnosis_labels.delete', 'diagnosis_labels', 'delete', 'Delete diagnosis labels'),
    -- expense_categories
    (p_org_id, 'expense_categories.create', 'expense_categories', 'create', 'Create expense categories'),
    (p_org_id, 'expense_categories.read',   'expense_categories', 'read',   'View expense categories'),
    (p_org_id, 'expense_categories.update', 'expense_categories', 'update', 'Update expense categories'),
    (p_org_id, 'expense_categories.delete', 'expense_categories', 'delete', 'Delete expense categories'),
    -- refunds
    (p_org_id, 'refunds.read',   'refunds', 'read',   'View refunds'),
    (p_org_id, 'refunds.create', 'refunds', 'create', 'Create refunds'),
    -- cash_register
    (p_org_id, 'cash_register.create', 'cash_register', 'create', 'Open cash register session'),
    (p_org_id, 'cash_register.read',   'cash_register', 'read',   'View cash register sessions'),
    (p_org_id, 'cash_register.update', 'cash_register', 'update', 'Cash register transactions'),
    (p_org_id, 'cash_register.delete', 'cash_register', 'delete', 'Void cash register session'),
    -- service_reminders
    (p_org_id, 'service_reminders.create', 'service_reminders', 'create', 'Create service reminders'),
    (p_org_id, 'service_reminders.read',   'service_reminders', 'read',   'View service reminders'),
    (p_org_id, 'service_reminders.update', 'service_reminders', 'update', 'Update service reminders'),
    (p_org_id, 'service_reminders.delete', 'service_reminders', 'delete', 'Delete service reminders'),
    (p_org_id, 'service_reminders.manage', 'service_reminders', 'manage', 'Send and sync service reminders'),
    -- day_close
    (p_org_id, 'day_close.read',   'day_close', 'read',   'View end-of-day status'),
    (p_org_id, 'day_close.manage', 'day_close', 'manage', 'Run end-of-day close'),
    -- dashboard / bay_view
    (p_org_id, 'dashboard.read', 'dashboard', 'read', 'View dashboard'),
    (p_org_id, 'bay_view.read',  'bay_view',  'read', 'View bay view')
  ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;
END;
$$;

-- ============================================================
-- 5. Repaired seed_org_role_permissions — creates 4 immutable system roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_org_role_permissions(p_org_id UUID)
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
  v_role_perms  TEXT[];
BEGIN
  -- ── a) Create system roles if missing ──
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

  -- ── b) Resolve role IDs ──
  SELECT id INTO v_owner_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Org Owner' AND deleted_at IS NULL;
  SELECT id INTO v_manager_id  FROM public.roles WHERE organization_id = p_org_id AND name = 'Manager'   AND deleted_at IS NULL;
  SELECT id INTO v_mechanic_id FROM public.roles WHERE organization_id = p_org_id AND name = 'Mechanic'  AND deleted_at IS NULL;
  SELECT id INTO v_guest_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Guest'     AND deleted_at IS NULL;

  -- ── c) Org Owner: ALL permissions ──
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_owner_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_owner_id AND rp.permission_id = p.id
    );

  -- ── d) Manager: comprehensive operations access ──
  v_role_perms := ARRAY[
    'work_orders.create', 'work_orders.read', 'work_orders.update',
    'invoices.create', 'invoices.read', 'invoices.update',
    'inventory.create', 'inventory.read', 'inventory.update',
    'customers.create', 'customers.read', 'customers.update',
    'vehicles.create', 'vehicles.read', 'vehicles.update',
    'reports.read',
    'payroll.read', 'payroll.write',
    'settings.read', 'settings.update',
    'members.read', 'members.update', 'members.invite',
    'expenses.create', 'expenses.read', 'expenses.update',
    'services.create', 'services.read', 'services.update',
    'appointments.create', 'appointments.read', 'appointments.update',
    'branches.create', 'branches.read', 'branches.update',
    'commission_rules.create', 'commission_rules.read', 'commission_rules.update',
    'diagnosis_labels.create', 'diagnosis_labels.read', 'diagnosis_labels.update',
    'expense_categories.create', 'expense_categories.read', 'expense_categories.update', 'expense_categories.delete',
    'refunds.read',
    'cash_register.create', 'cash_register.read', 'cash_register.update',
    'service_reminders.create', 'service_reminders.read', 'service_reminders.update', 'service_reminders.manage',
    'day_close.read', 'day_close.manage',
    'dashboard.read', 'bay_view.read'
  ];

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_manager_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.name = ANY(v_role_perms)
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_manager_id AND rp.permission_id = p.id
    );

  -- ── e) Mechanic: shop-floor read access ──
  v_role_perms := ARRAY[
    'work_orders.read', 'work_orders.update',
    'inventory.read',
    'customers.read',
    'vehicles.read',
    'services.read',
    'service_reminders.read',
    'cash_register.read',
    'day_close.read',
    'dashboard.read', 'bay_view.read'
  ];

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_mechanic_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.name = ANY(v_role_perms)
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_mechanic_id AND rp.permission_id = p.id
    );

  -- ── f) Guest: invoices only ──
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_guest_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.name = 'invoices.read'
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_guest_id AND rp.permission_id = p.id
    );
END;
$$;

-- ============================================================
-- 6. Backfill all existing orgs with new seeds
-- ============================================================
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    PERFORM seed_org_permissions(org_record.id);
    PERFORM seed_org_role_permissions(org_record.id);
  END LOOP;
END $$;

-- ============================================================
-- 7. Case-insensitive role name uniqueness
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_org_lower_name_active
  ON public.roles (organization_id, lower(name))
  WHERE deleted_at IS NULL;

-- ============================================================
-- 8. Trigger: protect system roles from mutation
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_system_role_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only applies to updates/deletes on system roles
  IF OLD.is_system = TRUE THEN
    -- Block rename
    IF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'Cannot rename system role "%" — system roles are immutable', OLD.name;
    END IF;
    -- Block unsetting is_system
    IF TG_OP = 'UPDATE' AND NEW.is_system IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Cannot modify is_system flag on role "%"', OLD.name;
    END IF;
    -- Block soft delete
    IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      RAISE EXCEPTION 'Cannot delete system role "%"', OLD.name;
    END IF;
    -- Block hard delete
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete system role "%"', OLD.name;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_system_role_mutation ON public.roles;
CREATE TRIGGER trg_prevent_system_role_mutation
  BEFORE UPDATE OR DELETE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_system_role_mutation();

-- ============================================================
-- 9. Trigger: prevent system role_permission replacement
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_system_role_perm_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_system BOOLEAN;
BEGIN
  SELECT is_system INTO v_is_system
  FROM public.roles
  WHERE id = OLD.role_id;

  IF v_is_system = TRUE THEN
    -- Prevent bulk replacement on system roles (custom role editor is for custom roles only)
    -- But allow seed functions (which run as SECURITY DEFINER) — check caller
    IF current_setting('role') NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Cannot modify permissions on system role — system role permissions are immutable';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_system_role_perm_change ON public.role_permissions;
CREATE TRIGGER trg_prevent_system_role_perm_change
  BEFORE DELETE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_system_role_perm_change();

-- ============================================================
-- 10. Trigger: reject cross-org role_id on organization_users
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_membership_role_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_org UUID;
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT organization_id INTO v_role_org
    FROM public.roles
    WHERE id = NEW.role_id AND deleted_at IS NULL;

    IF v_role_org IS NULL THEN
      RAISE EXCEPTION 'Role % does not exist or is deleted', NEW.role_id;
    END IF;

    IF v_role_org != NEW.organization_id THEN
      RAISE EXCEPTION 'Role % belongs to a different organization', NEW.role_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_membership_role_org ON public.organization_users;
CREATE TRIGGER trg_validate_membership_role_org
  BEFORE INSERT OR UPDATE OF role_id ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_membership_role_org();

-- ============================================================
-- 11. Trigger: reject cross-org role_permissions pair
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_role_permission_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_org UUID;
  v_perm_org UUID;
BEGIN
  SELECT organization_id INTO v_role_org FROM public.roles WHERE id = NEW.role_id;
  SELECT organization_id INTO v_perm_org FROM public.permissions WHERE id = NEW.permission_id;

  IF v_role_org IS NULL OR v_perm_org IS NULL THEN
    RAISE EXCEPTION 'Role or permission does not exist';
  END IF;

  IF v_role_org != v_perm_org THEN
    RAISE EXCEPTION 'Role and permission belong to different organizations';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_role_permission_org ON public.role_permissions;
CREATE TRIGGER trg_validate_role_permission_org
  BEFORE INSERT ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_permission_org();

-- ============================================================
-- 12. Trigger: prevent deleting role with active members
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_delete_role_with_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.organization_users
    WHERE role_id = OLD.id
      AND organization_id = OLD.organization_id
      AND removed_at IS NULL;

    IF v_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete role: % member(s) are still assigned to it', v_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_role_with_members ON public.roles;
CREATE TRIGGER trg_prevent_delete_role_with_members
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_role_with_members();

-- ============================================================
-- 13. Drop and recreate RLS policies on RBAC tables
-- ============================================================

-- ── roles: owner-only write ──
DROP POLICY IF EXISTS "Users can view roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can insert roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can update roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can delete roles in their org" ON public.roles;

CREATE POLICY "Members can view roles in their org"
  ON public.roles FOR SELECT
  TO authenticated
  USING (private.is_active_org_member(organization_id));

CREATE POLICY "Owners can insert roles in their org"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can update roles in their org"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (private.is_active_org_owner(organization_id))
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can delete roles in their org"
  ON public.roles FOR DELETE
  TO authenticated
  USING (private.is_active_org_owner(organization_id));

-- ── permissions: read-only for members ──
DROP POLICY IF EXISTS "Users can view permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can insert permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can update permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can delete permissions in their org" ON public.permissions;

CREATE POLICY "Members can view permissions in their org"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (private.is_active_org_member(organization_id));

-- No INSERT/UPDATE/DELETE policy — permission catalog is migration-managed only

-- ── role_permissions: owner-only write ──
DROP POLICY IF EXISTS "Users can view role_permissions in their org" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can insert role_permissions in their org" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can delete role_permissions in their org" ON public.role_permissions;

CREATE POLICY "Members can view role_permissions in their org"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.id = role_permissions.role_id
        AND roles.deleted_at IS NULL
        AND private.is_active_org_member(roles.organization_id)
    )
  );

CREATE POLICY "Owners can insert role_permissions in their org"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.id = role_permissions.role_id
        AND roles.deleted_at IS NULL
        AND private.is_active_org_owner(roles.organization_id)
    )
  );

CREATE POLICY "Owners can delete role_permissions in their org"
  ON public.role_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.id = role_permissions.role_id
        AND roles.deleted_at IS NULL
        AND private.is_active_org_owner(roles.organization_id)
    )
  );

-- ── organization_users: owner-only write, with bootstrap exception ──
DROP POLICY IF EXISTS "Users can view org memberships they belong to" ON public.organization_users;
DROP POLICY IF EXISTS "Users can insert org memberships for their org" ON public.organization_users;
DROP POLICY IF EXISTS "Users can update org memberships in their org" ON public.organization_users;
DROP POLICY IF EXISTS "Users can delete org memberships in their org" ON public.organization_users;

CREATE POLICY "Members can view org memberships in their org"
  ON public.organization_users FOR SELECT
  TO authenticated
  USING (private.is_active_org_member(organization_id));

CREATE POLICY "Owners or bootstrap can insert org memberships"
  ON public.organization_users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owner can add members to their org
    private.is_active_org_owner(organization_id)
    OR
    -- Bootstrap exception: creator adding themselves as Org Owner on a brand new org
    (
      user_id = (SELECT auth.uid())
      AND private.is_org_creator(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.roles
        WHERE roles.id = role_id
          AND roles.name = 'Org Owner'
          AND roles.organization_id = organization_id
          AND roles.deleted_at IS NULL
      )
    )
  );

CREATE POLICY "Owners can update org memberships in their org"
  ON public.organization_users FOR UPDATE
  TO authenticated
  USING (private.is_active_org_owner(organization_id))
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can delete org memberships in their org"
  ON public.organization_users FOR DELETE
  TO authenticated
  USING (private.is_active_org_owner(organization_id));

-- ============================================================
-- 14. Harden accept_invite
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invite(invite_token TEXT, accepting_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invite_record RECORD;
  org_branch_id UUID;
  resolved_role_id UUID;
  v_role_org UUID;
  v_role_is_system BOOLEAN;
  v_role_name TEXT;
BEGIN
  -- Require the caller to be the accepting user
  IF accepting_user_id != (SELECT auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot accept invite on behalf of another user');
  END IF;

  SELECT * INTO invite_record
  FROM public.org_invites
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found, already accepted, or expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_id = invite_record.organization_id
      AND user_id = accepting_user_id
      AND removed_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  END IF;

  resolved_role_id := invite_record.role_id;
  IF resolved_role_id IS NOT NULL THEN
    -- Validate the invited role belongs to this org and is not the owner role
    SELECT organization_id, is_system, name
    INTO v_role_org, v_role_is_system, v_role_name
    FROM public.roles
    WHERE id = resolved_role_id AND deleted_at IS NULL;

    IF v_role_org IS NULL OR v_role_org != invite_record.organization_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invited role does not belong to this organization');
    END IF;

    IF v_role_name = 'Org Owner' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot assign Org Owner role via invite');
    END IF;
  ELSE
    -- Default to Mechanic role in the invite org
    SELECT id INTO resolved_role_id
    FROM public.roles
    WHERE organization_id = invite_record.organization_id
      AND name = 'Mechanic'
      AND deleted_at IS NULL
    LIMIT 1;

    IF resolved_role_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No default Mechanic role found for this organization');
    END IF;
  END IF;

  SELECT id INTO org_branch_id
  FROM public.branches
  WHERE organization_id = invite_record.organization_id
    AND is_main = true
  LIMIT 1;

  INSERT INTO public.organization_users (
    organization_id, user_id, role_id, branch_id, is_primary
  ) VALUES (
    invite_record.organization_id, accepting_user_id, resolved_role_id, org_branch_id, true
  );

  INSERT INTO public.profiles (id, organization_id, branch_id, is_active)
  VALUES (accepting_user_id, invite_record.organization_id, org_branch_id, true)
  ON CONFLICT (id) DO UPDATE SET
    organization_id = excluded.organization_id,
    branch_id = excluded.branch_id,
    updated_at = now();

  UPDATE public.org_invites
  SET status = 'accepted', updated_at = now()
  WHERE id = invite_record.id;

  RETURN jsonb_build_object('success', true, 'organization_id', invite_record.organization_id);
END;
$$;
-- ============================================================
-- 12. Backfill role assignments for existing org users
-- ============================================================
-- The migration creates 4 system roles but existing users have NULL role_id.
-- Assign: Org Creator → Org Owner, Primary users → Manager, Others → Mechanic.
DO $$
DECLARE
  org_record RECORD;
  v_owner_role_id UUID;
  v_manager_role_id UUID;
  v_mechanic_role_id UUID;
BEGIN
  FOR org_record IN
    SELECT o.id AS org_id, o.created_by
    FROM public.organizations o
    WHERE o.deleted_at IS NULL
  LOOP
    -- Resolve system role IDs for this org
    SELECT id INTO v_owner_role_id FROM public.roles
    WHERE organization_id = org_record.org_id AND name = 'Org Owner' AND deleted_at IS NULL;
    SELECT id INTO v_manager_role_id FROM public.roles
    WHERE organization_id = org_record.org_id AND name = 'Manager' AND deleted_at IS NULL;
    SELECT id INTO v_mechanic_role_id FROM public.roles
    WHERE organization_id = org_record.org_id AND name = 'Mechanic' AND deleted_at IS NULL;

    -- Assign Org Owner to the org creator
    IF v_owner_role_id IS NOT NULL AND org_record.created_by IS NOT NULL THEN
      UPDATE public.organization_users
      SET role_id = v_owner_role_id
      WHERE organization_id = org_record.org_id
        AND user_id = org_record.created_by
        AND role_id IS NULL;
    END IF;

    -- Assign Manager to primary members without a role
    IF v_manager_role_id IS NOT NULL THEN
      UPDATE public.organization_users
      SET role_id = v_manager_role_id
      WHERE organization_id = org_record.org_id
        AND role_id IS NULL
        AND is_primary = true;
    END IF;

    -- Assign Mechanic to any remaining members without a role
    IF v_mechanic_role_id IS NOT NULL THEN
      UPDATE public.organization_users
      SET role_id = v_mechanic_role_id
      WHERE organization_id = org_record.org_id
        AND role_id IS NULL;
    END IF;
  END LOOP;
END $$;
