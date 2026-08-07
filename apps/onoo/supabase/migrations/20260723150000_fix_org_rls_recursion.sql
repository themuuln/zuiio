-- ============================================================================
-- Fix infinite RLS recursion in organizations table
-- The "Members can read their orgs" policy on public.organizations references
-- org_memberships in a subquery, which triggers RLS on org_memberships, which
-- also references org_memberships recursively.
--
-- This policy was also semantically broken (org_memberships.org_id = org_memberships.id
-- compares two different UUID columns, always false).
--
-- Other policies (public_read_organizations, authenticated_read_organizations)
-- already allow SELECT for authenticated users.
-- ============================================================================

DROP POLICY IF EXISTS "Members can read their orgs" ON public.organizations;
