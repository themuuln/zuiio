-- =============================================
-- Roles & Permissions System
-- Allows org owners to create custom roles with
-- granular permissions
-- =============================================

-- 0. Drop old policies that will be recreated
DROP POLICY IF EXISTS "categories_org_isolation" ON public.categories;
DROP POLICY IF EXISTS "contacts_org_isolation" ON public.contacts;
DROP POLICY IF EXISTS "expenses_org_isolation" ON public.expenses;
DROP POLICY IF EXISTS "products_org_isolation" ON public.products;
DROP POLICY IF EXISTS "sales_org_isolation" ON public.sales;
DROP POLICY IF EXISTS "stock_movements_org_read" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_org_insert" ON public.stock_movements;
DROP POLICY IF EXISTS "sale_items_org_read" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_org_insert" ON public.sale_items;

DROP POLICY IF EXISTS "brands_select_own_org" ON public.brands;
DROP POLICY IF EXISTS "brands_insert_own_org" ON public.brands;
DROP POLICY IF EXISTS "brands_update_own_org" ON public.brands;
DROP POLICY IF EXISTS "brands_delete_own_org" ON public.brands;

DROP POLICY IF EXISTS "audit_log_select_own_org" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert_own_org" ON public.audit_log;

DROP POLICY IF EXISTS "commission_payouts_select_org" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_insert_org" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_update_org" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_delete_org" ON public.commission_payouts;

DROP POLICY IF EXISTS "commission_payout_items_select_org" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_insert_org" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_update_org" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_delete_org" ON public.commission_payout_items;

DROP POLICY IF EXISTS "invoices_select_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_own_org" ON public.invoices;

DROP POLICY IF EXISTS "invoice_items_select_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_own_org" ON public.invoice_items;

DROP POLICY IF EXISTS "notification_configs_select_own_org" ON public.notification_configs;
DROP POLICY IF EXISTS "notification_configs_insert_own_org" ON public.notification_configs;
DROP POLICY IF EXISTS "notification_configs_update_own_org" ON public.notification_configs;
DROP POLICY IF EXISTS "notification_configs_delete_own_org" ON public.notification_configs;

DROP POLICY IF EXISTS "notifications_select_own_org" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own_org" ON public.notifications;

DROP POLICY IF EXISTS "shared_reports_select_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_insert_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_select_org_isolation" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_insert_org_isolation" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_update_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_delete_own_org" ON public.shared_reports;

DROP POLICY IF EXISTS "uom_conversions_select_own_org" ON public.uom_conversions;
DROP POLICY IF EXISTS "uom_conversions_insert_own_org" ON public.uom_conversions;
DROP POLICY IF EXISTS "uom_conversions_update_own_org" ON public.uom_conversions;
DROP POLICY IF EXISTS "uom_conversions_delete_own_org" ON public.uom_conversions;

DROP POLICY IF EXISTS "warehouses_select_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete_own_org" ON public.warehouses;

DROP POLICY IF EXISTS "warehouse_products_select_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_insert_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_update_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_delete_own_org" ON public.warehouse_products;

-- =============================================
-- 1. Create app_permission enum
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.app_permission AS ENUM (
    'products.create', 'products.read', 'products.update', 'products.delete',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'brands.create', 'brands.read', 'brands.update', 'brands.delete',
    'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
    'sales.create', 'sales.read', 'sales.update', 'sales.delete',
    'expenses.create', 'expenses.read', 'expenses.update', 'expenses.delete',
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
    'warehouses.create', 'warehouses.read', 'warehouses.update', 'warehouses.delete',
    'stock_movements.create', 'stock_movements.read', 'stock_movements.update', 'stock_movements.delete',
    'uom_conversions.create', 'uom_conversions.read', 'uom_conversions.update', 'uom_conversions.delete',
    'members.read', 'members.invite', 'members.remove', 'members.manage_role',
    'roles.manage',
    'settings.manage',
    'reports.manage',
    'notifications.manage',
    'audit_log.read'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. Create roles table
-- =============================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- =============================================
-- 3. Create role_permissions table
-- =============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission)
);

-- =============================================
-- 4. Enable RLS on new tables
-- =============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. Create helper functions
-- =============================================

