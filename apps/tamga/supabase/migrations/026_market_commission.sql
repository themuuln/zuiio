-- ============================================================
-- Market Commission Tracking
-- Version: 26 (2026-06-18)
--
-- Adds commission tracking columns to market_listings table.
-- Sprint 4: Marketplace completion — commission tracking.
-- ============================================================

-- ── 1. Add commission columns to market_listings ──────────────
ALTER TABLE market_listings
  ADD COLUMN IF NOT EXISTS commission_rate DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS commission_amount INTEGER;

-- ── 2. Index for commission-based queries ─────────────────────
CREATE INDEX IF NOT EXISTS idx_market_listings_commission
  ON market_listings(commission_rate)
  WHERE commission_rate IS NOT NULL;

COMMENT ON COLUMN market_listings.commission_rate IS
  'Комиссын хувь хэмжээ (аравтын бутархай, жишээ нь 0.05 = 5%)';
COMMENT ON COLUMN market_listings.commission_amount IS
  'Комиссын дүн (MNT)';
