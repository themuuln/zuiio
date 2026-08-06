-- 13. Drop and recreate RLS policies on RBAC tables

-- roles: owner-only write
DROP POLICY IF EXISTS "Users can view roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can insert roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can update roles in their org" ON public.roles;
DROP POLICY IF EXISTS "Users can delete roles in their org" ON public.roles;

CREATE POLICY "Members can view roles in their org"
  ON public.roles FOR SELECT TO authenticated
  USING (private.is_active_org_member(organization_id));

CREATE POLICY "Owners can insert roles in their org"
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can update roles in their org"
  ON public.roles FOR UPDATE TO authenticated
  USING (private.is_active_org_owner(organization_id))
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can delete roles in their org"
  ON public.roles FOR DELETE TO authenticated
  USING (private.is_active_org_owner(organization_id));

-- permissions: read-only for members
DROP POLICY IF EXISTS "Users can view permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can insert permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can update permissions in their org" ON public.permissions;
DROP POLICY IF EXISTS "Users can delete permissions in their org" ON public.permissions;

CREATE POLICY "Members can view permissions in their org"
  ON public.permissions FOR SELECT TO authenticated
  USING (private.is_active_org_member(organization_id));

-- role_permissions: owner-only write
DROP POLICY IF EXISTS "Users can view role_permissions in their org" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can insert role_permissions in their org" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can delete role_permissions in their org" ON public.role_permissions;

CREATE POLICY "Members can view role_permissions in their org"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles
    WHERE roles.id = role_permissions.role_id
      AND roles.deleted_at IS NULL
      AND private.is_active_org_member(roles.organization_id)
  ));

CREATE POLICY "Owners can insert role_permissions in their org"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.roles
    WHERE roles.id = role_permissions.role_id
      AND roles.deleted_at IS NULL
      AND private.is_active_org_owner(roles.organization_id)
  ));

CREATE POLICY "Owners can delete role_permissions in their org"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles
    WHERE roles.id = role_permissions.role_id
      AND roles.deleted_at IS NULL
      AND private.is_active_org_owner(roles.organization_id)
  ));

-- organization_users: owner-only write, with bootstrap exception
DROP POLICY IF EXISTS "Users can view org memberships they belong to" ON public.organization_users;
DROP POLICY IF EXISTS "Users can insert org memberships for their org" ON public.organization_users;
DROP POLICY IF EXISTS "Users can update org memberships in their org" ON public.organization_users;
DROP POLICY IF EXISTS "Users can delete org memberships in their org" ON public.organization_users;

CREATE POLICY "Members can view org memberships in their org"
  ON public.organization_users FOR SELECT TO authenticated
  USING (private.is_active_org_member(organization_id));

CREATE POLICY "Owners or bootstrap can insert org memberships"
  ON public.organization_users FOR INSERT TO authenticated
  WITH CHECK (
    private.is_active_org_owner(organization_id)
    OR (
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
  ON public.organization_users FOR UPDATE TO authenticated
  USING (private.is_active_org_owner(organization_id))
  WITH CHECK (private.is_active_org_owner(organization_id));

CREATE POLICY "Owners can delete org memberships in their org"
  ON public.organization_users FOR DELETE TO authenticated
  USING (private.is_active_org_owner(organization_id));

-- 14. Harden accept_invite
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
  v_role_name TEXT;
BEGIN
  IF accepting_user_id != (SELECT auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot accept invite on behalf of another user');
  END IF;

  SELECT * INTO invite_record
  FROM public.org_invites
  WHERE token = invite_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found, already accepted, or expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_id = invite_record.organization_id
      AND user_id = accepting_user_id AND removed_at IS NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this organization');
  END IF;

  resolved_role_id := invite_record.role_id;
  IF resolved_role_id IS NOT NULL THEN
    SELECT organization_id, name INTO v_role_org, v_role_name
    FROM public.roles WHERE id = resolved_role_id AND deleted_at IS NULL;

    IF v_role_org IS NULL OR v_role_org != invite_record.organization_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invited role does not belong to this organization');
    END IF;
    IF v_role_name = 'Org Owner' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot assign Org Owner role via invite');
    END IF;
  ELSE
    SELECT id INTO resolved_role_id
    FROM public.roles
    WHERE organization_id = invite_record.organization_id AND name = 'Mechanic' AND deleted_at IS NULL
    LIMIT 1;
    IF resolved_role_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No default Mechanic role found for this organization');
    END IF;
  END IF;

  SELECT id INTO org_branch_id
  FROM public.branches
  WHERE organization_id = invite_record.organization_id AND is_main = true
  LIMIT 1;

  INSERT INTO public.organization_users (organization_id, user_id, role_id, branch_id, is_primary)
  VALUES (invite_record.organization_id, accepting_user_id, resolved_role_id, org_branch_id, true);

  INSERT INTO public.profiles (id, organization_id, branch_id, is_active)
  VALUES (accepting_user_id, invite_record.organization_id, org_branch_id, true)
  ON CONFLICT (id) DO UPDATE SET
    organization_id = excluded.organization_id,
    branch_id = excluded.branch_id,
    updated_at = now();

  UPDATE public.org_invites SET status = 'accepted', updated_at = now() WHERE id = invite_record.id;

  RETURN jsonb_build_object('success', true, 'organization_id', invite_record.organization_id);
END;
$$;