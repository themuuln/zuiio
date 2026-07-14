-- Migration 012: Supabase Storage buckets for media
--
-- Creates storage buckets for:
-- - horse-photos: public read, owner write (horse photos, event photos, avatars)
-- - documents: private, owner read/write (vet certs, insurance, registration)
-- - market-media: public read, seller write (marketplace listing photos)
--
-- Note: R2 (videos) is handled externally via Cloudflare Worker.
-- Video paths are stored in the database but files live in R2.

-- ── Create buckets ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'horse-photos',
    'horse-photos',
    true,
    10485760,  -- 10 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'documents',
    'documents',
    false,
    20971520,  -- 20 MB per file
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword']
  ),
  (
    'market-media',
    'market-media',
    true,
    10485760,  -- 10 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ── horse-photos policies ───────────────────────────────────────

-- Public can read all horse photos
CREATE POLICY "Public can view horse photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'horse-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload horse photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'horse-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own photos
CREATE POLICY "Users can update own horse photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'horse-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete own horse photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'horse-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── documents policies ──────────────────────────────────────────

-- Only owners can see their documents
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can upload to their own folder
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── market-media policies ───────────────────────────────────────

-- Public can read marketplace media
CREATE POLICY "Public can view market media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'market-media');

-- Users can upload to their own market folder
CREATE POLICY "Users can upload market media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'market-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own market media
CREATE POLICY "Users can update own market media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'market-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own market media
CREATE POLICY "Users can delete own market media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'market-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