-- Check if the current user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
  p_permission public.app_permission
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT p.role_id INTO v_role_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = v_role_id
      AND rp.permission = p_permission
  );
END;
$$;

-- Check if user has permission (by user_id, for server-side checks)
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission public.app_permission
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT profile.role_id INTO v_role_id
  FROM public.profiles profile
  WHERE profile.id = p_user_id;

  IF v_role_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    WHERE rp.role_id = v_role_id
      AND rp.permission = p_permission
  );
END;
$$;

-- Get all permission strings for the current user (used by the app)
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS SETOF public.app_permission
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT p.role_id INTO v_role_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_role_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT rp.permission
  FROM public.role_permissions rp
  WHERE rp.role_id = v_role_id;
END;
$$;

-- Set permissions for a role atomically (delete all + insert new in one transaction)
CREATE OR REPLACE FUNCTION public.set_role_permissions(
  p_role_id UUID,
  p_permissions public.app_permission[]
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.has_permission('roles.manage') THEN
    RETURN json_build_object('error', 'Permission denied');
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT p_role_id, unnest(p_permissions);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- =============================================
-- 6. RLS policies for roles table
-- =============================================

CREATE POLICY "roles_select_org" ON public.roles
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
  );

CREATE POLICY "roles_insert_org" ON public.roles
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('roles.manage')
  );

CREATE POLICY "roles_update_org" ON public.roles
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('roles.manage')
  );

CREATE POLICY "roles_delete_org" ON public.roles
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('roles.manage')
  );

-- =============================================
-- 7. RLS policies for role_permissions table
-- =============================================

CREATE POLICY "role_permissions_select_org" ON public.role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM public.roles
      WHERE organization_id = (SELECT get_current_organization())
    )
  );

CREATE POLICY "role_permissions_insert_org" ON public.role_permissions
  FOR INSERT WITH CHECK (
    role_id IN (
      SELECT id FROM public.roles
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('roles.manage')
  );

CREATE POLICY "role_permissions_update_org" ON public.role_permissions
  FOR UPDATE USING (
    role_id IN (
      SELECT id FROM public.roles
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('roles.manage')
  );

CREATE POLICY "role_permissions_delete_org" ON public.role_permissions
  FOR DELETE USING (
    role_id IN (
      SELECT id FROM public.roles
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('roles.manage')
  );

-- =============================================
-- 8. Add role_id to profiles
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- =============================================
-- 9. Seed default roles for all existing orgs
-- =============================================
DO $$
DECLARE
  org_record RECORD;
  v_owner_id UUID;
  v_admin_id UUID;
  v_staff_id UUID;
  perm public.app_permission;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations LOOP
    -- Skip if roles already exist for this org
    IF EXISTS (SELECT 1 FROM public.roles WHERE organization_id = org_record.id LIMIT 1) THEN
      CONTINUE;
    END IF;

    -- Create owner role (hierarchy_level 0 = highest)
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_id;

    -- Create admin role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'admin', 'Админ - ихэнх эрхтэй', 1, true)
    RETURNING id INTO v_admin_id;

    -- Create staff role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'staff', 'Ажилтан - үндсэн эрхтэй', 2, true)
    RETURNING id INTO v_staff_id;

    -- Owner gets ALL permissions
    FOR perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_id, perm);
    END LOOP;

    -- Admin gets all permissions EXCEPT roles.manage
    FOR perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_admin_id, perm);
      END IF;
    END LOOP;

    -- Staff gets limited permissions
    FOR perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.read', 'contacts.create',
        'sales.create', 'sales.read', 'sales.update',
        'expenses.create', 'expenses.read',
        'invoices.create', 'invoices.read',
        'warehouses.read',
        'stock_movements.read',
        'uom_conversions.read',
        'members.read',
        'reports.manage',
        'notifications.manage',
        'audit_log.read'
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_staff_id, perm);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =============================================
-- 10. Migrate existing profiles
-- =============================================

-- Map existing text roles to new role_ids
UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE p.organization_id = r.organization_id
  AND p.role = r.name
  AND p.role_id IS NULL;

-- For profiles with org but no role, assign staff
UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE p.organization_id = r.organization_id
  AND r.name = 'staff'
  AND p.role_id IS NULL
  AND p.organization_id IS NOT NULL;

