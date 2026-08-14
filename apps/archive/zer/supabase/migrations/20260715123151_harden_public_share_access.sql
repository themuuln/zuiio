-- ============================================================
-- Migration: Harden public share access
-- 1. Add token hash/lifecycle columns to invoices + shared_reports
-- 2. Backfill hashes from existing raw tokens
-- 3. Add indexes for hash lookups and expiry checks
-- 4. Make token_hash NOT NULL + UNIQUE
-- 5. Drop vulnerable RLS policies (token IS NOT NULL)
-- 6. Recreate org-only RLS policies
-- 7. Create safe RPC functions (SECURITY DEFINER)
-- 8. Revoke/grant function execution
-- ============================================================

-- ============================================================
-- 1. Add token hash/lifecycle columns
-- ============================================================

-- Invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;

-- Shared Reports
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;

-- ============================================================
-- 2. Backfill hashes from existing raw tokens
-- ============================================================

UPDATE public.invoices
SET token_hash = encode(sha256(token::bytea), 'hex')
WHERE token IS NOT NULL AND token_hash IS NULL;

UPDATE public.shared_reports
SET token_hash = encode(sha256(token::bytea), 'hex')
WHERE token IS NOT NULL AND token_hash IS NULL;

-- ============================================================
-- 3. Add indexes for token hash lookups and expiry checks
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_token_hash
  ON public.invoices(token_hash) WHERE token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shared_reports_token_hash
  ON public.shared_reports(token_hash) WHERE token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_expires_at
  ON public.invoices(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shared_reports_expires_at
  ON public.shared_reports(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 4. Add partial unique indexes on token_hash (nullable column)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_token_hash_unique
  ON public.invoices(token_hash) WHERE token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_reports_token_hash_unique
  ON public.shared_reports(token_hash) WHERE token_hash IS NOT NULL;

-- ============================================================
-- 5. Drop vulnerable RLS policies
-- ============================================================

-- Invoices: drop policies that allow "OR token IS NOT NULL"
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_own_org" ON public.invoices;

-- Invoice items: drop policies that allow "OR token IS NOT NULL"
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_select_own_org" ON public.invoice_items;

-- Shared reports: drop the wide-open anon policy
DROP POLICY IF EXISTS "anon_select_shared_reports" ON public.shared_reports;

-- ============================================================
-- 6. Recreate org-only RLS policies (NO token-based anon access)
-- ============================================================

-- Invoices SELECT: org membership + permission + branch access
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.read')
    AND public.user_has_branch_access(branch_id)
  );

-- Invoice items SELECT: via parent invoice ownership
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(invoices.branch_id)
    )
    AND public.has_permission('invoices.read')
  );

-- Shared reports SELECT: org membership + permission
-- (anon access is now handled via RPC only)
-- No SELECT policy needed for anon — RPC is SECURITY DEFINER

-- ============================================================
-- 7. Create safe RPC functions (SECURITY DEFINER)
-- ============================================================

-- get_public_invoice: validates token hash, checks expiry/revocation
CREATE OR REPLACE FUNCTION public.get_public_invoice(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_invoice JSON;
BEGIN
  -- Reject malformed tokens (must be 64 hex chars = 32 bytes)
  IF p_token IS NULL OR length(p_token) != 64 OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;

  v_token_hash := encode(sha256(p_token::bytea), 'hex');

  SELECT json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'issue_date', i.issue_date,
    'status', i.status,
    'total_amount', i.total_amount,
    'paid_amount', i.paid_amount,
    'notes', i.notes,
    'organization_name', o.name,
    'contact_name', c.name,
    'contact_phone', c.phone,
    'items', (
      SELECT json_agg(json_build_object(
        'description', ii.description,
        'quantity', ii.quantity,
        'unit_price', ii.unit_price,
        'total_price', ii.total_price,
        'product_name', p.name,
        'product_unit', p.unit
      ))
      FROM public.invoice_items ii
      LEFT JOIN public.products p ON p.id = ii.product_id
      WHERE ii.invoice_id = i.id
    )
  ) INTO v_invoice
  FROM public.invoices i
  LEFT JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.contacts c ON c.id = i.contact_id
  WHERE i.token_hash = v_token_hash
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND i.revoked_at IS NULL;

  RETURN v_invoice;
END;
$$;

-- get_public_report_data: validates token hash, checks expiry/revocation
CREATE OR REPLACE FUNCTION public.get_public_report_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_report JSON;
BEGIN
  IF p_token IS NULL OR length(p_token) != 64 OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;

  v_token_hash := encode(sha256(p_token::bytea), 'hex');

  SELECT json_build_object(
    'id', sr.id,
    'organization_id', sr.organization_id,
    'date_from', sr.date_from,
    'date_to', sr.date_to,
    'created_at', sr.created_at
  ) INTO v_report
  FROM public.shared_reports sr
  WHERE sr.token_hash = v_token_hash
    AND (sr.expires_at IS NULL OR sr.expires_at > now())
    AND sr.revoked_at IS NULL;

  RETURN v_report;
END;
$$;

-- get_public_receipt: validates receipt token
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
  IF p_token IS NULL OR length(p_token) != 64 OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;

  v_token_hash := encode(sha256(p_token::bytea), 'hex');

  SELECT json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'issue_date', i.issue_date,
    'status', i.status,
    'total_amount', i.total_amount,
    'paid_amount', i.paid_amount,
    'notes', i.notes,
    'organization_name', o.name,
    'contact_name', c.name,
    'items', (
      SELECT json_agg(json_build_object(
        'description', ii.description,
        'quantity', ii.quantity,
        'unit_price', ii.unit_price,
        'total_price', ii.total_price,
        'product_name', p.name
      ))
      FROM public.invoice_items ii
      LEFT JOIN public.products p ON p.id = ii.product_id
      WHERE ii.invoice_id = i.id
    )
  ) INTO v_receipt
  FROM public.invoices i
  LEFT JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.contacts c ON c.id = i.contact_id
  WHERE i.token_hash = v_token_hash
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND i.revoked_at IS NULL;

  RETURN v_receipt;
END;
$$;

-- ============================================================
-- 8. Revoke and grant function execution
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_public_invoice(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_invoice(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_invoice(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_report_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_report_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_report_data(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_receipt(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_receipt(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_receipt(TEXT) TO authenticated;
