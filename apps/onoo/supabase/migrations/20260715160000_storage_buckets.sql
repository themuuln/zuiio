-- Task 2.1: Storage buckets for player photos and team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('player-photos', 'player-photos', true, 2097152, '{image/jpeg,image/png,image/webp}'),
  ('team-logos', 'team-logos', true, 2097152, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('player-photos', 'team-logos'));

-- Authenticated upload (admin-gated at API layer)
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('player-photos', 'team-logos'));

-- Allow authenticated users to update (supports re-upload/replace)
CREATE POLICY "Authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('player-photos', 'team-logos'))
  WITH CHECK (bucket_id IN ('player-photos', 'team-logos'));

-- Allow authenticated users to delete old files
CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('player-photos', 'team-logos'));
