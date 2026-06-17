-- Set permissions for a role atomically (delete all + insert new in one transaction)
CREATE OR REPLACE FUNCTION public.set_role_permissions(
  p_role_id UUID,
  p_permissions public.app_permission[]
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.role_permissions WHERE role_id = p_role_id;
  INSERT INTO public.role_permissions (role_id, permission)
  SELECT p_role_id, unnest(p_permissions);
  RETURN json_build_object('success', true);
END;
$$;
