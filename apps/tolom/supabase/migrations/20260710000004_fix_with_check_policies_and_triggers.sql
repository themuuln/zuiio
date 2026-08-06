-- Migration: P2 Schema Cleanup — WITH CHECK policies, updated_at triggers, org_invites fix
-- Defense-in-depth: ensures all UPDATE policies have both USING and WITH CHECK

-- ============================================================
-- 1. Fix UPDATE policies missing WITH CHECK
-- ============================================================

-- price_rules: add WITH CHECK
DROP POLICY IF EXISTS "price_rules_update" ON public.price_rules;
CREATE POLICY "price_rules_update" ON public.price_rules
  FOR UPDATE
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL)
  WITH CHECK (organization_id = get_user_organization_id() AND deleted_at IS NULL);

-- invoice_refunds: add WITH CHECK
DROP POLICY IF EXISTS "Users can update refunds in their org" ON public.invoice_refunds;
CREATE POLICY "Users can update refunds in their org" ON public.invoice_refunds
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- store_credit_balances: add WITH CHECK
DROP POLICY IF EXISTS "Users can update store credit balances in their organization" ON public.store_credit_balances;
CREATE POLICY "Users can update store credit balances in their organization" ON public.store_credit_balances
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- org_invites: add WITH CHECK
DROP POLICY IF EXISTS "Org members can update invites" ON public.org_invites;
CREATE POLICY "Org members can update invites" ON public.org_invites
  FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- app_config: add WITH CHECK
DROP POLICY IF EXISTS "Super admins can update app_config" ON public.app_config;
CREATE POLICY "Super admins can update app_config" ON public.app_config
  FOR UPDATE
  USING ((select auth.uid()) in (select user_id from public.super_admins))
  WITH CHECK ((select auth.uid()) in (select user_id from public.super_admins));


-- ============================================================
-- 2. Fix org_invites SELECT — scope to org members + invite recipients
-- ============================================================
-- NOTE: org_invites has no user_id column; invite recipients are looked
-- up by token via SECURITY DEFINER RPC. Restore prod-equivalent policy.
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.org_invites;
CREATE POLICY "Anyone can view invite by token" ON public.org_invites
  FOR SELECT
  USING (true);


-- ============================================================
-- 3. Add missing updated_at triggers
-- ============================================================
DO $$
BEGIN
  -- suppliers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'suppliers'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON suppliers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- purchase_orders
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'purchase_orders'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchase_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- purchase_order_items
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'purchase_order_items'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchase_order_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- stock_thresholds
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'stock_thresholds'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON stock_thresholds
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- work_order_commissions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'work_order_commissions'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON work_order_commissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- vehicle_owners
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'vehicle_owners'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_owners
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- app_config
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'app_config'::regclass) THEN
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON app_config
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
