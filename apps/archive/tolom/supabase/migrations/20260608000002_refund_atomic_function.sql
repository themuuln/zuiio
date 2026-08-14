-- Atomic refund function to prevent race conditions
-- This function inserts a refund and updates the invoice atomically
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
AS $$
DECLARE
  v_invoice RECORD;
  v_refund_id UUID;
  v_new_amount_refunded NUMERIC;
  v_new_status TEXT;
  v_refund RECORD;
BEGIN
  -- Lock the invoice row to prevent concurrent modifications
  SELECT id, total, status, amount_paid, amount_refunded
  INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  -- Check invoice exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- Validate invoice is in a refundable state
  IF v_invoice.status NOT IN ('paid', 'partial', 'refunded') THEN
    RAISE EXCEPTION 'Cannot refund invoice with status "%". Invoice must be paid, partially paid, or already refunded.', v_invoice.status;
  END IF;

  -- Validate refund amount doesn't exceed paid amount
  v_new_amount_refunded := v_invoice.amount_refunded + p_amount;
  IF v_new_amount_refunded > v_invoice.amount_paid THEN
    RAISE EXCEPTION 'Cannot refund more than the paid amount. Maximum refundable: %', v_invoice.amount_paid - v_invoice.amount_refunded;
  END IF;

  -- Determine new status
  IF v_new_amount_refunded >= v_invoice.total THEN
    v_new_status := 'refunded';
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- Insert refund record
  INSERT INTO public.invoice_refunds (
    invoice_id,
    organization_id,
    amount,
    method,
    status,
    reason,
    reference,
    notes,
    created_by
  ) VALUES (
    p_invoice_id,
    p_organization_id,
    p_amount,
    p_method,
    'completed',
    p_reason,
    p_reference,
    p_notes,
    p_created_by
  )
  RETURNING id INTO v_refund_id;

  -- Update invoice totals
  UPDATE public.invoices
  SET
    amount_refunded = v_new_amount_refunded,
    status = v_new_status,
    updated_by = p_created_by,
    updated_at = NOW()
  WHERE id = p_invoice_id;

  -- Return the refund with invoice data
  SELECT
    ir.*,
    i.invoice_number,
    i.total as invoice_total,
    i.customer_name
  INTO v_refund
  FROM public.invoice_refunds ir
  JOIN public.invoices i ON i.id = ir.invoice_id
  WHERE ir.id = v_refund_id;

  RETURN jsonb_build_object(
    'id', v_refund.id,
    'invoice_id', v_refund.invoice_id,
    'organization_id', v_refund.organization_id,
    'amount', v_refund.amount,
    'method', v_refund.method,
    'status', v_refund.status,
    'reason', v_refund.reason,
    'reference', v_refund.reference,
    'notes', v_refund.notes,
    'refunded_at', v_refund.refunded_at,
    'created_at', v_refund.created_at,
    'updated_at', v_refund.updated_at,
    'created_by', v_refund.created_by,
    'invoice_number', v_refund.invoice_number,
    'invoice_total', v_refund.invoice_total,
    'customer_name', v_refund.customer_name
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.record_refund_atomically TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.record_refund_atomically IS 'Atomically record a refund and update invoice totals. Uses row-level locking to prevent concurrent refund race conditions.';
