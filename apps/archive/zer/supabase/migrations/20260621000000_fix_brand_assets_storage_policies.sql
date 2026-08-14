-- =============================================
-- Fix brand_assets storage bucket org isolation
--
-- Previous policies allowed any authenticated user to upload.
-- New policies scope access to users who belong to an organization
-- and have the settings.manage permission.
-- =============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own brand assets" ON storage.objects;

-- Only users with an org + settings.manage permission can upload
CREATE POLICY "Org users can upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand_assets'
  AND (SELECT public.get_current_organization()) IS NOT NULL
  AND public.has_permission('settings.manage')
);

-- Public can read brand assets (logos need to be public)
CREATE POLICY "Public can read brand assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'brand_assets'
);

-- Uploader or org settings manager can update
CREATE POLICY "Org users can update brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand_assets'
  AND (
    owner = auth.uid()
    OR (
      (SELECT public.get_current_organization()) IS NOT NULL
      AND public.has_permission('settings.manage')
    )
  )
);

-- Uploader or org settings manager can delete
CREATE POLICY "Org users can delete brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand_assets'
  AND (
    owner = auth.uid()
    OR (
      (SELECT public.get_current_organization()) IS NOT NULL
      AND public.has_permission('settings.manage')
    )
  )
);
