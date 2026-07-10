-- Store credit balances table
CREATE TABLE public.store_credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, organization_id)
);

-- Add RLS policies
ALTER TABLE public.store_credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view store credit balances in their organization"
  ON public.store_credit_balances FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert store credit balances in their organization"
  ON public.store_credit_balances FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update store credit balances in their organization"
  ON public.store_credit_balances FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete store credit balances in their organization"
  ON public.store_credit_balances FOR DELETE
  USING (organization_id = public.get_user_organization_id());

-- Add indexes
CREATE INDEX idx_store_credit_balances_customer ON public.store_credit_balances(customer_id);
CREATE INDEX idx_store_credit_balances_org ON public.store_credit_balances(organization_id);

-- Store credit transactions ledger (append-only)
CREATE TABLE public.store_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL, -- positive = credit added, negative = credit used
  type TEXT NOT NULL, -- 'refund', 'redemption', 'adjustment', 'expiration'
  reference_id UUID, -- can reference invoice_refunds.id or other tables
  reference_type TEXT, -- 'invoice_refund', 'manual_adjustment', etc.
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for transactions
ALTER TABLE public.store_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view store credit transactions in their organization"
  ON public.store_credit_transactions FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can insert store credit transactions in their organization"
  ON public.store_credit_transactions FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

-- Add indexes for transactions
CREATE INDEX idx_store_credit_transactions_customer ON public.store_credit_transactions(customer_id);
CREATE INDEX idx_store_credit_transactions_org ON public.store_credit_transactions(organization_id);
CREATE INDEX idx_store_credit_transactions_reference ON public.store_credit_transactions(reference_id);

-- Update the atomic refund function to handle store credit
CREATE OR REPLACE FUNCTION public.record_refund_atomically(
  p_invoice_id UUID,
  p_organization_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'cash',
  p_reason TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_invoice RECORD;
  v_refund_id UUID;
  v_new_amount_refunded NUMERIC;
  v_new_status TEXT;
  v_refund RECORD;
  v_customer_id UUID;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the invoice row to prevent concurrent modifications
  SELECT id, total, status, amount_paid, amount_refunded, customer_id
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status NOT IN ('paid', 'partial', 'refunded') THEN
    RAISE EXCEPTION 'Cannot refund invoice with status %', v_invoice.status;
  END IF;

  v_new_amount_refunded := v_invoice.amount_refunded + p_amount;
  IF v_new_amount_refunded > v_invoice.amount_paid THEN
    RAISE EXCEPTION 'Cannot refund more than paid amount. Max refundable: %', (v_invoice.amount_paid - v_invoice.amount_refunded);
  END IF;

  IF v_new_amount_refunded >= v_invoice.total THEN
    v_new_status := 'refunded';
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- Insert refund record
  INSERT INTO public.invoice_refunds (
    invoice_id, organization_id, amount, method, status, reason, reference, notes, created_by
  ) VALUES (
    p_invoice_id, p_organization_id, p_amount, p_method, 'completed', p_reason, p_reference, p_notes, p_created_by
  ) RETURNING id INTO v_refund_id;

  -- Update invoice totals
  UPDATE public.invoices
  SET amount_refunded = v_new_amount_refunded, status = v_new_status, updated_by = p_created_by, updated_at = NOW()
  WHERE id = p_invoice_id;

  -- Handle store credit: add to customer's balance
  IF p_method = 'store_credit' AND v_invoice.customer_id IS NOT NULL THEN
    v_customer_id := v_invoice.customer_id;

    -- Upsert balance (insert or update)
    INSERT INTO public.store_credit_balances (customer_id, organization_id, balance, updated_at)
    VALUES (v_customer_id, p_organization_id, p_amount, NOW())
    ON CONFLICT (customer_id, organization_id) DO UPDATE
    SET balance = public.store_credit_balances.balance + p_amount,
        updated_at = NOW()
    RETURNING balance INTO v_new_balance;

    -- Record transaction
    INSERT INTO public.store_credit_transactions (
      customer_id, organization_id, amount, type, reference_id, reference_type, notes, created_by
    ) VALUES (
      v_customer_id, p_organization_id, p_amount, 'refund', v_refund_id, 'invoice_refund', p_notes, p_created_by
    );
  END IF;

  -- Return the refund with invoice data
  SELECT ir.*, i.invoice_number, i.total as invoice_total, i.customer_name
  INTO v_refund
  FROM public.invoice_refunds ir
  JOIN public.invoices i ON i.id = ir.invoice_id
  WHERE ir.id = v_refund_id;

  RETURN jsonb_build_object(
    'id', v_refund.id, 'invoice_id', v_refund.invoice_id, 'organization_id', v_refund.organization_id,
    'amount', v_refund.amount, 'method', v_refund.method, 'status', v_refund.status,
    'reason', v_refund.reason, 'reference', v_refund.reference, 'notes', v_refund.notes,
    'refunded_at', v_refund.refunded_at, 'created_at', v_refund.created_at, 'updated_at', v_refund.updated_at,
    'created_by', v_refund.created_by, 'invoice_number', v_refund.invoice_number,
    'invoice_total', v_refund.invoice_total, 'customer_name', v_refund.customer_name
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.record_refund_atomically TO authenticated;
COMMENT ON FUNCTION public.record_refund_atomically IS 'Atomically record a refund and update invoice totals. Handles store credit balances automatically.';
