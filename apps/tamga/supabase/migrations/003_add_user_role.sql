-- ============================================================
-- Add user role to profiles
-- Version: 3 (2026-06-05)
--
-- Sprint 2.5: Distinguish casual / breeder / stable users
-- at the database level for feature gating and analytics.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT
    CHECK (role IN ('casual', 'breeder', 'stable'))
    DEFAULT 'casual';
