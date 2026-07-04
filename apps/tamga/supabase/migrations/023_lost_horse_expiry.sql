-- ============================================================
-- Lost Horse Expiry & Renewal — status & notification support
-- Version: 23 (2026-06-18)
--
-- 1. Adds 'expired' status to lost_horse_reports CHECK constraint
-- 2. Creates lost_horse_renewal_notifications table for tracking
--    scheduled local notifications (optional — app-side scheduling
--    via LocalNotificationService is primary)
-- ============================================================

-- ── 1. Update status CHECK constraint ─────────────────────────

ALTER TABLE lost_horse_reports
  DROP CONSTRAINT IF EXISTS lost_horse_reports_status_check;

ALTER TABLE lost_horse_reports
  ADD CONSTRAINT lost_horse_reports_status_check
    CHECK (status IN ('active', 'found', 'cancelled', 'expired'));

-- ── 2. Index on expires_at for expiry queries ────────────────

CREATE INDEX IF NOT EXISTS idx_lost_horse_reports_expires_at
  ON lost_horse_reports(expires_at)
  WHERE expires_at IS NOT NULL;
