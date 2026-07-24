-- Allow users to leave their organization (set org/role to null on their own profile)
CREATE POLICY "profiles_leave_org" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Only allow nulling out the org fields (leaving the org)
    AND organization_id IS NULL
    AND role_id IS NULL
    AND role IS NULL
    -- Ensure the user actually had an org before (prevent arbitrary updates)
    AND OLD.organization_id IS NOT NULL
  );
