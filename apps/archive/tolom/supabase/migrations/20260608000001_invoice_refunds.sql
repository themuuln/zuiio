-- Invoice refunds — append-only ledger records for payment reversals
-- Created: 2026-06-08

-- 1. Add "refunded" status to invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'refunded';

-- 2. Create refund_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
    CREATE TYPE refund_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
  END IF;
END $$;

-- 3. Create invoice_refunds table
CREATE TABLE IF NOT EXISTS invoice_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash'
    CHECK (method IN ('cash', 'card', 'bank_transfer', 'store_credit')),
  status refund_status NOT NULL DEFAULT 'completed',
  reason text,
  reference text,
  notes text,
  refunded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE invoice_refunds ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies (mirror invoice_payments pattern exactly)
CREATE POLICY "Users can view refunds in their org"
  ON invoice_refunds FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert refunds in their org"
  ON invoice_refunds FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update refunds in their org"
  ON invoice_refunds FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete refunds in their org"
  ON invoice_refunds FOR DELETE
  USING (organization_id = get_user_organization_id());

-- 6. Indexes
CREATE INDEX idx_invoice_refunds_org ON invoice_refunds(organization_id);
CREATE INDEX idx_invoice_refunds_invoice ON invoice_refunds(invoice_id);
CREATE INDEX idx_invoice_refunds_status ON invoice_refunds(organization_id, status);
CREATE INDEX idx_invoice_refunds_refunded_at ON invoice_refunds(organization_id, refunded_at DESC);

-- 7. Add amount_refunded column to invoices for fast lookups
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_refunded numeric(12,2) NOT NULL DEFAULT 0;
