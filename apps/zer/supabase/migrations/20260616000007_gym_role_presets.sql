-- =============================================
-- Gym role presets
-- Adds gym-specific roles and updates
-- create_organization() to handle company_type
-- =============================================

-- First drop old policies / functions that reference create_organization
-- We need to drop dependent policies that use has_permission (which references profiles.role_id)
-- Actually, we're just replacing the function, so no policy changes needed.

-- =============================================
-- 1. Seed gym roles for existing gym orgs
-- =============================================
DO $$
DECLARE
  org_record RECORD;
  v_owner_id UUID;
  v_manager_id UUID;
  v_trainer_id UUID;
  v_reception_id UUID;
  v_perm public.app_permission;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE company_type = 'gym' LOOP
    -- Skip if gym roles already exist
    IF EXISTS (SELECT 1 FROM public.roles WHERE organization_id = org_record.id AND name = 'reception' LIMIT 1) THEN
      CONTINUE;
    END IF;

    -- Remove default roles if they exist (owner/admin/staff)
    DELETE FROM public.role_permissions WHERE role_id IN (
      SELECT id FROM public.roles WHERE organization_id = org_record.id
    );
    DELETE FROM public.roles WHERE organization_id = org_record.id;

    -- Create owner role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_id;

    -- Create manager role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'manager', 'Менежер - удирдлагын эрхтэй', 1, true)
    RETURNING id INTO v_manager_id;

    -- Create trainer role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'trainer', 'Дасгалжуулагч - борлуулалт, комиссын эрхтэй', 2, true)
    RETURNING id INTO v_trainer_id;

    -- Create reception role
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (org_record.id, 'reception', 'Хүлээн авагч - борлуулалтын эрхтэй', 3, true)
    RETURNING id INTO v_reception_id;

    -- Owner gets ALL permissions
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_id, v_perm);
    END LOOP;

    -- Manager gets all EXCEPT roles.manage
    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_manager_id, v_perm);
      END IF;
    END LOOP;

    -- Trainer permissions
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
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_trainer_id, v_perm);
      END IF;
    END LOOP;

    -- Reception permissions (sales focused)
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
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_reception_id, v_perm);
      END IF;
    END LOOP;

    -- Update existing profiles: keep profile.role text but assign correct role_id
    UPDATE public.profiles p
    SET role_id = v_owner_id
    WHERE p.organization_id = org_record.id
      AND p.role = 'owner';

    UPDATE public.profiles p
    SET role_id = v_manager_id
    WHERE p.organization_id = org_record.id
      AND p.role = 'admin';

    UPDATE public.profiles p
    SET role_id = v_trainer_id
    WHERE p.organization_id = org_record.id
      AND p.role = 'staff';

    -- Any profile in this org with no matching text role -> staff -> trainer
    UPDATE public.profiles p
    SET role_id = v_trainer_id
    WHERE p.organization_id = org_record.id
      AND p.role_id IS NULL;
  END LOOP;
END $$;

-- =============================================
-- 2. Update create_organization() for gym
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
