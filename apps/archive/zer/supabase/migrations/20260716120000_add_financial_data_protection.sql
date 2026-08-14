-- =============================================
-- Financial Data Protection
-- =============================================
-- Adds production-grade data protection for all financial tables:
--   1. Soft delete (deleted_at) on every financial table
--   2. Fiscal period locking (fiscal_periods table)
--   3. RPC functions for soft delete, restore, period locking,
--      period validation, and journal balance checking

-- ─── SECTION 1: Soft Delete Columns ─────────────────────────────────
-- MIGRATION: Add deleted_at timestamp to all financial tables for
-- soft-delete support. Rows with deleted_at IS NOT NULL are considered
-- deleted but preserved for audit trails and potential recovery.

-- MIGRATION: Add deleted_at to sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to sale_items
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to invoice_items
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to journal_entries
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to journal_entry_lines
ALTER TABLE public.journal_entry_lines
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to purchase_order_items
ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to quotations
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to quotation_items
ALTER TABLE public.quotation_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to returns
ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add deleted_at to return_items
ALTER TABLE public.return_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- MIGRATION: Add indexes on deleted_at for fast filtered queries
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON public.sales(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_deleted_at ON public.sale_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON public.invoices(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_deleted_at ON public.invoice_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted_at ON public.journal_entries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_deleted_at ON public.journal_entry_lines(deleted_at);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_deleted_at ON public.purchase_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_deleted_at ON public.purchase_order_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_at ON public.quotations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_quotation_items_deleted_at ON public.quotation_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_returns_deleted_at ON public.returns(deleted_at);
CREATE INDEX IF NOT EXISTS idx_return_items_deleted_at ON public.return_items(deleted_at);

-- ─── SECTION 2: Fiscal Period Locking ───────────────────────────────
-- MIGRATION: Create fiscal_periods table for period locking.
-- Once a fiscal period is closed, no transactions should be created
-- or modified within that date range. This enforces accounting integrity.

CREATE TABLE IF NOT EXISTS public.fiscal_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period_name)
);

COMMENT ON TABLE public.fiscal_periods IS 'Accounting periods that can be locked to prevent modifications after close. Each period spans a date range within an organization.';
COMMENT ON COLUMN public.fiscal_periods.period_name IS 'Human-readable period identifier, e.g. "2026-01" for January 2026.';
COMMENT ON COLUMN public.fiscal_periods.is_closed IS 'When TRUE, no transactions should be created or modified within this period date range.';
COMMENT ON COLUMN public.fiscal_periods.closed_at IS 'Timestamp when the period was closed. NULL if still open.';
COMMENT ON COLUMN public.fiscal_periods.closed_by IS 'Profile ID of the user who closed this period.';

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_org ON public.fiscal_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_org_period ON public.fiscal_periods(organization_id, period_name);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_dates ON public.fiscal_periods(organization_id, start_date, end_date);

-- MIGRATION: Enable RLS on fiscal_periods
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_periods_select" ON public.fiscal_periods
  FOR SELECT USING (organization_id = get_current_organization());
CREATE POLICY "fiscal_periods_insert" ON public.fiscal_periods
  FOR INSERT WITH CHECK (organization_id = get_current_organization());
CREATE POLICY "fiscal_periods_update" ON public.fiscal_periods
  FOR UPDATE USING (organization_id = get_current_organization())
  WITH CHECK (organization_id = get_current_organization());
CREATE POLICY "fiscal_periods_delete" ON public.fiscal_periods
  FOR DELETE USING (organization_id = get_current_organization());

-- ─── SECTION 3: RPC Functions ───────────────────────────────────────

-- ─── 3a: soft_delete_record ─────────────────────────────────────────
-- MIGRATION: Soft delete any financial record by setting deleted_at.
-- Validates the table name against an allowlist to prevent SQL injection.
-- Uses SECURITY INVOKER (default) so RLS policies enforce org access.

CREATE OR REPLACE FUNCTION public.soft_delete_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_allowed_tables TEXT[] := ARRAY[
    'sales', 'sale_items',
    'invoices', 'invoice_items',
    'journal_entries', 'journal_entry_lines',
    'expenses',
    'purchase_orders', 'purchase_order_items',
    'quotations', 'quotation_items',
    'returns', 'return_items'
  ];
  v_sql TEXT;
  v_rows_affected INTEGER;
BEGIN
  -- Validate table name against allowlist
  IF p_table_name != ALL(v_allowed_tables) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid table name: ' || p_table_name
    );
  END IF;

  -- Execute soft delete via dynamic SQL
  -- SECURITY INVOKER ensures RLS policies apply
  v_sql := format(
    'UPDATE public.%I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    p_table_name
  );
  EXECUTE v_sql USING p_record_id;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Record not found or already deleted'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Record soft deleted successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.soft_delete_record(TEXT, UUID) IS 'Soft-deletes a financial record by setting deleted_at. Validates table name against allowlist and respects RLS organization boundaries.';

-- ─── 3b: restore_record ─────────────────────────────────────────────
-- MIGRATION: Restore a soft-deleted record by clearing deleted_at.
-- Same security model as soft_delete_record.

