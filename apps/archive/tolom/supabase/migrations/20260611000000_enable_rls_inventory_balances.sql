-- Enable RLS on inventory_balances (missed in 20260531085754)
-- Table is read-only: rows are maintained by trg_inventory_movement_sync
-- (security definer), so only a SELECT policy is needed.

ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_balances_select" ON public.inventory_balances;
CREATE POLICY "inventory_balances_select"
  ON public.inventory_balances FOR SELECT
  USING (organization_id = get_user_organization_id());
