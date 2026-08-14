-- Backfill role assignments for existing org users
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