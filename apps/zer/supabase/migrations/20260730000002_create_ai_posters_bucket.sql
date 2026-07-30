-- ============================================================================
-- AI Poster Generation: Storage bucket for generated posters
-- ============================================================================
-- Creates the ai-posters storage bucket with org-scoped RLS policies.
-- ============================================================================

-- 1. Storage bucket for AI-generated posters ─────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ai-posters', 'ai-posters', true, 10485760, ARRAY['image/webp', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: ai-posters storage ─────────────────────────────────────────────────
-- Org-scoped: users in the same organization can read/write posters.

CREATE POLICY "ai_posters_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ai-posters'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );

CREATE POLICY "ai_posters_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ai-posters'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );

CREATE POLICY "ai_posters_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ai-posters'
    AND (storage.foldername(name))[1] = (SELECT get_current_organization())::text
  );
