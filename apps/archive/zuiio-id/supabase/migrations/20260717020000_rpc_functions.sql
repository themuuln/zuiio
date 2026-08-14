-- ============================================================
-- I8: acceptInvite RPC function (fixes TOCTOU race condition)
-- Atomic: check membership + insert + mark invite accepted
-- ============================================================

CREATE OR REPLACE FUNCTION accept_invite(
  invite_token TEXT,
  user_id UUID
)
RETURNS TABLE(org_id UUID, error TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  invite_record RECORD;
  existing_member UUID;
BEGIN
  -- Find the invite (atomic read)
  SELECT * INTO invite_record
  FROM org_invites
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, 'Урилга олдсонгүй эсвэл хугацаа нь дууссан байна.'::TEXT;
    RETURN;
  END IF;

  -- Check if already a member (atomic check)
  SELECT user_id INTO existing_member
  FROM org_memberships
  WHERE org_id = invite_record.org_id
    AND user_id = user_id;

  IF FOUND THEN
    RETURN QUERY SELECT invite_record.org_id, 'Та аль хэдийн энэ байгууллагын гишүүн байна.'::TEXT;
    RETURN;
  END IF;

  -- Add membership (atomic insert)
  INSERT INTO org_memberships (org_id, user_id, role_id, invited_by)
  VALUES (invite_record.org_id, user_id, invite_record.role_id, invite_record.invited_by);

  -- Mark invite as accepted (atomic update)
  UPDATE org_invites
  SET accepted_at = now()
  WHERE id = invite_record.id;

  RETURN QUERY SELECT invite_record.org_id, NULL::TEXT;
END;
$$;

-- ============================================================
-- I9: createOrganization RPC function (fixes orphan risk)
-- Atomic: create org + add owner membership
-- ============================================================

CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  creator_id UUID
)
RETURNS TABLE(org_id UUID, org_name_out TEXT, org_slug_out TEXT, created_at_out TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  owner_role_id UUID;
  new_org_id UUID;
BEGIN
  -- Get owner role ID
  SELECT id INTO owner_role_id
  FROM roles
  WHERE name = 'owner';

  IF owner_role_id IS NULL THEN
    RAISE EXCEPTION 'Owner role not found';
  END IF;

  -- Create organization (atomic)
  INSERT INTO organizations (name, slug, created_by)
  VALUES (org_name, org_slug, creator_id)
  RETURNING id INTO new_org_id;

  -- Add creator as owner (atomic, in same transaction)
  INSERT INTO org_memberships (org_id, user_id, role_id)
  VALUES (new_org_id, creator_id, owner_role_id);

  -- Return the created organization
  RETURN QUERY
  SELECT o.id, o.name, o.slug, o.created_at
  FROM organizations o
  WHERE o.id = new_org_id;
END;
$$;
