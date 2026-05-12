-- ============================================================
-- Phase 1 — Invoice Generation & Sharing
-- ============================================================

-- Invoice statuses
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled'
);

-- Invoices table
CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  branch_id     uuid REFERENCES branches(id),
  work_order_id uuid REFERENCES work_orders(id),
  customer_id   uuid REFERENCES customers(id),
  vehicle_id    uuid REFERENCES vehicles(id),

  -- Invoice identity
  invoice_number  text NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',

  -- Financial
  subtotal        numeric(12,2) NOT NULL DEFAULT 0,
  discount_total  numeric(12,2) NOT NULL DEFAULT 0,
  tax_total       numeric(12,2) NOT NULL DEFAULT 0,
  total           numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid     numeric(12,2) NOT NULL DEFAULT 0,
  balance_due     numeric(12,2) NOT NULL DEFAULT 0,

  -- Dates
  issued_at       timestamptz NOT NULL DEFAULT now(),
  due_at          timestamptz,
  paid_at         timestamptz,

  -- Customer info snapshot (in case customer changes later)
  customer_name         text,
  customer_phone        text,
  customer_email        text,
  customer_address      text,

  -- Vehicle info snapshot
  vehicle_plate         text,
  vehicle_details       text,

  -- Public sharing
  public_token    text UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  email_sent_at   timestamptz,

  -- Notes
  notes           text,
  terms           text DEFAULT 'Payment due upon receipt.',
  footer          text,

  -- Audit
  created_by      uuid REFERENCES auth.users(id),
  updated_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,

  CONSTRAINT unique_invoice_number_per_org UNIQUE (organization_id, invoice_number)
);

-- Invoice line items (services/parts snapshot)
CREATE TABLE invoice_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type     text NOT NULL CHECK (item_type IN ('service', 'part')),
  description   text NOT NULL,
  quantity      numeric(10,2) NOT NULL DEFAULT 1,
  unit_price    numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_price   numeric(12,2) NOT NULL DEFAULT 0,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Payment tracking
CREATE TABLE invoice_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount        numeric(12,2) NOT NULL,
  method        text NOT NULL DEFAULT 'cash',
  reference     text,
  notes         text,
  paid_at       timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_organization ON invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_work_order ON invoices(work_order_id);
CREATE INDEX idx_invoices_public_token ON invoices(public_token) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS: users can view invoices in their org
CREATE POLICY invoices_org_access ON invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_org_access ON invoice_items
  FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY invoice_payments_org_access ON invoice_payments
  FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );
