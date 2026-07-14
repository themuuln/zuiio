-- 009_boost_system.sql
-- Adds boost/VIP/badge columns to market_listings and creates market_boosts tracking table.

-- ── 1. New enums ──────────────────────────────────────────────

CREATE TYPE boost_level AS ENUM ('none', 'standard', 'premium');
CREATE TYPE vip_level AS ENUM ('none', 'standard', 'premium');
CREATE TYPE seller_badge_type AS ENUM ('none', 'shop');
CREATE TYPE payment_type AS ENUM ('subscription', 'listingBoost', 'sellerBadge');

-- ── 2. Extend market_listings ─────────────────────────────────

ALTER TABLE market_listings
  ADD COLUMN boost_level boost_level NOT NULL DEFAULT 'none',
  ADD COLUMN boost_expires_at TIMESTAMPTZ,
  ADD COLUMN vip_level vip_level NOT NULL DEFAULT 'none',
  ADD COLUMN vip_expires_at TIMESTAMPTZ,
  ADD COLUMN seller_badge seller_badge_type NOT NULL DEFAULT 'none',
  ADD COLUMN seller_badge_expires_at TIMESTAMPTZ;

-- Partial index for boosted listings (sort-first queries)
CREATE INDEX idx_market_boosted
  ON market_listings (boost_level DESC, created_at DESC)
  WHERE boost_level != 'none' OR vip_level != 'none';

-- ── 3. Extend payment_requests ────────────────────────────────

ALTER TABLE payment_requests
  ADD COLUMN payment_type payment_type NOT NULL DEFAULT 'subscription';

-- ── 4. RLS — no changes needed ───────────────────────────────
-- Existing RLS policies already allow:
--   - Anyone to read active/pending_verification listings
--   - Sellers to update their own listings
-- Boost columns are just additional data on existing rows.

-- ── 5. Backfill existing featured listings ────────────────────
-- Migrate is_featured = true to vip_level = 'standard' (permanent VIP)
UPDATE market_listings
  SET vip_level = 'standard', vip_expires_at = NOW() + INTERVAL '365 days'
  WHERE is_featured = true;
