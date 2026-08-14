-- Migration: P0 + P1 Security & Data Integrity Fixes
-- Fixes: RLS policy gaps, broken trigger, dangerous CASCADE deletes

-- ============================================================
-- P0-2: work_order_commissions INSERT — fix permissive policy
-- Current: WITH CHECK (true) — any user can inject fake commissions
-- Fix: Restrict to org-scoped work orders
-- ============================================================
DROP POLICY IF EXISTS "Users can insert commission records" ON public.work_order_commissions;
CREATE POLICY "Users can insert commission records"
  ON public.work_order_commissions FOR INSERT
  WITH CHECK (
    work_order_id IN (
      SELECT id FROM work_orders
      WHERE organization_id = get_user_organization_id()
    )
  );

-- ============================================================
-- P0-3: car_brands/car_models INSERT — remove permissive policy
-- Current: WITH CHECK (true) — anyone can pollute global reference tables
-- Fix: Remove authenticated INSERT policies (use service_role only)
-- ============================================================
DROP POLICY IF EXISTS "car_brands_insert_auth" ON public.car_brands;
DROP POLICY IF EXISTS "car_models_insert_auth" ON public.car_models;

-- ============================================================
-- P1-13: CASCADE deletes on financial/audit tables → RESTRICT
-- Deleting an org or work order should NEVER cascade-delete
-- financial records (invoices, payments, refunds, commissions)
-- ============================================================

-- customer_followups: org delete should not cascade
ALTER TABLE customer_followups
  DROP CONSTRAINT IF EXISTS customer_followups_organization_id_fkey,
  ADD CONSTRAINT customer_followups_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- store_credit_balances: org delete should not cascade
ALTER TABLE store_credit_balances
  DROP CONSTRAINT IF EXISTS store_credit_balances_organization_id_fkey,
  ADD CONSTRAINT store_credit_balances_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- store_credit_transactions: org delete should not cascade
ALTER TABLE store_credit_transactions
  DROP CONSTRAINT IF EXISTS store_credit_transactions_organization_id_fkey,
  ADD CONSTRAINT store_credit_transactions_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- mechanic_pay_rates: org delete should not cascade
ALTER TABLE mechanic_pay_rates
  DROP CONSTRAINT IF EXISTS mechanic_pay_rates_organization_id_fkey,
  ADD CONSTRAINT mechanic_pay_rates_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- payroll_records: org delete should not cascade
ALTER TABLE payroll_records
  DROP CONSTRAINT IF EXISTS payroll_records_organization_id_fkey,
  ADD CONSTRAINT payroll_records_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- customer_communications: org delete should not cascade
ALTER TABLE customer_communications
  DROP CONSTRAINT IF EXISTS customer_communications_organization_id_fkey,
  ADD CONSTRAINT customer_communications_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- price_rules: org delete should not cascade
ALTER TABLE price_rules
  DROP CONSTRAINT IF EXISTS price_rules_organization_id_fkey,
  ADD CONSTRAINT price_rules_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- work_order_commissions: work_order delete should not cascade (financial data)
ALTER TABLE work_order_commissions
  DROP CONSTRAINT IF EXISTS work_order_commissions_work_order_id_fkey,
  ADD CONSTRAINT work_order_commissions_work_order_id_fkey
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE RESTRICT;

-- ============================================================
-- P1-15: Fix broken customer_followups trigger
-- Trigger references set_updated_at() which was created AFTER
-- the trigger definition, so it may not have been applied.
-- ============================================================
DROP TRIGGER IF EXISTS set_customer_followups_updated_at ON customer_followups;
CREATE TRIGGER set_customer_followups_updated_at
  BEFORE UPDATE ON customer_followups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
