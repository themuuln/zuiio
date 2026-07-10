-- =============================================
-- Migration: Finalize chart_of_accounts UNIQUE constraint
--
-- Ensures the correct UNIQUE(organization_id, branch_id, code) constraint
-- exists on chart_of_accounts, regardless of database state:
--
-- 1. Drops the old constraint without branch_id (if still present)
-- 2. Drops the constraint with a custom name that may have been added
--    by a previous migration that created a duplicate
-- 3. Creates the properly-named constraint UNIQUE(org_id, branch_id, code)
--    only if it doesn't already exist
-- =============================================

-- Drop the old constraint that doesn't include branch_id (fresh deployments)
ALTER TABLE public.chart_of_accounts
  DROP CONSTRAINT IF EXISTS chart_of_accounts_organization_id_code_key;

-- Drop any duplicate we may have created in the previous migration
ALTER TABLE public.chart_of_accounts
  DROP CONSTRAINT IF EXISTS chart_of_accounts_org_branch_code_key;

-- Add the correct constraint, skipping if already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chart_of_accounts'::regclass
      AND conname = 'chart_of_accounts_organization_id_branch_id_code_key'
  ) THEN
    ALTER TABLE public.chart_of_accounts
      ADD CONSTRAINT chart_of_accounts_organization_id_branch_id_code_key
      UNIQUE (organization_id, branch_id, code);
  END IF;
END;
$$;