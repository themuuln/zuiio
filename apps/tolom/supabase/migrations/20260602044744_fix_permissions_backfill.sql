-- Fix permissions system: add missing enum values, backfill missing permissions
-- Phase 0 of permissions suite

-- ============================================================
-- 1. Add missing enum values to permission_action (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'permission_action'::regtype AND enumlabel = 'write') THEN
    ALTER TYPE permission_action ADD VALUE 'write';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'permission_action'::regtype AND enumlabel = 'invite') THEN
    ALTER TYPE permission_action ADD VALUE 'invite';
  END IF;
END;
$$;

-- ============================================================
-- 1.5 Add unique index for feature_flags upsert support
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_org_key
  ON public.feature_flags(organization_id, flag_key);

-- ============================================================
-- 2. Backfill: ensure all orgs have members.update permission
-- Some orgs created during a migration gap are missing it.
-- ============================================================
INSERT INTO public.permissions (organization_id, name, resource, action, description)
SELECT
  o.id,
  'members.update',
  'members',
  'update',
  'Update team member roles and info'
FROM public.organizations o
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.permissions p
    WHERE p.organization_id = o.id
      AND p.name = 'members.update'
      AND p.deleted_at IS NULL
  )
ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;

-- ============================================================
-- 3. Re-seed org role permissions to catch any gaps
-- Iterates all orgs and ensures role_permission assignments exist
-- ============================================================
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    PERFORM seed_org_role_permissions(org_record.id);
  END LOOP;
END;
$$;
