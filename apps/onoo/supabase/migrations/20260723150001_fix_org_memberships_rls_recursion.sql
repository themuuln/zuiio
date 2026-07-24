-- ============================================================================
-- Fix infinite RLS recursion in memberships table
-- The "Members can read their memberships" policy references memberships
-- in a subquery, causing infinite recursion.
--
-- Fixed: use a direct user_id comparison instead of a self-referencing subquery.
-- ============================================================================

DROP POLICY IF EXISTS "Members can read their memberships" ON public.memberships;

CREATE POLICY "Users can read own memberships" ON public.memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
