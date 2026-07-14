-- Migration 018: Add new columns to lost_horse_reports
--
-- Adds location hierarchy, animal information, and count fields to the
-- lost_horse_reports table. Default values ensure existing rows get
-- sensible defaults for the new required fields.

-- ── Location hierarchy columns ─────────────────────────────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS location_aimag TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS location_sum TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS location_bag TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- ── Animal information columns ─────────────────────────────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS animal_type TEXT NOT NULL DEFAULT 'horse';

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS animal_ages TEXT[];

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS breed TEXT DEFAULT 'mongolian';

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS coat_color TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS lost_count INTEGER NOT NULL DEFAULT 1;

-- ── Verification: RLS policies still apply ──────────────────────────
-- RLS policies on lost_horse_reports are table-level, so they continue
-- to apply to all columns (including the new ones) without changes.
-- Existing policies from 010_map_features.sql and 013_rls_policies.sql:
--   - "Owner can CRUD own lost reports" (010)
--   - "Public can read active lost reports" (010)
--   - "Lost horse update by owner" (013)
--   - "Lost horse delete by owner" (013)
