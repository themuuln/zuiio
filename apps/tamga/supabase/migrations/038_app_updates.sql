-- Migration 038: In-app update system for sideloaded APKs
--
-- Creates app_versions table and apks storage bucket for
-- automatic update distribution via Supabase.

-- ── app_versions table ───────────────────────────────────────────

CREATE TABLE public.app_versions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_code  INT NOT NULL,              -- e.g. 2, 3, 4 — matches versionCode in build.gradle
  version_name  TEXT NOT NULL,             -- e.g. "1.0.0", "1.1.0"
  storage_path  TEXT NOT NULL,             -- "apks/tamga-1.1.0.apk"
  sha256_hash   TEXT NOT NULL,             -- hex checksum for download integrity verification
  changelog     TEXT DEFAULT '',
  force_update  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching the latest version quickly
CREATE INDEX idx_app_versions_code_desc ON public.app_versions (version_code DESC);

-- Anyone can read the app versions list (no auth required)
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app versions"
  ON public.app_versions FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage app versions"
  ON public.app_versions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update app versions"
  ON public.app_versions FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete app versions"
  ON public.app_versions FOR DELETE
  USING (true);

-- ── apks storage bucket ──────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apks',
  'apks',
  true,
  104857600,  -- 100 MB per APK
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Public can read APKs
CREATE POLICY "Anyone can download APKs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'apks');

-- Service role can upload/update/delete APKs
CREATE POLICY "Service role can upload APKs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apks');

CREATE POLICY "Service role can update APKs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'apks');

CREATE POLICY "Service role can delete APKs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'apks');
