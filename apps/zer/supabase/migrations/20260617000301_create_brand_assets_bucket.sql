-- Create storage bucket for brand assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand_assets', 'brand_assets', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to brand_assets
CREATE POLICY IF NOT EXISTS "Authenticated users can upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand_assets'
);

-- Allow public to read brand assets
CREATE POLICY IF NOT EXISTS "Public can read brand assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'brand_assets'
);

-- Allow owners to update their uploads
CREATE POLICY IF NOT EXISTS "Users can update own brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand_assets' AND owner = auth.uid()
);

-- Allow owners to delete their uploads
CREATE POLICY IF NOT EXISTS "Users can delete own brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand_assets' AND owner = auth.uid()
);
