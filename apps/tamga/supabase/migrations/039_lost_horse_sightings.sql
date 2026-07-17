-- ============================================================
-- Lost Horse Sightings — community sighting reports
-- Version: 39 (2026-07-16)
--
-- Creates the sightings table for community members to report
-- "I saw this horse" sightings linked to lost horse reports.
-- Adds sighting_count column to lost_horse_reports.
-- ============================================================

-- ── 1. Create sightings table ───────────────────────────────

CREATE TABLE IF NOT EXISTS lost_horse_sightings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id     UUID NOT NULL REFERENCES lost_horse_reports(id) ON DELETE CASCADE,
  reporter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  description   TEXT,
  photo_url     TEXT,
  is_anonymous  BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sightings_report
  ON lost_horse_sightings(report_id);

CREATE INDEX IF NOT EXISTS idx_sightings_reporter
  ON lost_horse_sightings(reporter_id);

CREATE INDEX IF NOT EXISTS idx_sightings_status
  ON lost_horse_sightings(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sightings_created
  ON lost_horse_sightings(created_at DESC);

-- ── 2. Add sighting_count to lost_horse_reports ──────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS sighting_count INTEGER NOT NULL DEFAULT 0;

-- ── 3. RLS: lost_horse_sightings ─────────────────────────────

ALTER TABLE lost_horse_sightings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view sightings (needed for sighting feed)
CREATE POLICY "sightings_select_auth"
  ON lost_horse_sightings
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert sightings
CREATE POLICY "sightings_insert_auth"
  ON lost_horse_sightings
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Report owners can update sighting status (confirm/dismiss)
CREATE POLICY "sightings_update_owner"
  ON lost_horse_sightings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lost_horse_reports
      WHERE id = report_id AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lost_horse_reports
      WHERE id = report_id AND owner_id = auth.uid()
    )
  );

-- Reporters can delete their own sightings
CREATE POLICY "sightings_delete_own"
  ON lost_horse_sightings
  FOR DELETE
  TO authenticated
  USING (reporter_id = auth.uid());

-- ── 4. Trigger to update sighting_count on lost_horse_reports ─

CREATE OR REPLACE FUNCTION update_sighting_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE lost_horse_reports
    SET sighting_count = sighting_count + 1,
        updated_at = now()
    WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE lost_horse_reports
    SET sighting_count = GREATEST(sighting_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sighting_count_insert
  AFTER INSERT ON lost_horse_sightings
  FOR EACH ROW
  EXECUTE FUNCTION update_sighting_count();

CREATE TRIGGER trigger_sighting_count_delete
  AFTER DELETE ON lost_horse_sightings
  FOR EACH ROW
  EXECUTE FUNCTION update_sighting_count();
