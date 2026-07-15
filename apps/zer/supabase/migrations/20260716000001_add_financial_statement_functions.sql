-- =============================================
-- Financial Statement Functions
-- =============================================
-- Adds get_profit_loss, get_balance_sheet, and get_cash_flow RPCs
-- for generating standard financial statements.
--
-- All functions accept p_branch_id for per-branch or consolidated views.

-- ─── Profit & Loss Statement ─────────────────────────────────────────
-- Returns income and expense account balances for a specific date range.
-- Groups by account type (income/expense) and shows each account's balance.
CREATE OR REPLACE FUNCTION public.get_profit_loss(
  p_organization_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  amount NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    c.id AS account_id,
    c.code,
    c.name,
    c.type,
    CASE
      WHEN c.type = 'income' THEN
        COALESCE(SUM(jl.credit_amount), 0) - COALESCE(SUM(jl.debit_amount), 0)
      WHEN c.type = 'expense' THEN
        COALESCE(SUM(jl.debit_amount), 0) - COALESCE(SUM(jl.credit_amount), 0)
      ELSE 0
    END AS amount
  FROM public.chart_of_accounts c
  LEFT JOIN public.journal_entry_lines jl ON jl.account_id = c.id
  LEFT JOIN public.journal_entries je ON je.id = jl.journal_entry_id
    AND je.entry_date >= p_date_from
    AND je.entry_date <= p_date_to
    AND je.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR je.branch_id = p_branch_id)
  WHERE c.organization_id = p_organization_id
    AND c.type IN ('income', 'expense')
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  GROUP BY c.id, c.code, c.name, c.type
  ORDER BY c.code;
$$;

-- ─── Balance Sheet ───────────────────────────────────────────────────
-- Returns asset, liability, and equity account balances as of a specific date.
CREATE OR REPLACE FUNCTION public.get_balance_sheet(
  p_organization_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  balance NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    c.id AS account_id,
    c.code,
    c.name,
    c.type,
    CASE
      WHEN c.type IN ('asset', 'expense') THEN
        COALESCE(SUM(jl.debit_amount), 0) - COALESCE(SUM(jl.credit_amount), 0)
      ELSE
        COALESCE(SUM(jl.credit_amount), 0) - COALESCE(SUM(jl.debit_amount), 0)
    END AS balance
  FROM public.chart_of_accounts c
  LEFT JOIN public.journal_entry_lines jl ON jl.account_id = c.id
  LEFT JOIN public.journal_entries je ON je.id = jl.journal_entry_id
    AND je.entry_date <= p_as_of_date
    AND je.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR je.branch_id = p_branch_id)
  WHERE c.organization_id = p_organization_id
    AND c.type IN ('asset', 'liability', 'equity')
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  GROUP BY c.id, c.code, c.name, c.type
  ORDER BY c.code;
$$;

-- ─── Cash Flow Statement ────────────────────────────────────────────
-- Derives cash flows from journal entries touching cash/bank accounts (1100, 1200).
-- Returns totals per cash flow category (operating/investing/financing).
CREATE OR REPLACE FUNCTION public.get_cash_flow(
  p_organization_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  category TEXT,
  amount NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  WITH cash_accounts AS (
    SELECT c.id
    FROM public.chart_of_accounts c
    WHERE c.organization_id = p_organization_id
      AND c.code IN ('1100', '1200')  -- Cash and Bank accounts
  ),
  cash_movements AS (
    SELECT
      jl.account_id,
      CASE
        WHEN jl.debit_amount > 0 THEN jl.debit_amount   -- Cash received
        ELSE -jl.credit_amount                            -- Cash paid
      END AS cash_effect
    FROM public.journal_entry_lines jl
    JOIN public.journal_entries je ON je.id = jl.journal_entry_id
    JOIN cash_accounts ca ON ca.id = jl.account_id
    WHERE je.entry_date >= p_date_from
      AND je.entry_date <= p_date_to
      AND je.organization_id = p_organization_id
      AND (p_branch_id IS NULL OR je.branch_id = p_branch_id)
  )
  SELECT 'operating' AS category, SUM(cash_effect) AS amount
  FROM cash_movements
  WHERE account_id IN (
    SELECT id FROM public.chart_of_accounts
    WHERE organization_id = p_organization_id AND type = 'income'
  ) OR account_id IN (
    SELECT id FROM public.chart_of_accounts
    WHERE organization_id = p_organization_id AND type = 'expense'
  )
  HAVING SUM(cash_effect) != 0

  UNION ALL

  SELECT 'investing' AS category, SUM(cash_effect) AS amount
  FROM cash_movements
  WHERE account_id IN (
    SELECT id FROM public.chart_of_accounts
    WHERE organization_id = p_organization_id
      AND type = 'asset' AND code NOT IN ('1100', '1200')
  )
  HAVING SUM(cash_effect) != 0

  UNION ALL

  SELECT 'financing' AS category, SUM(cash_effect) AS amount
  FROM cash_movements
  WHERE account_id IN (
    SELECT id FROM public.chart_of_accounts
    WHERE organization_id = p_organization_id
      AND type IN ('liability', 'equity')
  )
  HAVING SUM(cash_effect) != 0;
$$;
