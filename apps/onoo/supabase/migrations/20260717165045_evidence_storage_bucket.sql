-- Task 1.3: Private storage bucket for submission evidence files
-- Admin-only read/write; evidence URLs are stored in source_submissions.evidence_url

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('evidence', 'evidence', false, 10485760, '{image/jpeg,image/png,image/webp,application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Authenticated read (admin-gated at API layer)
CREATE POLICY "Authenticated read evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidence');

-- Authenticated upload
CREATE POLICY "Authenticated upload evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');

-- Authenticated delete (replace/revoke)
CREATE POLICY "Authenticated delete evidence" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'evidence');
