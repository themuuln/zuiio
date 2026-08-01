-- ============================================================
-- Digital Ownership Certificates
-- Version: 6 (2026-06-05)
--
-- Adds digital ownership certificate system for horse
-- ownership verification, transfer tracking, and QR codes.
-- ============================================================

-- ── 0. Reconcile the legacy 002 schema ──────────────────────
-- 002 created digital_certificates with owner_user_id/issued_at/is_active/
-- verification; the app and this migration use owner_id/issue_date/status/
-- qr_code. Drop the legacy-shaped table (app code never wrote it) so the
-- production DDL below applies on fresh databases.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'digital_certificates'
      AND column_name = 'owner_user_id'
  ) THEN
    DROP TABLE public.digital_certificates CASCADE;
  END IF;
END
$$;

-- ── 1. Create digital_certificates table ─────────────────────
CREATE TABLE IF NOT EXISTS digital_certificates (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id          UUID NOT NULL,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name        TEXT NOT NULL,
  horse_name        TEXT,
  issue_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date       TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'transferred', 'revoked')),
  qr_code           TEXT NOT NULL UNIQUE,
  previous_owner_id UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_digital_certificates_horse
  ON digital_certificates(horse_id);

CREATE INDEX IF NOT EXISTS idx_digital_certificates_owner
  ON digital_certificates(owner_id);

CREATE INDEX IF NOT EXISTS idx_digital_certificates_status
  ON digital_certificates(status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_digital_certificates_qr
  ON digital_certificates(qr_code);

CREATE INDEX IF NOT EXISTS idx_digital_certificates_previous_owner
  ON digital_certificates(previous_owner_id)
  WHERE previous_owner_id IS NOT NULL;

-- ── 3. RLS policies ────────────────────────────────────────
ALTER TABLE digital_certificates ENABLE ROW LEVEL SECURITY;

-- Users can read certificates for their horses
CREATE POLICY "Certificates: users read own horse certs"
  ON digital_certificates FOR SELECT
  USING (
    owner_id = auth.uid()
    OR horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert certificates for their horses
CREATE POLICY "Certificates: users insert own"
  ON digital_certificates FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Users can update status (transfer/revoke) their own certificates
CREATE POLICY "Certificates: users update own"
  ON digital_certificates FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Anyone can verify a certificate by QR code (public read for verification)
CREATE POLICY "Certificates: public verify"
  ON digital_certificates FOR SELECT
  USING (true);

-- ── 4. Transfer history table ───────────────────────────────
CREATE TABLE IF NOT EXISTS certificate_transfers (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id    UUID NOT NULL REFERENCES digital_certificates(id) ON DELETE CASCADE,
  from_owner_id     UUID NOT NULL,
  from_owner_name   TEXT NOT NULL,
  to_owner_id       UUID NOT NULL,
  to_owner_name     TEXT NOT NULL,
  transferred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes             TEXT
);

-- Indexes for transfer history
CREATE INDEX IF NOT EXISTS idx_certificate_transfers_cert
  ON certificate_transfers(certificate_id);

CREATE INDEX IF NOT EXISTS idx_certificate_transfers_from
  ON certificate_transfers(from_owner_id);

CREATE INDEX IF NOT EXISTS idx_certificate_transfers_to
  ON certificate_transfers(to_owner_id);

-- ── 5. RLS for transfer history ─────────────────────────────
ALTER TABLE certificate_transfers ENABLE ROW LEVEL SECURITY;

-- Users can read transfers involving them
CREATE POLICY "Transfers: users read own"
  ON certificate_transfers FOR SELECT
  USING (
    from_owner_id = auth.uid()
    OR to_owner_id = auth.uid()
  );

-- Users can insert transfers from their certificates
CREATE POLICY "Transfers: users insert own"
  ON certificate_transfers FOR INSERT
  WITH CHECK (from_owner_id = auth.uid());

-- ── 6. Auto-update updated_at trigger ──────────────────────
CREATE OR REPLACE FUNCTION update_certificate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_certificate_updated_at
  BEFORE UPDATE ON digital_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_updated_at();

-- ── 7. Transfer tracking trigger ───────────────────────────
-- Automatically log transfer when certificate status changes to 'transferred'
CREATE OR REPLACE FUNCTION log_certificate_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'transferred' AND OLD.status = 'active' THEN
    INSERT INTO certificate_transfers (
      certificate_id,
      from_owner_id,
      from_owner_name,
      to_owner_id,
      to_owner_name,
      transferred_at
    ) VALUES (
      NEW.id,
      OLD.owner_id,
      OLD.owner_name,
      NEW.owner_id,
      NEW.owner_name,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_certificate_transfer
  AFTER UPDATE ON digital_certificates
  FOR EACH ROW
  EXECUTE FUNCTION log_certificate_transfer();
