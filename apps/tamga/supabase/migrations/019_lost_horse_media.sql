-- Migration 019: Lost horse media table
--
-- Creates the lost_horse_media table for storing photo/video URLs
-- associated with lost horse reports, with RLS policies:
--   - Owner can CRUD their own media (via report ownership)
--   - Public can read all media

-- ── Lost Horse Media Table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lost_horse_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES lost_horse_reports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_horse_media_report_id
  ON lost_horse_media(report_id);

-- ── RLS Policies ────────────────────────────────────────────────────

ALTER TABLE lost_horse_media ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their own lost horse media (via report ownership)
CREATE POLICY "Owner can CRUD own lost horse media"
  ON lost_horse_media FOR ALL
  USING (
    report_id IN (SELECT id FROM lost_horse_reports WHERE owner_id = auth.uid())
  );

-- Public can read lost horse media
CREATE POLICY "Public can read lost horse media"
  ON lost_horse_media FOR SELECT
  USING (true);
