-- ============================================================
-- Lost Horse Pricing — per-report tier & payment tracking
-- Version: 22 (2026-06-18)
--
-- Adds pricing_tier, expires_at, and renewal_requested columns
-- to lost_horse_reports, creates a lost_horse_payments table
-- for per-report payment records, and sets up RLS policies.
-- ============================================================

-- ── 1. Add pricing columns to lost_horse_reports ────────────

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS pricing_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE lost_horse_reports
  ADD COLUMN IF NOT EXISTS renewal_requested BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE lost_horse_reports
  ADD CONSTRAINT lost_horse_reports_pricing_tier_check
    CHECK (pricing_tier IN ('free', 'featured', 'vip'));

-- ── 2. Create lost_horse_payments table ─────────────────────

CREATE TABLE IF NOT EXISTS lost_horse_payments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id     UUID NOT NULL REFERENCES lost_horse_reports(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_mnt    INTEGER NOT NULL,
  tier          TEXT NOT NULL CHECK (tier IN ('featured', 'vip')),
  days          INTEGER NOT NULL,
  payment_code  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at   TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lost_horse_payments_report
  ON lost_horse_payments(report_id);

CREATE INDEX IF NOT EXISTS idx_lost_horse_payments_user
  ON lost_horse_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_lost_horse_payments_status
  ON lost_horse_payments(status)
  WHERE status = 'pending';

-- ── 3. RLS: lost_horse_payments ─────────────────────────────

ALTER TABLE lost_horse_payments ENABLE ROW LEVEL SECURITY;

-- Owners can view their own payment records
CREATE POLICY "lost_horse_payments_select_own"
  ON lost_horse_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owners can insert their own payment records
CREATE POLICY "lost_horse_payments_insert_own"
  ON lost_horse_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all payment records
CREATE POLICY "lost_horse_payments_select_admin"
  ON lost_horse_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update payment status (verify/reject)
CREATE POLICY "lost_horse_payments_update_admin"
  ON lost_horse_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 4. Allow admin role in profiles ────────────────────────────
-- The original profiles.role CHECK constraint only allowed
-- ('casual', 'breeder', 'stable').  Admin policies above need
-- role='admin', so widen the constraint.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('casual', 'breeder', 'stable', 'admin'));

-- ── 5. Verification ───────────────────────────────────────────
-- RLS policies on lost_horse_reports are table-level, so the
-- new pricing columns (pricing_tier, expires_at, renewal_requested)
-- continue to apply existing RLS without changes.
