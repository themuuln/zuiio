-- ============================================================
-- Fix profiles table: add self-view RLS policy + create missing profiles
-- ============================================================

-- 1. Add a permissive SELECT policy so users can see their own profile
--    even before they have an organization membership.
--    Existing policies only allow viewing profiles in the same org,
--    but a newly signed-up user has no org yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      USING (id = auth.uid());
  END IF;
END
$$;

-- 2. Insert missing profiles for auth users who don't have one yet
INSERT INTO public.profiles (id, is_active)
SELECT au.id, true
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
