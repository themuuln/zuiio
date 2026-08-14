-- Allow users to leave their organization (set org/role to null on their own profile)
CREATE POLICY "profiles_leave_org" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    AND organization_id IS NOT NULL
  )
  WITH CHECK (
    id = auth.uid()
    AND organization_id IS NULL
    AND role_id IS NULL
    AND role IS NULL
  );
