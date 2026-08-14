-- Add refunds.read and refunds.create permissions
-- The refunds API route requires these permissions.

-- ============================================================
-- 1. Update seed_org_permissions — add refunds resource
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
    (p_org_id, 'refunds.create', 'refunds', 'create', 'Create refunds')
  ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;
END;
$$;

-- ============================================================
-- 2. Update seed_org_role_permissions — grant refunds
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_org_role_permissions(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id UUID;
  v_manager_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_owner_id FROM public.roles
    WHERE organization_id = p_org_id AND name = 'Org Owner' AND deleted_at IS NULL;
  SELECT id INTO v_manager_id FROM public.roles
    WHERE organization_id = p_org_id AND name = 'Manager' AND deleted_at IS NULL;

  -- Org Owner: ALL permissions (including refunds via the catch-all below)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_owner_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_owner_id AND rp.permission_id = p.id
    );

  -- Manager: standard permissions + refunds.read
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_manager_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND (
      p.name IN (
        'work_orders.create', 'work_orders.read', 'work_orders.update',
        'invoices.create', 'invoices.read', 'invoices.update',
        'inventory.create', 'inventory.read', 'inventory.update',
        'customers.create', 'customers.read', 'customers.update',
        'vehicles.create', 'vehicles.read', 'vehicles.update',
        'reports.read', 'payroll.read', 'payroll.write',
        'settings.read', 'settings.update',
        'members.read', 'members.update', 'members.invite',
        'expenses.create', 'expenses.read', 'expenses.update',
        'services.create', 'services.read', 'services.update',
        'appointments.create', 'appointments.read', 'appointments.update',
        'branches.create', 'branches.read', 'branches.update',
        'commission_rules.create', 'commission_rules.read', 'commission_rules.update',
        'diagnosis_labels.create', 'diagnosis_labels.read', 'diagnosis_labels.update',
        'expense_categories.create', 'expense_categories.read', 'expense_categories.update',
        'expense_categories.delete',
        'refunds.read'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role_id = v_manager_id AND rp.permission_id = p.id
    );
END;
$$;

-- ============================================================
-- 3. Backfill: ensure refunds permissions exist for existing orgs
-- ============================================================
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    -- Seed new permission rows for this org
    PERFORM public.seed_org_permissions(org_record.id);
    -- Re-assign role permissions to catch refunds
    PERFORM public.seed_org_role_permissions(org_record.id);
  END LOOP;
END;
$$;
