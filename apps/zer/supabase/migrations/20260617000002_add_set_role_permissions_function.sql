-- Set permissions for a role atomically (delete all + insert new in one transaction)
CREATE OR REPLACE FUNCTION public.set_role_permissions(
  p_role_id UUID,
  p_permissions public.app_permission[]
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Must have roles.manage permission to change any role's permissions
  IF NOT public.has_permission('roles.manage') THEN
    RETURN json_build_object('error', 'Permission denied');
  END IF;

  DELETE FROM public.role_permissions WHERE role_id = p_role_id;

  IF array_length(p_permissions, 1) > 0 THEN
    INSERT INTO public.role_permissions (role_id, permission)
    SELECT p_role_id, unnest(p_permissions);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
