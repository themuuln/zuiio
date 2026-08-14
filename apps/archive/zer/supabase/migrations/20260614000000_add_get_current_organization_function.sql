-- =============================================
-- Define get_current_organization() function
--
-- This function was previously created manually via the Supabase dashboard
-- but was never tracked in version control. All RLS policies depend on it.
-- Fresh deployments need this to exist before any other migration.
-- =============================================

-- Use SECURITY DEFINER to avoid infinite recursion with profiles RLS
-- (profiles SELECT policy itself calls get_current_organization())
CREATE OR REPLACE FUNCTION public.get_current_organization()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
$$;
