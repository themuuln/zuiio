-- ── Tax-Exempt Items ─────────────────────────────────────────
-- Adds per-item tax override and exemption support
-- ────────────────────────────────────────────────────────────

-- Add tax fields to invoice_items (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items'
    AND column_name = 'is_tax_exempt'
  ) THEN
    ALTER TABLE invoice_items
      ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items'
    AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE invoice_items
      ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT NULL;
  END IF;
END $$;

-- Add tax fields to estimate_items (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimate_items'
    AND column_name = 'is_tax_exempt'
  ) THEN
    ALTER TABLE estimate_items
      ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimate_items'
    AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE estimate_items
      ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT NULL;
  END IF;
END $$;

-- Add tax_id to organizations if not exists (for tax registration number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations'
    AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE organizations
      ADD COLUMN tax_id VARCHAR(50) DEFAULT NULL;
  END IF;
END $$;

-- Add indexes for tax queries
CREATE INDEX IF NOT EXISTS idx_invoice_items_tax ON invoice_items (is_tax_exempt, tax_rate)
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_estimate_items_tax ON estimate_items (is_tax_exempt, tax_rate)
  WHERE estimate_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN invoice_items.is_tax_exempt IS 'Whether this item is exempt from НӨАТ (VAT)';
COMMENT ON COLUMN invoice_items.tax_rate IS 'Custom tax rate for this item (null = use org default)';
COMMENT ON COLUMN estimate_items.is_tax_exempt IS 'Whether this item is exempt from НӨАТ (VAT)';
COMMENT ON COLUMN estimate_items.tax_rate IS 'Custom tax rate for this item (null = use org default)';
COMMENT ON COLUMN organizations.tax_id IS 'Tax registration number (Регистрийн дугаар)';
