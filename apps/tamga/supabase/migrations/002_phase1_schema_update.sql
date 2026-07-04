-- ============================================================
-- Phase 1 Schema Update
-- Version: 2 (2026-06-05)
--
-- Aligns Supabase schema with Dart models after Phase 1
-- local-first stabilization:
--   - Horse model merge (HorseRecord + LineageHorse → Horse)
--   - HealthLog merge (MedicalLog + FarrierLog → HealthLog)
--   - EventRecord field alignment
--   - MarketListing additions
--   - CoOwnership model update
--   - Breeding records table
-- ============================================================

-- ============================================================
-- HORSES — add missing fields from unified Horse model
-- ============================================================
ALTER TABLE horses
  ADD COLUMN IF NOT EXISTS relation_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS award_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offspring_count INTEGER DEFAULT 0;

-- ============================================================
-- HEALTH LOGS — merge farrier_logs into health_logs
--
-- The Dart HealthLog model combines medical and farrier logs
-- into a single table with LogType enum:
--   vaccination, deworming, treatment, vetVisit, shoeing, trimming
-- ============================================================

-- Add farrier columns to health_logs
ALTER TABLE health_logs
  ADD COLUMN IF NOT EXISTS cost INTEGER CHECK (cost IS NULL OR cost >= 0),
  ADD COLUMN IF NOT EXISTS farrier_name TEXT;

-- Update CHECK constraint to include all LogType values
ALTER TABLE health_logs DROP CONSTRAINT IF EXISTS health_logs_log_type_check;
ALTER TABLE health_logs ADD CONSTRAINT health_logs_log_type_check
  CHECK (log_type IN (
    'vaccination', 'deworming', 'treatment', 'vetVisit',
    'shoeing', 'trimming'
  ));

-- Migrate data from farrier_logs into health_logs
INSERT INTO health_logs (id, horse_id, log_type, date, notes, cost, farrier_name, created_at, updated_at)
SELECT
  id, horse_id,
  CASE log_type
    WHEN 'shoeing' THEN 'shoeing'
    WHEN 'trimming' THEN 'trimming'
    WHEN 'treatment' THEN 'treatment'
    ELSE log_type
  END AS log_type,
  date, notes, cost, farrier_name,
  created_at, updated_at
FROM farrier_logs
ON CONFLICT (id) DO NOTHING;

-- Drop farrier_logs table (data migrated above)
DROP TABLE IF EXISTS farrier_logs CASCADE;

-- ============================================================
-- EVENTS — align with EventRecord Dart model
--
-- EventRecord uses display-oriented fields:
--   horse_name, date_label, place_label, award_label, is_upcoming
-- ============================================================
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS horse_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS date_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS place_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS award_label TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_upcoming BOOLEAN DEFAULT false;

-- Update event_type CHECK to be more flexible (free text for now)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;
-- No new constraint — event types are user-defined labels

-- ============================================================
-- MARKET LISTINGS — add missing fields
-- ============================================================
ALTER TABLE market_listings
  ADD COLUMN IF NOT EXISTS document_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_seller_verified BOOLEAN DEFAULT false;

-- Update sale_type CHECK to include 'stud'
ALTER TABLE market_listings DROP CONSTRAINT IF EXISTS market_listings_sale_type_check;
ALTER TABLE market_listings ADD CONSTRAINT market_listings_sale_type_check
  CHECK (sale_type IN ('sale', 'lease', 'trade', 'stud'));

-- ============================================================
-- CO-OWNERSHIPS — align with CoOwnershipRecord Dart model
--
-- Old schema: owner_id + share_pct
-- New schema: co_owner_name + phone + role + permissions
-- (Co-ownership is person-based, not percentage-based)
-- ============================================================

-- Rename old owner_id to co_owner_id for clarity
ALTER TABLE co_ownerships
  DROP CONSTRAINT IF EXISTS co_ownerships_horse_id_owner_id_key;

