-- Coupons: admin CRUD
CREATE POLICY "coupons_select_own_org" ON public.coupons
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('coupons.read'::public.app_permission)
  );

CREATE POLICY "coupons_insert_own_org" ON public.coupons
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('coupons.create'::public.app_permission)
  );

CREATE POLICY "coupons_update_own_org" ON public.coupons
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('coupons.update'::public.app_permission)
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('coupons.update'::public.app_permission)
  );

CREATE POLICY "coupons_delete_own_org" ON public.coupons
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('coupons.delete'::public.app_permission)
  );

-- Coupon usage: insert on sale, select for analytics
CREATE POLICY "coupon_usage_select_own_org" ON public.coupon_usage
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('sales.read'::public.app_permission)
  );

CREATE POLICY "coupon_usage_insert_own_org" ON public.coupon_usage
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND (
      has_permission('sales.create'::public.app_permission)
      OR has_permission('coupons.update'::public.app_permission)
    )
  );