-- Drop the old check constraint on role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- =============================================
-- 11. Update create_organization function
-- =============================================
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name TEXT,
  org_slug TEXT,
  org_type TEXT DEFAULT 'retail'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_existing_org_id UUID;
  v_new_org_id UUID;
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_staff_role_id UUID;
  v_perm public.app_permission;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT organization_id INTO v_existing_org_id FROM public.profiles WHERE id = v_user_id;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN json_build_object('error', 'User already has an organization');
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, slug, company_type)
  VALUES (org_name, org_slug, org_type)
  RETURNING id INTO v_new_org_id;

  -- Create default roles
  INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
  VALUES (v_new_org_id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
  RETURNING id INTO v_owner_role_id;

  INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
  VALUES (v_new_org_id, 'admin', 'Админ - ихэнх эрхтэй', 1, true)
  RETURNING id INTO v_admin_role_id;

  INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
  VALUES (v_new_org_id, 'staff', 'Ажилтан - үндсэн эрхтэй', 2, true)
  RETURNING id INTO v_staff_role_id;

  -- Owner gets all permissions
  FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
    INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_role_id, v_perm);
  END LOOP;

  -- Admin gets all except roles.manage
  FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
    IF v_perm != 'roles.manage' THEN
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_admin_role_id, v_perm);
    END IF;
  END LOOP;

  -- Staff gets limited
  FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
    IF v_perm IN (
      'products.read', 'categories.read', 'brands.read',
      'contacts.read', 'contacts.create',
      'sales.create', 'sales.read', 'sales.update',
      'expenses.create', 'expenses.read',
      'invoices.create', 'invoices.read',
      'warehouses.read',
      'stock_movements.read',
      'uom_conversions.read',
      'members.read',
      'reports.manage',
      'notifications.manage',
      'audit_log.read'
    ) THEN
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_staff_role_id, v_perm);
    END IF;
  END LOOP;

  -- Update the creating user to be the owner
  UPDATE public.profiles
  SET organization_id = v_new_org_id,
      role_id = v_owner_role_id,
      role = 'owner'
  WHERE id = v_user_id;

  RETURN json_build_object('id', v_new_org_id);
END;
$$;

-- =============================================
-- 12. Update RLS policies for ALL existing tables
-- =============================================

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON public.roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- --- Products ---
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.read')
  );
CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.create')
  );
CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.update')
  );
CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('products.delete')
  );

-- --- Categories ---
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('categories.read')
  );
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('categories.create')
  );
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('categories.update')
  );
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('categories.delete')
  );

-- --- Brands ---
CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('brands.read')
  );
CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('brands.create')
  );
CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('brands.update')
  );
CREATE POLICY "brands_delete" ON public.brands
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('brands.delete')
  );

-- --- Contacts ---
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.read')
  );
CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.create')
  );
CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.update')
  );
CREATE POLICY "contacts_delete" ON public.contacts
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('contacts.delete')
  );

-- --- Sales ---
CREATE POLICY "sales_select" ON public.sales
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
  );
CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
  );
CREATE POLICY "sales_update" ON public.sales
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  );
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
  );

-- --- Sale Items ---
CREATE POLICY "sale_items_select" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sale_items.sale_id
        AND sales.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.read')
  );
CREATE POLICY "sale_items_insert" ON public.sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sale_items.sale_id
        AND sales.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.create')
  );

-- --- Expenses ---
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.read')
  );
CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.create')
  );
CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.update')
  );
CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.delete')
  );

-- --- Invoices ---
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    (
      organization_id = (SELECT get_current_organization())
      AND public.has_permission('invoices.read')
    )
    OR token IS NOT NULL
  );
CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.create')
  );
CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.update')
  );
CREATE POLICY "invoices_delete" ON public.invoices
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.delete')
  );

-- --- Invoice Items ---
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT USING (
    (
      invoice_id IN (
        SELECT id FROM public.invoices
        WHERE organization_id = (SELECT get_current_organization())
      )
      AND public.has_permission('invoices.read')
    )
    OR invoice_id IN (
      SELECT id FROM public.invoices WHERE token IS NOT NULL
    )
  );
CREATE POLICY "invoice_items_insert" ON public.invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('invoices.create')
  );