ALTER TABLE co_ownerships
  DROP COLUMN IF EXISTS share_pct,
  ADD COLUMN IF NOT EXISTS co_owner_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Re-add unique constraint on (horse_id, co_owner_id) if owner_id column was renamed
-- Actually, let's just drop the old constraint and add a simpler one
ALTER TABLE co_ownerships
  ADD CONSTRAINT co_ownerships_horse_name_key UNIQUE (horse_id, co_owner_name);

-- ============================================================
-- BREEDING RECORDS — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS breeding_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sire_id                 UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  sire_name               TEXT NOT NULL DEFAULT '',
  dam_id                  UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  dam_name                TEXT NOT NULL DEFAULT '',
  breeding_date           DATE NOT NULL,
  expected_foaling_date   DATE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'foaled', 'aborted')),
  herd_label              TEXT DEFAULT '',
  notes                   TEXT DEFAULT '',
  foal_id                 UUID REFERENCES horses(id) ON DELETE SET NULL,
  owner_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_breeding_sire ON breeding_records(sire_id);
CREATE INDEX idx_breeding_dam ON breeding_records(dam_id);
CREATE INDEX idx_breeding_owner ON breeding_records(owner_id);
CREATE INDEX idx_breeding_status ON breeding_records(status)
  WHERE status = 'active';

CREATE TRIGGER trg_breeding_records_updated_at
  BEFORE UPDATE ON breeding_records
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- DIGITAL CERTIFICATES — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS digital_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active       BOOLEAN DEFAULT true,
  verification    TEXT NOT NULL,  -- hash for public verification
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_horse ON digital_certificates(horse_id);
CREATE INDEX idx_certificates_owner ON digital_certificates(owner_user_id);
CREATE INDEX idx_certificates_active ON digital_certificates(horse_id)
  WHERE is_active = true;

-- ============================================================
-- PRICE HISTORY — new table (market feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
  price_amount    INTEGER NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'MNT',
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_listing ON price_history(listing_id);
CREATE INDEX idx_price_history_date ON price_history(recorded_at);

-- ============================================================
-- RLS — enable on new tables
-- ============================================================
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — new tables
-- ============================================================

-- Breeding records: owner can manage
CREATE POLICY "Breeding select for owner"
  ON breeding_records FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Breeding insert by owner"
  ON breeding_records FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Breeding update by owner"
  ON breeding_records FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Breeding delete by owner"
  ON breeding_records FOR DELETE
  USING (owner_id = auth.uid());

-- Digital certificates: owner can manage, anyone can verify
CREATE POLICY "Certificates publicly verifiable"
  ON digital_certificates FOR SELECT
  USING (true);

CREATE POLICY "Certificates insert by owner"
  ON digital_certificates FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Price history: tied to listing visibility
CREATE POLICY "Price history readable with listing"
  ON price_history FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM market_listings
      WHERE status = 'published' OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Price history insert by listing owner"
  ON price_history FOR INSERT
  WITH CHECK (
    listing_id IN (
      SELECT id FROM market_listings WHERE seller_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — update existing tables for new fields
-- ============================================================

-- Co-ownerships: update policies for new schema
DROP POLICY IF EXISTS "Co-ownership select for owner" ON co_ownerships;
CREATE POLICY "Co-ownership select for owner or co-owner"
  ON co_ownerships FOR SELECT
  USING (
    horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
    OR co_owner_name IN (
      SELECT display_name FROM profiles WHERE id = auth.uid()
    )
  );

-- Events: update to include owner-based policies
DROP POLICY IF EXISTS "Events select for horse owner" ON events;
CREATE POLICY "Events select for owner"
  ON events FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Events insert by owner"
  ON events FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Events update by owner"
  ON events FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Events delete by owner"
  ON events FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- UPDATED_AT TRIGGER — add to health_logs for farrier fields
-- ============================================================
-- Already exists from 001, but ensure cost/farrier_name updates trigger it
-- (The existing trigger fires on any UPDATE, so this is covered)
