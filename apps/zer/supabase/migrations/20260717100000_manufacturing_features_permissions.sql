-- =============================================
-- Manufacturing Module: Features & Permissions
-- =============================================
-- Adds BOM, production orders, job costing,
-- quality control, and material tracking permissions
-- to the existing app_permission enum and backfills
-- owner/admin roles with the new permissions.
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. Add manufacturing enum values to app_permission
-- ═══════════════════════════════════════════════

-- BOM permissions
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'boms.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'boms.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'boms.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'boms.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Production order permissions
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'production_orders.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'production_orders.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'production_orders.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'production_orders.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Production cost permissions
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'production_costs.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Quality check permissions
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quality_checks.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'quality_checks.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════
-- 2. Backfill owner and admin roles with new permissions
-- ═══════════════════════════════════════════════
DO $$
DECLARE
  r RECORD;
  perm public.app_permission;
BEGIN
  -- Owner gets ALL new permissions
  FOR r IN SELECT id, organization_id FROM public.roles WHERE name = 'owner' AND is_system_role = true LOOP
    FOR perm IN
      SELECT p FROM unnest(enum_range(NULL::public.app_permission)) AS p
      WHERE p::TEXT IN (
        'boms.create', 'boms.read', 'boms.update', 'boms.delete',
        'production_orders.create', 'production_orders.read', 'production_orders.update', 'production_orders.delete',
        'production_costs.read',
        'quality_checks.create', 'quality_checks.read'
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (r.id, perm)
      ON CONFLICT (role_id, permission) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Admin gets all new permissions (none are sensitive/restricted like roles.manage)
  FOR r IN SELECT id, organization_id FROM public.roles WHERE name = 'admin' AND is_system_role = true LOOP
    FOR perm IN
      SELECT p FROM unnest(enum_range(NULL::public.app_permission)) AS p
      WHERE p::TEXT IN (
        'boms.create', 'boms.read', 'boms.update', 'boms.delete',
        'production_orders.create', 'production_orders.read', 'production_orders.update', 'production_orders.delete',
        'production_costs.read',
        'quality_checks.create', 'quality_checks.read'
      )
    LOOP
      INSERT INTO public.role_permissions (role_id, permission)
      VALUES (r.id, perm)
      ON CONFLICT (role_id, permission) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
