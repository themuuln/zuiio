-- Consolidate overlapping RLS policies on profiles and organization_public_profiles
-- Identified by Supabase advisor: "multiple_permissive_policies"
-- https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- profiles: profiles_self_select (id = auth.uid()) is a subset of profiles_select (id = auth.uid() OR organization_id = get_current_organization())
-- Drop the redundant one
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;

-- organization_public_profiles: both org_public_profiles_anon_select and org_public_profiles_select_own_org 
-- are permissive SELECT policies for role public. Merge them.
DROP POLICY IF EXISTS "org_public_profiles_anon_select" ON public.organization_public_profiles;
DROP POLICY IF EXISTS "org_public_profiles_select_own_org" ON public.organization_public_profiles;

CREATE POLICY "org_public_profiles_select" ON public.organization_public_profiles
  FOR SELECT
  TO public
  USING (
    catalog_enabled = true
    OR
    organization_id = (SELECT get_current_organization())
  );
