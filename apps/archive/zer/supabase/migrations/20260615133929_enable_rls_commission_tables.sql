-- Enable RLS
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payout_items ENABLE ROW LEVEL SECURITY;

-- Commission Payouts RLS
DROP POLICY IF EXISTS "commission_payouts_select" ON public.commission_payouts;
CREATE POLICY "commission_payouts_select" ON public.commission_payouts
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('sales.read'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payouts_insert" ON public.commission_payouts;
CREATE POLICY "commission_payouts_insert" ON public.commission_payouts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('sales.create'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payouts_update" ON public.commission_payouts;
CREATE POLICY "commission_payouts_update" ON public.commission_payouts
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('sales.update'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payouts_delete" ON public.commission_payouts;
CREATE POLICY "commission_payouts_delete" ON public.commission_payouts
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('sales.delete'::public.app_permission)
  );

-- Commission Payout Items RLS (scoped through payout -> organization)
DROP POLICY IF EXISTS "commission_payout_items_select" ON public.commission_payout_items;
CREATE POLICY "commission_payout_items_select" ON public.commission_payout_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
    )
    AND has_permission('sales.read'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payout_items_insert" ON public.commission_payout_items;
CREATE POLICY "commission_payout_items_insert" ON public.commission_payout_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
    )
    AND has_permission('sales.create'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payout_items_update" ON public.commission_payout_items;
CREATE POLICY "commission_payout_items_update" ON public.commission_payout_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
    )
    AND has_permission('sales.update'::public.app_permission)
  );

DROP POLICY IF EXISTS "commission_payout_items_delete" ON public.commission_payout_items;
CREATE POLICY "commission_payout_items_delete" ON public.commission_payout_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
    )
    AND has_permission('sales.delete'::public.app_permission)
  );
