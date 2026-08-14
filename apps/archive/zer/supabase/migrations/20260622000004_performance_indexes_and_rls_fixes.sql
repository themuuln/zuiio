-- =============================================
-- Performance optimization: FK indexes, RLS initplan
-- fix, consolidate policies, drop unused indexes
-- =============================================

-- =============================================
-- 1. Add missing FK indexes (24 indexes on
--    public tables used in JOINS and WHERE)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON public.categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_paid_by ON public.commission_payouts(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON public.invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_by ON public.journal_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_product_id ON public.product_bundle_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_variant_id ON public.product_bundle_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_converted_to_sale_id ON public.quotations(converted_to_sale_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON public.quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_report_email_log_smtp_config_id ON public.report_email_log(smtp_config_id);
CREATE INDEX IF NOT EXISTS idx_returns_contact_id ON public.returns(contact_id);
CREATE INDEX IF NOT EXISTS idx_returns_created_by ON public.returns(created_by);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_contact_id ON public.sales(contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON public.sales(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_created_by ON public.shared_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);

-- =============================================
-- 2. Drop unused indexes (identified by advisors
--    as never-used, reduces write overhead)
-- =============================================
DROP INDEX IF EXISTS public.idx_commission_payouts_branch_id;
DROP INDEX IF EXISTS public.idx_discount_conditions_discount;
DROP INDEX IF EXISTS public.idx_discounts_active;
DROP INDEX IF EXISTS public.idx_product_bundle_items_bundle;
DROP INDEX IF EXISTS public.idx_report_email_log_org;
DROP INDEX IF EXISTS public.idx_report_email_log_status;
DROP INDEX IF EXISTS public.idx_shared_reports_branch_id;
DROP INDEX IF EXISTS public.idx_stock_movements_batch;
DROP INDEX IF EXISTS public.idx_warehouses_branch_id;

-- =============================================
-- 3. Fix auth_rls_initplan for profiles table
--    Wrap auth.uid() in (SELECT auth.uid()) to
--    avoid per-row re-evaluation
-- =============================================

-- Drop and recreate profiles policies to use initplan pattern
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- =============================================
-- 4. Consolidate overlapping profiles SELECT
--    policies: profiles_org_read + profiles_self_select
--    share anon/authenticated SELECT. Merge into
--    one policy per role.
-- =============================================
-- org_read was originally no TO (applied to all roles), but
-- anon users never have a valid organization_id so it was
-- effectively a no-op for them. Keep it TO authenticated only.
DROP POLICY IF EXISTS "profiles_org_read" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR organization_id = (SELECT get_current_organization())
  );