CREATE POLICY "invoice_items_update" ON public.invoice_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('invoices.update')
  );
CREATE POLICY "invoice_items_delete" ON public.invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('invoices.delete')
  );

-- --- Warehouses ---
CREATE POLICY "warehouses_select" ON public.warehouses
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('warehouses.read')
  );
CREATE POLICY "warehouses_insert" ON public.warehouses
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('warehouses.create')
  );
CREATE POLICY "warehouses_update" ON public.warehouses
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('warehouses.update')
  );
CREATE POLICY "warehouses_delete" ON public.warehouses
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('warehouses.delete')
  );

-- --- Warehouse Products ---
CREATE POLICY "warehouse_products_select" ON public.warehouse_products
  FOR SELECT USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('warehouses.read')
  );
CREATE POLICY "warehouse_products_insert" ON public.warehouse_products
  FOR INSERT WITH CHECK (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('warehouses.create')
  );
CREATE POLICY "warehouse_products_update" ON public.warehouse_products
  FOR UPDATE USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('warehouses.update')
  );
CREATE POLICY "warehouse_products_delete" ON public.warehouse_products
  FOR DELETE USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('warehouses.delete')
  );

-- --- Stock Movements ---
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('stock_movements.read')
  );
CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('stock_movements.create')
  );

-- --- UOM Conversions ---
CREATE POLICY "uom_conversions_select" ON public.uom_conversions
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('uom_conversions.read')
  );
CREATE POLICY "uom_conversions_insert" ON public.uom_conversions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('uom_conversions.create')
  );
CREATE POLICY "uom_conversions_update" ON public.uom_conversions
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('uom_conversions.update')
  );
CREATE POLICY "uom_conversions_delete" ON public.uom_conversions
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('uom_conversions.delete')
  );

DROP POLICY IF EXISTS "commission_payouts_select" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_insert" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_update" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_delete" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payout_items_select" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_insert" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_update" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_delete" ON public.commission_payout_items;
-- --- Commission Payouts ---
CREATE POLICY "commission_payouts_select" ON public.commission_payouts
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
  );
CREATE POLICY "commission_payouts_insert" ON public.commission_payouts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
  );
CREATE POLICY "commission_payouts_update" ON public.commission_payouts
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
  );
CREATE POLICY "commission_payouts_delete" ON public.commission_payouts
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
  );

-- --- Commission Payout Items ---
CREATE POLICY "commission_payout_items_select" ON public.commission_payout_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.read')
  );
CREATE POLICY "commission_payout_items_insert" ON public.commission_payout_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.create')
  );
CREATE POLICY "commission_payout_items_update" ON public.commission_payout_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.update')
  );
CREATE POLICY "commission_payout_items_delete" ON public.commission_payout_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = (SELECT get_current_organization())
    )
    AND public.has_permission('sales.delete')
  );

-- --- Audit Log ---
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('audit_log.read')
  );
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
  );

-- --- Notification Configs ---
CREATE POLICY "notification_configs_select" ON public.notification_configs
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('notifications.manage')
  );
CREATE POLICY "notification_configs_insert" ON public.notification_configs
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('notifications.manage')
  );
CREATE POLICY "notification_configs_update" ON public.notification_configs
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('notifications.manage')
  );
CREATE POLICY "notification_configs_delete" ON public.notification_configs
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('notifications.manage')
  );

-- --- Notifications ---
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('notifications.manage')
  );
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
  );

-- --- Shared Reports ---
CREATE POLICY "shared_reports_select" ON public.shared_reports
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
  );
CREATE POLICY "shared_reports_insert" ON public.shared_reports
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
  );
CREATE POLICY "shared_reports_update" ON public.shared_reports
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
  );
CREATE POLICY "shared_reports_delete" ON public.shared_reports
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
  );

-- Keep the anon select for shared reports (public access via link)
CREATE POLICY "anon_select_shared_reports" ON public.shared_reports
  FOR SELECT TO anon USING (true);

-- =============================================
-- 13. RLS policies for profiles table
-- =============================================
CREATE POLICY "profiles_select_own_org" ON public.profiles
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
  );

CREATE POLICY "profiles_update_role" ON public.profiles
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('members.manage_role')
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
  );
