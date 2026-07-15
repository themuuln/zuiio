-- ============================================================
-- Migration: Add public receipt and document snapshots
-- 1. Add snapshot columns to invoices (immutable document data)
-- 2. Add receipt-specific columns and token fields
-- 3. Add indexes for receipt token lookups
-- 4. Recreate get_public_receipt RPC to use snapshot data + receipt tokens
-- 5. Revoke/grant function execution
-- ============================================================

-- ============================================================
-- 1. Add snapshot columns (immutable document data)
-- ============================================================

-- Snapshots ensure historical documents don't change when profiles are edited
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS seller_snapshot JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS buyer_snapshot JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS branch_snapshot JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS lines_snapshot JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS totals_snapshot JSONB;

-- ============================================================
-- 2. Add receipt-specific columns
-- ============================================================

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_receipt BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_token_hash TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_expires_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_revoked_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_splits JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ebarimt_id TEXT;

-- ============================================================
-- 3. Add indexes for receipt token lookups
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_receipt_token_hash
  ON public.invoices(receipt_token_hash) WHERE receipt_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_receipt_token_hash_unique
  ON public.invoices(receipt_token_hash) WHERE receipt_token_hash IS NOT NULL;

-- ============================================================
-- 4. Recreate get_public_receipt RPC to use snapshot data + receipt tokens
-- ============================================================

-- Drop the old version first (needed because signature is the same)
DROP FUNCTION IF EXISTS public.get_public_receipt(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_receipt(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_receipt JSON;
BEGIN
  -- Reject malformed tokens (must be 64 hex chars = 32 bytes)
  IF p_token IS NULL OR length(p_token) != 64 OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;

  v_token_hash := encode(sha256(p_token::bytea), 'hex');

  SELECT json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'receipt_number', i.receipt_number,
    'issue_date', i.issue_date,
    'status', i.status,
    'total_amount', i.total_amount,
    'paid_amount', i.paid_amount,
    'notes', i.notes,
    'cashier_name', i.cashier_name,
    'ebarimt_id', i.ebarimt_id,
    'seller', i.seller_snapshot,
    'buyer', i.buyer_snapshot,
    'branch', i.branch_snapshot,
    'lines', i.lines_snapshot,
    'totals', i.totals_snapshot,
    'payment_splits', i.payment_splits,
    'organization_name', o.name
  ) INTO v_receipt
  FROM public.invoices i
  LEFT JOIN public.organizations o ON o.id = i.organization_id
  WHERE (i.receipt_token_hash = v_token_hash OR i.token_hash = v_token_hash)
    AND (i.receipt_expires_at IS NULL OR i.receipt_expires_at > now())
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND i.revoked_at IS NULL
    AND i.receipt_revoked_at IS NULL;

  RETURN v_receipt;
END;
$$;

-- ============================================================
-- 5. Revoke and grant function execution
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_public_receipt(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_receipt(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_receipt(TEXT) TO authenticated;
