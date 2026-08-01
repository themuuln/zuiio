-- Gestation tracking and foal information for breeding records
-- Version: 7 (2026-06-05)
-- Adds gestation tracking columns and foal information to breeding_records.

-- ── 1. Add gestation tracking columns ──────────────────────────
ALTER TABLE breeding_records
  ADD COLUMN IF NOT EXISTS actual_foaling_date TIMESTAMPTZ;

-- ── 2. Add foal information columns ────────────────────────────
ALTER TABLE breeding_records
  ADD COLUMN IF NOT EXISTS foal_name TEXT,
  ADD COLUMN IF NOT EXISTS foal_gender TEXT CHECK (foal_gender IN ('Эр', 'Эм')),
  ADD COLUMN IF NOT EXISTS foal_color TEXT;

-- ── 3. Add indexes for common queries ─────────────────────────
-- Index for finding active pregnancies (pending status)
CREATE INDEX IF NOT EXISTS idx_breeding_records_status
  ON breeding_records(status)
  WHERE status = 'Хээлтсэн';

-- Index for finding overdue pregnancies
CREATE INDEX IF NOT EXISTS idx_breeding_records_expected_foaling
  ON breeding_records(expected_foaling_date)
  WHERE status = 'Хээлтсэн';

-- ── 4. Update RLS policies ────────────────────────────────────
-- Ensure users can update the new foal fields.
-- (breeding_records has owner_id; the legacy herd_label/herds join referenced
-- a herds table that no migration creates — use the owner directly.)
CREATE POLICY "Users can update breeding records"
  ON breeding_records FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── 5. Add comments for documentation ─────────────────────────
COMMENT ON COLUMN breeding_records.actual_foaling_date IS 'Actual date when the foal was born (null until foaled)';
COMMENT ON COLUMN breeding_records.foal_name IS 'Name of the foal (populated after foaling)';
COMMENT ON COLUMN breeding_records.foal_gender IS 'Gender of the foal: Эр (male) or Эм (female)';
COMMENT ON COLUMN breeding_records.foal_color IS 'Coat color of the foal';
