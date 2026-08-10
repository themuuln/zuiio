-- ============================================================
-- Fix accept_invite: single primary org per user + concurrency
-- ============================================================
-- Bug 1: accepting an invite inserted the new membership with
-- is_primary = true WITHOUT demoting the user's existing primary
-- org. Multiple is_primary = true rows broke getCurrentUserProfile's
-- maybeSingle() on (user_id, is_primary) -> organizationId resolved
-- to null -> dashboard fell back to the "TOLOM" placeholder and
-- lost the org context after accepting an invite.
--
-- Bug 2 (concurrency): the invite row was selected without a lock,
-- so two concurrent accepts of the same token could both pass the
-- pending check and both insert memberships.
--
-- Fixes:
--   1. Demote any existing primary membership before inserting the
--      new one (which stays primary, as intended).
--   2. Lock the invite row (FOR UPDATE) so a concurrent accept of
--      the same token sees status = 'accepted' and fails cleanly.
--   3. Repair pre-existing duplicate primaries (keep the newest per
--      user) and enforce the invariant with a partial unique index.
-- ============================================================

-- Repair: keep only the most recently joined primary per user
-- (ties broken by organization_id for determinism).
UPDATE public.organization_users ou
SET is_primary = false
WHERE is_primary = true
  AND removed_at IS NULL
  AND (ou.joined_at, ou.organization_id) < (
    SELECT ou2.joined_at, ou2.organization_id
    FROM public.organization_users ou2
    WHERE ou2.user_id = ou.user_id
      AND ou2.is_primary = true
      AND ou2.removed_at IS NULL
    ORDER BY ou2.joined_at DESC, ou2.organization_id DESC
    LIMIT 1
  );

-- Enforce the invariant going forward: at most one active primary
-- membership per user.
CREATE UNIQUE INDEX IF NOT EXISTS organization_users_single_active_primary
ON public.organization_users (user_id)
WHERE is_primary = true AND removed_at IS NULL;

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
  WHERE token = invite_token AND status = 'pending' AND expires_at > now()
  FOR UPDATE;

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

  -- Demote the user's previous primary org so the invited org becomes
  -- the single primary (getCurrentUserProfile resolves on is_primary).
  UPDATE public.organization_users
  SET is_primary = false
  WHERE user_id = accepting_user_id
    AND is_primary = true
    AND removed_at IS NULL;

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

GRANT EXECUTE ON FUNCTION public.accept_invite(text, uuid) TO authenticated;
