-- ── НӨАТ (VAT) Tax Settings ──────────────────────────────────
-- Adds nuat_enabled toggle to organization_settings and work_orders
-- ────────────────────────────────────────────────────────────

-- Add nuat_enabled to organization_settings (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'nuat_enabled'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN nuat_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add default_tax_rate to organization_settings (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_settings'
    AND column_name = 'default_tax_rate'
  ) THEN
    ALTER TABLE organization_settings
      ADD COLUMN default_tax_rate DECIMAL(5,2) DEFAULT 10.00;
  END IF;
END $$;

-- Add nuat_enabled to work_orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders'
    AND column_name = 'nuat_enabled'
  ) THEN
    ALTER TABLE work_orders
      ADD COLUMN nuat_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add labor_hours and labor_cost to work_orders for НДШ tracking (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders'
    AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE work_orders
      ADD COLUMN labor_hours DECIMAL(5,2) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_orders'
    AND column_name = 'labor_cost'
  ) THEN
    ALTER TABLE work_orders
      ADD COLUMN labor_cost DECIMAL(12,2) DEFAULT NULL;
  END IF;
END $$;

-- Add indexes for queries
CREATE INDEX IF NOT EXISTS idx_work_orders_nuat ON work_orders (nuat_enabled)
  WHERE deleted_at IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN organization_settings.nuat_enabled IS 'Whether НӨАТ (VAT) is enabled for this organization. Default: false';
COMMENT ON COLUMN organization_settings.default_tax_rate IS 'Default НӨАТ (VAT) rate percentage. Default: 10';
COMMENT ON COLUMN work_orders.nuat_enabled IS 'Whether НӨАТ is enabled for this specific work order. Inherits from org setting.';
COMMENT ON COLUMN work_orders.labor_hours IS 'Total mechanic hours for НДШ (social insurance) tracking';
COMMENT ON COLUMN work_orders.labor_cost IS 'Gross labor cost before НДШ for profitability tracking';
