-- ============================================================
-- Secure Organization RBAC: owner-managed custom roles
-- ============================================================

-- 0. Create private schema for helper functions
CREATE SCHEMA IF NOT EXISTS private;

-- 1. Private-schema helper functions

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

REVOKE EXECUTE ON FUNCTION private.is_active_org_member(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_active_org_owner(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_org_creator(UUID) FROM PUBLIC, anon, authenticated;

-- 2. Fix get_user_organization_id() to filter removed_at
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

-- 3. New permission catalog entries — backfill ALL existing orgs
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