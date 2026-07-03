-- Add soft delete support to price_rules table
-- The service layer queries use .is("deleted_at", null) but the column was missing

ALTER TABLE public.price_rules
  ADD COLUMN deleted_at timestamptz;

COMMENT ON COLUMN public.price_rules.deleted_at IS 'Soft delete timestamp. NULL means the rule is active.';

-- Update RLS policies to handle soft delete
-- SELECT/UPDATE/DELETE policies need to exclude soft-deleted rows
-- The service layer already filters .is('deleted_at', null), but RLS provides defense in depth

DROP POLICY IF EXISTS "price_rules_select" ON public.price_rules;
CREATE POLICY "price_rules_select" ON public.price_rules
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "price_rules_update" ON public.price_rules;
CREATE POLICY "price_rules_update" ON public.price_rules
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

-- DELETE policy remains as-is (hard delete RLS), but soft-delete is done via UPDATE
-- so the UPDATE policy covers it.
