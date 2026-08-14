-- RLS policies call these security-definer helpers as the authenticated user.
-- Keep the helpers outside the exposed schema while allowing policy evaluation.
GRANT EXECUTE ON FUNCTION private.is_active_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_org_creator(uuid) TO authenticated;
