-- ── CRM Improvements ──────────────────────────────────────────────
-- 1. Adds `source` column to customers for referral tracking
-- 2. Creates `customer_notes` table for staff notes/timeline
-- 3. RLS policies for customer_notes
-- 4. Indexes for performance

-- ── 1. Customer source ─────────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS source text DEFAULT NULL;

COMMENT ON COLUMN customers.source IS 'Referral source (referral, website, walk-in, social_media, phone, other)';

-- ── 2. Customer notes table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content         text NOT NULL,
  type            text NOT NULL DEFAULT 'general'
                    CHECK (type IN ('general', 'follow_up', 'complaint', 'call', 'email', 'meeting', 'other')),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer notes in their org"
  ON customer_notes
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create customer notes in their org"
  ON customer_notes
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update customer notes in their org"
  ON customer_notes
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete customer notes in their org"
  ON customer_notes
  FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer
  ON customer_notes (customer_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_notes_org
  ON customer_notes (organization_id)
  WHERE deleted_at IS NULL;

-- Auto-update updated_at trigger (function exists from phase 0)
CREATE TRIGGER set_customer_notes_updated_at
  BEFORE UPDATE ON customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── 3. Index for customer source queries ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_source
  ON customers (source)
  WHERE deleted_at IS NULL AND source IS NOT NULL;
