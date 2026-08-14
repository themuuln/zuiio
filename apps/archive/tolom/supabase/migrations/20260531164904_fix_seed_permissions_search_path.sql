-- Fix auto_seed_org_permissions to call seed functions with schema qualification
-- The function was created with SET search_path = '' but calls unqualified
-- function names, causing "function seed_org_permissions(uuid) does not exist"
-- when the AFTER INSERT trigger fires on the organizations table.

CREATE OR REPLACE FUNCTION auto_seed_org_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.seed_org_permissions(NEW.id);
  PERFORM public.seed_org_role_permissions(NEW.id);
  RETURN NEW;
END;
$$;
