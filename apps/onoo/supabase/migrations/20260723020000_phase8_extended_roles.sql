-- ============================================================================
-- Phase 8 T-8.3 — Extended membership roles for least-privilege access
-- Adds granular roles and cmd_* functions for role management
-- ============================================================================


-- ── Role hierarchy helper ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.role_rank(p_role public.membership_role)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN 100
    WHEN 'admin' THEN 80
    WHEN 'coordinator' THEN 60
    WHEN 'finance' THEN 50
    WHEN 'manager' THEN 40
    WHEN 'trainer' THEN 30
    WHEN 'scorekeeper' THEN 20
    WHEN 'viewer' THEN 10
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION private.role_rank FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.role_rank TO authenticated;

-- ── Check if user has sufficient role level ───────────────────────────────
CREATE OR REPLACE FUNCTION private.user_has_role(
  p_user_id uuid,
  p_scope_type public.membership_scope,
  p_scope_id uuid,
  p_min_role public.membership_role
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = p_user_id
      AND m.scope_type = p_scope_type
      AND m.scope_id = p_scope_id
      AND private.role_rank(m.role) >= private.role_rank(p_min_role)
  );
$$;

REVOKE ALL ON FUNCTION private.user_has_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.user_has_role TO authenticated;

-- ── Grant a role to a user ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmd_assign_role(
  p_user_id uuid,
  p_scope_type public.membership_scope,
  p_scope_id uuid,
  p_role public.membership_role
) RETURNS public.memberships LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_membership public.memberships;
BEGIN
  -- Only owner or admin may assign roles
  IF NOT private.user_has_role(
    (SELECT auth.uid()),
    p_scope_type, p_scope_id,
    'admin'
  ) THEN RAISE EXCEPTION 'not authorized to assign roles';
  END IF;

  -- Only owner can assign another owner
  IF p_role = 'owner' AND NOT private.user_has_role(
    (SELECT auth.uid()),
    p_scope_type, p_scope_id,
    'owner'
  ) THEN RAISE EXCEPTION 'only owner can assign owner role';
  END IF;

  INSERT INTO public.memberships (user_id, scope_type, scope_id, role)
  VALUES (p_user_id, p_scope_type, p_scope_id, p_role)
  ON CONFLICT (user_id, scope_type, scope_id, role) DO NOTHING
  RETURNING * INTO v_membership;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'membership already exists';
  END IF;

  PERFORM private.write_audit('assign_role', 'membership', v_membership.id,
    jsonb_build_object('user_id', p_user_id, 'scope_type', p_scope_type, 'scope_id', p_scope_id, 'role', p_role));
  RETURN v_membership;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_assign_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_assign_role TO authenticated;

-- ── Remove a role from a user ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmd_remove_role(
  p_membership_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_membership public.memberships;
BEGIN
  SELECT * INTO v_membership FROM public.memberships WHERE id = p_membership_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'membership not found'; END IF;

  -- Only owner or admin may remove roles
  IF NOT private.user_has_role(
    (SELECT auth.uid()),
    v_membership.scope_type, v_membership.scope_id,
    'admin'
  ) THEN RAISE EXCEPTION 'not authorized to remove roles';
  END IF;

  -- Cannot remove the last owner
  IF v_membership.role = 'owner' THEN
    IF (SELECT COUNT(*) FROM public.memberships
        WHERE scope_type = v_membership.scope_type
          AND scope_id = v_membership.scope_id
          AND role = 'owner') <= 1 THEN
      RAISE EXCEPTION 'cannot remove the last owner';
    END IF;
  END IF;

  DELETE FROM public.memberships WHERE id = p_membership_id;

  PERFORM private.write_audit('remove_role', 'membership', p_membership_id,
    jsonb_build_object('user_id', v_membership.user_id, 'role', v_membership.role));
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_remove_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_remove_role TO authenticated;

-- ── List memberships for a scope ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmd_list_members(
  p_scope_type public.membership_scope,
  p_scope_id uuid
) RETURNS TABLE(
  membership_id uuid,
  user_id uuid,
  role public.membership_role,
  user_email text,
  display_name text,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  -- Must have at least viewer role to see members
  IF NOT private.user_has_role(
    (SELECT auth.uid()),
    p_scope_type, p_scope_id,
    'viewer'
  ) THEN RAISE EXCEPTION 'not authorized to view members';
  END IF;

  RETURN QUERY
  SELECT
    m.id AS membership_id,
    m.user_id,
    m.role,
    u.email::text AS user_email,
    p.display_name,
    m.created_at
  FROM public.memberships m
  LEFT JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.scope_type = p_scope_type AND m.scope_id = p_scope_id
  ORDER BY private.role_rank(m.role) DESC, m.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_list_members FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_list_members TO authenticated;
