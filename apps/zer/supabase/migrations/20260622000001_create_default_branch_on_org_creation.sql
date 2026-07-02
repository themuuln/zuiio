-- Migration: Create default branch on org creation
-- =============================================
-- The create_organization() function was missing branch + warehouse
-- creation, causing "Байгууллагад салбар байхгүй байна." errors
-- when users try to perform write actions (purchases, sales, etc.)
-- on organizations created after the branches migration.
-- =============================================

-- =============================================
-- Data backfill: Create default branch + warehouse
-- for any organizations that somehow lack them
-- (e.g. orgs created between the branches migration
--  and this fix).
-- =============================================
DO $$
DECLARE
  org RECORD;
  v_branch_id UUID;
BEGIN
  FOR org IN SELECT id FROM public.organizations
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.branches WHERE organization_id = org.id) THEN
      -- Create default branch
      INSERT INTO public.branches (organization_id, name, slug, address, phone, email, is_default)
      VALUES (org.id, 'Үндсэн салбар', 'undersen-salbAr', NULL, NULL, NULL, true)
      RETURNING id INTO v_branch_id;

      -- Create default warehouse linked to the branch
      INSERT INTO public.warehouses (organization_id, name, location, is_default, branch_id)
      VALUES (org.id, 'Үндсэн салбар - Үндсэн агуулах', NULL, true, v_branch_id)
      ON CONFLICT (branch_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- =============================================
-- Update create_organization() to create a
-- default branch and warehouse for all org types
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
  v_branch_id UUID;
  v_warehouse_id UUID;
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_staff_role_id UUID;
  v_manager_role_id UUID;
  v_trainer_role_id UUID;
  v_reception_role_id UUID;
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

  INSERT INTO public.organizations (name, slug, company_type)
  VALUES (org_name, org_slug, org_type)
  RETURNING id INTO v_new_org_id;

  -- ==========================================
  -- Create default branch and warehouse
  -- ==========================================
  INSERT INTO public.branches (organization_id, name, slug, address, phone, email, is_default)
  VALUES (v_new_org_id, 'Үндсэн салбар', 'undersen-salbAr', NULL, NULL, NULL, true)
  RETURNING id INTO v_branch_id;

  INSERT INTO public.warehouses (organization_id, name, location, is_default, branch_id)
  VALUES (v_new_org_id, 'Үндсэн салбар - Үндсэн агуулах', NULL, true, v_branch_id)
  RETURNING id INTO v_warehouse_id;

  -- ==========================================
  -- GYM-specific roles
  -- ==========================================
  IF org_type = 'gym' THEN
    -- Owner role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_role_id;

    -- Manager role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'manager', 'Менежер - удирдлагын эрхтэй', 1, true)
    RETURNING id INTO v_manager_role_id;

    -- Trainer role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'trainer', 'Дасгалжуулагч - борлуулалт, комиссын эрхтэй', 2, true)
    RETURNING id INTO v_trainer_role_id;

    -- Reception role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'reception', 'Хүлээн авагч - борлуулалтын эрхтэй', 3, true)
    RETURNING id INTO v_reception_role_id;

    -- Owner -> all
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_role_id, v_perm);
    END LOOP;

    -- Manager -> all except roles.manage
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_manager_role_id, v_perm);
      END IF;
    END LOOP;

    -- Trainer -> sales + commission + limited
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
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
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_trainer_role_id, v_perm);
      END IF;
    END LOOP;

    -- Reception -> sales focused
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.create', 'contacts.read', 'contacts.update',
        'sales.create', 'sales.read', 'sales.update',
        'expenses.read',
        'invoices.create', 'invoices.read',
        'warehouses.read',
        'stock_movements.read',
        'uom_conversions.read',
        'members.read',
        'reports.manage',
        'notifications.manage'
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_reception_role_id, v_perm);
      END IF;
    END LOOP;

    -- Set creator as owner
    UPDATE public.profiles
    SET organization_id = v_new_org_id,
        role_id = v_owner_role_id,
        role = 'owner'
    WHERE id = v_user_id;

  ELSE
    -- ==========================================
    -- DEFAULT roles (retail / wholesale / etc.)
    -- ==========================================
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'admin', 'Админ - ихэнх эрхтэй', 1, true)
    RETURNING id INTO v_admin_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'staff', 'Ажилтан - үндсэн эрхтэй', 2, true)
    RETURNING id INTO v_staff_role_id;

    -- Owner -> all
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_role_id, v_perm);
    END LOOP;

    -- Admin -> all except roles.manage
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_admin_role_id, v_perm);
      END IF;
    END LOOP;

    -- Staff -> limited
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

    -- Set creator as owner
    UPDATE public.profiles
    SET organization_id = v_new_org_id,
        role_id = v_owner_role_id,
        role = 'owner'
    WHERE id = v_user_id;
  END IF;

  RETURN json_build_object('id', v_new_org_id);
END;
$$;
