-- Fix accounting seed data for branch-scoped chart_of_accounts rows.
-- The original function predates the required branch_id column and failed
-- for every organization after multi-branch support was introduced.
CREATE OR REPLACE FUNCTION public.seed_default_chart_of_accounts(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_branch_id UUID;
  v_asset_id UUID;
  v_liability_id UUID;
  v_equity_id UUID;
  v_income_id UUID;
  v_expense_id UUID;
BEGIN
  SELECT b.id
  INTO v_branch_id
  FROM public.branches AS b
  WHERE b.organization_id = p_organization_id
  ORDER BY b.is_default DESC, b.created_at ASC NULLS LAST, b.id
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Cannot seed chart of accounts: organization % has no branch', p_organization_id
      USING ERRCODE = '23514';
  END IF;

  -- Asset group
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type)
  VALUES (p_organization_id, v_branch_id, '1000', 'Хөрөнгө', 'asset')
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = true
  RETURNING id INTO v_asset_id;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '1100', 'Бэлэн мөнгө', 'asset', v_asset_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '1200', 'Банкны данс', 'asset', v_asset_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '1300', 'Авлага', 'asset', v_asset_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '1400', 'Бараа материал', 'asset', v_asset_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;

  -- Liability group
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type)
  VALUES (p_organization_id, v_branch_id, '2000', 'Өр төлбөр', 'liability')
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = true
  RETURNING id INTO v_liability_id;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '2100', 'Өглөг', 'liability', v_liability_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '2200', 'Татвар', 'liability', v_liability_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;

  -- Equity group
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type)
  VALUES (p_organization_id, v_branch_id, '3000', 'Өмч', 'equity')
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = true
  RETURNING id INTO v_equity_id;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '3100', 'Анхны хөрөнгө', 'equity', v_equity_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '3200', 'Хуримтлагдсан ашиг', 'equity', v_equity_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;

  -- Income group
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type)
  VALUES (p_organization_id, v_branch_id, '4000', 'Орлого', 'income')
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = true
  RETURNING id INTO v_income_id;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '4100', 'Борлуулалтын орлого', 'income', v_income_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '4200', 'Бусад орлого', 'income', v_income_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;

  -- Expense group
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type)
  VALUES (p_organization_id, v_branch_id, '5000', 'Зарлага', 'expense')
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = true
  RETURNING id INTO v_expense_id;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '5100', 'Борлуулсан бүтээгдэхүүний өртөг', 'expense', v_expense_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '5200', 'Үйл ажиллагааны зарлага', 'expense', v_expense_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
  INSERT INTO public.chart_of_accounts (organization_id, branch_id, code, name, type, parent_id)
  VALUES (p_organization_id, v_branch_id, '5300', 'Тарифаас бусад зарлага', 'expense', v_expense_id)
  ON CONFLICT (organization_id, branch_id, code)
  DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, is_active = true;
END;
$$;

-- Ensure the onboarding RPC creates the same accounting baseline as the
-- explicit branch-creation action. This replacement preserves the existing
-- role/permission behavior and adds the seed after the default branch exists.
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

  INSERT INTO public.branches (organization_id, name, slug, address, phone, email, is_default)
  VALUES (v_new_org_id, 'Үндсэн салбар', 'undersen-salbAr', NULL, NULL, NULL, true)
  RETURNING id INTO v_branch_id;

  INSERT INTO public.warehouses (organization_id, name, location, is_default, branch_id)
  VALUES (v_new_org_id, 'Үндсэн салбар - Үндсэн агуулах', NULL, true, v_branch_id)
  RETURNING id INTO v_warehouse_id;

  PERFORM public.seed_default_chart_of_accounts(v_new_org_id);

  IF org_type = 'gym' THEN
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'manager', 'Менежер - удирдлагын эрхтэй', 1, true)
    RETURNING id INTO v_manager_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'trainer', 'Дасгалжуулагч - борлуулалт, комиссын эрхтэй', 2, true)
    RETURNING id INTO v_trainer_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'reception', 'Хүлээн авагч - борлуулалтын эрхтэй', 3, true)
    RETURNING id INTO v_reception_role_id;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_role_id, v_perm);
    END LOOP;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_manager_role_id, v_perm);
      END IF;
    END LOOP;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.create', 'contacts.read', 'contacts.update', 'contacts.delete',
        'sales.create', 'sales.read', 'sales.update', 'sales.delete',
        'expenses.create', 'expenses.read',
        'invoices.create', 'invoices.read',
        'warehouses.read', 'stock_movements.read', 'uom_conversions.read',
        'members.read', 'reports.manage', 'notifications.manage', 'audit_log.read'
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_trainer_role_id, v_perm);
      END IF;
    END LOOP;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.create', 'contacts.read', 'contacts.update',
        'sales.create', 'sales.read', 'sales.update',
        'expenses.read', 'invoices.create', 'invoices.read',
        'warehouses.read', 'stock_movements.read', 'uom_conversions.read',
        'members.read', 'reports.manage', 'notifications.manage'
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_reception_role_id, v_perm);
      END IF;
    END LOOP;

    UPDATE public.profiles
    SET organization_id = v_new_org_id, role_id = v_owner_role_id, role = 'owner'
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'owner', 'Байгууллагын эзэмшигч - бүх эрхтэй', 0, true)
    RETURNING id INTO v_owner_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'admin', 'Админ - ихэнх эрхтэй', 1, true)
    RETURNING id INTO v_admin_role_id;

    INSERT INTO public.roles (organization_id, name, description, hierarchy_level, is_system_role)
    VALUES (v_new_org_id, 'staff', 'Ажилтан - үндсэн эрхтэй', 2, true)
    RETURNING id INTO v_staff_role_id;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      INSERT INTO public.role_permissions (role_id, permission) VALUES (v_owner_role_id, v_perm);
    END LOOP;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm != 'roles.manage' THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_admin_role_id, v_perm);
      END IF;
    END LOOP;

    FOR v_perm IN SELECT unnest(enum_range(NULL::public.app_permission)) LOOP
      IF v_perm IN (
        'products.read', 'categories.read', 'brands.read',
        'contacts.read', 'contacts.create',
        'sales.create', 'sales.read', 'sales.update',
        'expenses.create', 'expenses.read',
        'invoices.create', 'invoices.read',
        'warehouses.read', 'stock_movements.read', 'uom_conversions.read',
        'members.read', 'reports.manage', 'notifications.manage', 'audit_log.read'
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission) VALUES (v_staff_role_id, v_perm);
      END IF;
    END LOOP;

    UPDATE public.profiles
    SET organization_id = v_new_org_id, role_id = v_owner_role_id, role = 'owner'
    WHERE id = v_user_id;
  END IF;

  RETURN json_build_object('id', v_new_org_id);
END;
$$;
