-- Migration 020: Add tamga (brand stamp) and ear mark columns to lost_horse_reports
--
-- Adds tamga_image_url and ear_mark_description columns to the
-- lost_horse_reports table for the Tамга (brand stamp) photo and
-- Им (ear mark) description fields.

-- ── Tamga / Identification columns ─────────────────────────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS tamga_image_url TEXT;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS ear_mark_description TEXT;

-- ── Verification ────────────────────────────────────────────────────
-- RLS policies on lost_horse_reports are table-level, so they continue
-- to apply to all columns (including the new ones) without changes.
