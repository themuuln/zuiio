-- ── НДШ and E-Invoice Settings ─────────────────────────────
-- Adds НДШ (Social Insurance) and E-Invoice (Э-Баримт) settings
-- ────────────────────────────────────────────────────────────

-- Add НДШ settings to organization_settings (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'ndsh_enabled'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN ndsh_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'ndsh_employer_rate'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN ndsh_employer_rate DECIMAL(5,2) DEFAULT 11.50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'ndsh_employee_rate'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN ndsh_employee_rate DECIMAL(5,2) DEFAULT 10.00;
  END IF;
END $$;

-- Add E-Invoice settings to organization_settings (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'einvoice_enabled'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN einvoice_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'einvoice_api_key'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN einvoice_api_key TEXT DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'einvoice_merchant_id'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN einvoice_merchant_id VARCHAR(100) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'einvoice_endpoint'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN einvoice_endpoint TEXT DEFAULT 'https://ebarimt.mn/api';
  END IF;
END $$;

-- Add E-Invoice fields to invoices (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'einvoice_registration_id'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN einvoice_registration_id VARCHAR(100) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'einvoice_qr_code'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN einvoice_qr_code TEXT DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'einvoice_status'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN einvoice_status VARCHAR(20) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'einvoice_registered_at'
  ) THEN
    ALTER TABLE invoices
      ADD COLUMN einvoice_registered_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN organization_settings.ndsh_enabled IS 'Whether НДШ (Social Insurance) tracking is enabled. Default: false';
COMMENT ON COLUMN organization_settings.ndsh_employer_rate IS 'НДШ employer contribution rate (%). Default: 11.5';
COMMENT ON COLUMN organization_settings.ndsh_employee_rate IS 'НДШ employee contribution rate (%). Default: 10';
COMMENT ON COLUMN organization_settings.einvoice_enabled IS 'Whether E-Invoice (Э-Баримт) integration is enabled. Default: false';
COMMENT ON COLUMN organization_settings.einvoice_api_key IS 'E-Invoice API key from the General Taxation Authority';
COMMENT ON COLUMN organization_settings.einvoice_merchant_id IS 'E-Invoice merchant ID';
COMMENT ON COLUMN organization_settings.einvoice_endpoint IS 'E-Invoice API endpoint URL';
COMMENT ON COLUMN invoices.einvoice_registration_id IS 'E-Invoice registration ID from Э-Баримт';
COMMENT ON COLUMN invoices.einvoice_qr_code IS 'QR code data for E-Invoice verification';
COMMENT ON COLUMN invoices.einvoice_status IS 'E-Invoice status: pending, registered, failed';
COMMENT ON COLUMN invoices.einvoice_registered_at IS 'When E-Invoice was registered';

-- Add index for E-Invoice queries
CREATE INDEX IF NOT EXISTS idx_invoices_einvoice ON invoices (einvoice_status)
  WHERE einvoice_status IS NOT NULL;
