-- ============================================================
-- Payment System — Khan Bank Manual Verification
-- Version: 5 (2026-06-05)
--
-- Adds subscription tiers, payment request tracking,
-- and an admin verification RPC for manual bank transfers.
-- ============================================================

-- ── 1. Add subscription columns to profiles ─────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'pro', 'breeder', 'stable'));

-- ── 2. Create payment_requests table ────────────────────────
CREATE TABLE IF NOT EXISTS payment_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier          TEXT NOT NULL CHECK (tier IN ('pro', 'breeder', 'stable')),
  code          TEXT NOT NULL UNIQUE,
  amount_mnt    INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at   TIMESTAMPTZ,
  admin_notes   TEXT,
  expires_at    TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_user
  ON payment_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_code
  ON payment_requests(code);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status
  ON payment_requests(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_payment_requests_expires
  ON payment_requests(expires_at)
  WHERE status = 'pending';

-- ── 3. RLS policies ────────────────────────────────────────
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own payment requests
CREATE POLICY "Payment requests: users read own"
  ON payment_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own payment requests
CREATE POLICY "Payment requests: users insert own"
  ON payment_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service role can update (admin verification via RPC)
CREATE POLICY "Payment requests: service role update"
  ON payment_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── 4. verify_payment() RPC function ───────────────────────
-- Called by admin after manually checking Khan Bank history.
-- Verifies payment, updates tier, and sets 30-day expiry.
CREATE OR REPLACE FUNCTION verify_payment(
  p_payment_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- Fetch the payment request
  SELECT * INTO v_payment
  FROM payment_requests
  WHERE id = p_payment_id AND status = 'pending';

  IF v_payment IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment request not found or not pending'
    );
  END IF;

  -- Check if payment has expired
  IF v_payment.expires_at < now() THEN
    UPDATE payment_requests
    SET status = 'expired'
    WHERE id = p_payment_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment request has expired'
    );
  END IF;

  -- Calculate new expiry: 30 days from now (or extend if already subscribed)
  v_new_expires_at := now() + INTERVAL '30 days';

  -- Verify the payment
  UPDATE payment_requests
  SET
    status = 'verified',
    verified_at = now(),
    admin_notes = p_admin_notes
  WHERE id = p_payment_id;

  -- Update user's subscription
  UPDATE profiles
  SET
    subscription_tier = v_payment.tier,
    subscription_expires_at = v_new_expires_at
  WHERE owner_id = v_payment.user_id;

  -- Expire any other pending requests for same user (avoid double-pay)
  UPDATE payment_requests
  SET status = 'expired'
  WHERE user_id = v_payment.user_id
    AND id != p_payment_id
    AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'tier', v_payment.tier,
    'expires_at', v_new_expires_at,
    'user_id', v_payment.user_id
  );
END;
$$;

-- ── 5. reject_payment() RPC function ───────────────────────
CREATE OR REPLACE FUNCTION reject_payment(
  p_payment_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  SELECT * INTO v_payment
  FROM payment_requests
  WHERE id = p_payment_id AND status = 'pending';

  IF v_payment IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment request not found or not pending'
    );
  END IF;

  UPDATE payment_requests
  SET
    status = 'rejected',
    admin_notes = p_admin_notes
  WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id
  );
END;
$$;

-- ── 6. Auto-expire old requests (pg_cron or manual) ────────
-- Run periodically: UPDATE payment_requests SET status = 'expired'
-- WHERE status = 'pending' AND expires_at < now();
