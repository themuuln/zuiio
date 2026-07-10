-- =============================================
-- Migration: Fix chart_of_accounts UNIQUE constraint
-- 
-- The old UNIQUE(organization_id, code) does not include branch_id,
-- causing duplicate code errors when multiple branches exist with
-- the same account code (e.g. both branches need code '1000').
-- 
-- Change to UNIQUE(organization_id, branch_id, code) so each
-- branch can have its own independent chart of accounts.
-- =============================================

-- Drop the old constraint that doesn't include branch_id
ALTER TABLE public.chart_of_accounts
  DROP CONSTRAINT IF EXISTS chart_of_accounts_organization_id_code_key;

-- Add new constraint with branch_id included
ALTER TABLE public.chart_of_accounts
  ADD CONSTRAINT chart_of_accounts_org_branch_code_key
  UNIQUE (organization_id, branch_id, code);