CREATE OR REPLACE FUNCTION public.restore_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_allowed_tables TEXT[] := ARRAY[
    'sales', 'sale_items',
    'invoices', 'invoice_items',
    'journal_entries', 'journal_entry_lines',
    'expenses',
    'purchase_orders', 'purchase_order_items',
    'quotations', 'quotation_items',
    'returns', 'return_items'
  ];
  v_sql TEXT;
  v_rows_affected INTEGER;
BEGIN
  -- Validate table name against allowlist
  IF p_table_name != ALL(v_allowed_tables) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid table name: ' || p_table_name
    );
  END IF;

  -- Execute restore via dynamic SQL
  v_sql := format(
    'UPDATE public.%I SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL',
    p_table_name
  );
  EXECUTE v_sql USING p_record_id;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Record not found or not deleted'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Record restored successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.restore_record(TEXT, UUID) IS 'Restores a soft-deleted financial record by clearing deleted_at. Validates table name against allowlist and respects RLS organization boundaries.';

-- ─── 3c: close_fiscal_period ────────────────────────────────────────
-- MIGRATION: Close a fiscal period to lock it from modifications.
-- Sets is_closed = TRUE, records the timestamp and closing user.

CREATE OR REPLACE FUNCTION public.close_fiscal_period(
  p_period_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE public.fiscal_periods
  SET is_closed = TRUE,
      closed_at = NOW(),
      closed_by = (SELECT auth.uid())
  WHERE id = p_period_id
    AND is_closed = FALSE;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Period not found or already closed'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Fiscal period closed successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.close_fiscal_period(UUID) IS 'Closes a fiscal period, preventing any new transactions within its date range. Respects RLS via organization_id policy on fiscal_periods.';

-- ─── 3d: check_period_locked ────────────────────────────────────────
-- MIGRATION: Check if a given date falls within any closed fiscal period.
-- Returns TRUE if locked (should block transaction creation/editing).

CREATE OR REPLACE FUNCTION public.check_period_locked(
  p_check_date DATE,
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fiscal_periods
    WHERE organization_id = p_org_id
      AND is_closed = TRUE
      AND p_check_date >= start_date
      AND p_check_date <= end_date
  );
$$;

COMMENT ON FUNCTION public.check_period_locked(DATE, UUID) IS 'Returns TRUE if the given date falls within a closed fiscal period for the organization. Use before creating or editing transactions.';

-- ─── 3e: validate_journal_balance ───────────────────────────────────
-- MIGRATION: Validate that a journal entry has balanced debits and credits.
-- Returns is_valid flag and the absolute difference amount.

CREATE OR REPLACE FUNCTION public.validate_journal_balance(
  p_entry_id UUID
)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY INVOKER
AS $$
  WITH totals AS (
    SELECT
      COALESCE(SUM(debit_amount), 0) AS total_debits,
      COALESCE(SUM(credit_amount), 0) AS total_credits
    FROM public.journal_entry_lines
    WHERE journal_entry_id = p_entry_id
  )
  SELECT jsonb_build_object(
    'is_valid', (total_debits = total_credits),
    'total_debits', total_debits,
    'total_credits', total_credits,
    'difference', ABS(total_debits - total_credits)
  )
  FROM totals;
$$;

COMMENT ON FUNCTION public.validate_journal_balance(UUID) IS 'Validates that debits equal credits for a journal entry. Returns is_valid boolean, totals, and the absolute difference.';

-- ─── Column Comments ────────────────────────────────────────────────
-- MIGRATION: Document the purpose of deleted_at on each financial table.

COMMENT ON COLUMN public.sales.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.sale_items.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.invoices.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.invoice_items.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.journal_entries.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.journal_entry_lines.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.expenses.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.purchase_orders.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.purchase_order_items.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.quotations.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.quotation_items.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.returns.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';
COMMENT ON COLUMN public.return_items.deleted_at IS 'Soft delete timestamp. When set, the record is considered deleted but preserved for audit.';

-- =============================================
-- MIGRATION SUMMARY
-- =============================================
-- Section 1: Soft Delete
--   - Added deleted_at column (TIMESTAMPTZ, DEFAULT NULL) to 13 financial tables:
--     sales, sale_items, invoices, invoice_items, journal_entries,
--     journal_entry_lines, expenses, purchase_orders, purchase_order_items,
--     quotations, quotation_items, returns, return_items
--   - Added index on deleted_at for each table (13 indexes total)
--   - Added column comments on all deleted_at columns
--
-- Section 2: Fiscal Period Locking
--   - Created fiscal_periods table with RLS + 4 policies
--   - Added 3 indexes (org, org+period, date range)
--   - Added table and column comments
--
-- Section 3: RPC Functions (5 total)
--   - soft_delete_record(table_name, record_id) → JSONB
--   - restore_record(table_name, record_id) → JSONB
--   - close_fiscal_period(period_id) → JSONB
--   - check_period_locked(check_date, org_id) → BOOLEAN
--   - validate_journal_balance(entry_id) → JSONB
--
-- Security model:
--   - All functions use SECURITY INVOKER (default) — RLS applies
--   - Dynamic SQL functions validate table names against an allowlist
--   - Fiscal period functions use RLS on fiscal_periods table
--   - Journal balance validation is read-only (STABLE)
-- =============================================
