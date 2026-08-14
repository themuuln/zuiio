-- =============================================
-- Migration: Add branch filtering to get_trial_balance
--
-- Updates the get_trial_balance function to accept an optional p_branch_id
-- parameter. When p_branch_id is provided, only accounts and journal entries
-- for that branch are included (per-branch trial balance).
-- When p_branch_id is NULL (default), all branches are included (consolidated view).
-- =============================================

-- Drop the old function (need to DROP because we're adding a new parameter)
DROP FUNCTION IF EXISTS public.get_trial_balance(p_organization_id UUID, p_as_of_date DATE);

-- Recreate with optional branch_id parameter
CREATE OR REPLACE FUNCTION public.get_trial_balance(
  p_organization_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(account_id UUID, account_code TEXT, account_name TEXT, account_type TEXT, debit_balance NUMERIC, credit_balance NUMERIC)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    c.id AS account_id,
    c.code,
    c.name,
    c.type,
    CASE WHEN c.type IN ('asset', 'expense')
      THEN COALESCE(SUM(jl.debit_amount), 0) - COALESCE(SUM(jl.credit_amount), 0)
      ELSE 0
    END AS debit_balance,
    CASE WHEN c.type IN ('liability', 'equity', 'income')
      THEN COALESCE(SUM(jl.credit_amount), 0) - COALESCE(SUM(jl.debit_amount), 0)
      ELSE 0
    END AS credit_balance
  FROM public.chart_of_accounts c
  LEFT JOIN public.journal_entry_lines jl ON jl.account_id = c.id
  LEFT JOIN public.journal_entries je ON je.id = jl.journal_entry_id
    AND je.entry_date <= p_as_of_date
    AND je.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR je.branch_id = p_branch_id)
  WHERE c.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  GROUP BY c.id, c.code, c.name, c.type
  ORDER BY c.code;
$$;