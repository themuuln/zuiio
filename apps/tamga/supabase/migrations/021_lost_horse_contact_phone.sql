-- Migration 021: Add contact phone column to lost_horse_reports
--
-- Adds contact_phone column to the lost_horse_reports table for the
-- Холбоо барих утас (contact phone number) field. The phone is
-- auto-filled from the user's profile phone but user-editable.
-- Editing the report phone does NOT modify the profile phone.

-- ── Contact phone column ──────────────────────────────────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ── Verification ────────────────────────────────────────────────────
-- RLS policies on lost_horse_reports are table-level, so they continue
-- to apply to all columns (including contact_phone) without changes.
