-- =============================================
-- Migration: Multi-Branch Support
-- 1. Branches table
-- 2. branch_id on all branch-scoped entities
-- 3. RLS helper function user_has_branch_access()
-- 4. Updated RLS policies with branch awareness
-- 5. Seed migration for existing organizations
-- =============================================

-- =============================================
-- 1. Create branches table
-- =============================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_branches_organization_id ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_default ON public.branches(organization_id, is_default) WHERE is_default = true;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Branches RLS (org-level, no branch_id on branches itself)
CREATE POLICY "branches_select_own_org" ON public.branches
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
  );

CREATE POLICY "branches_insert_own_org" ON public.branches
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('settings.manage')
  );

CREATE POLICY "branches_update_own_org" ON public.branches
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('settings.manage')
  );

CREATE POLICY "branches_delete_own_org" ON public.branches
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('settings.manage')
  );

-- =============================================
-- 2. Add branch_id to all branch-scoped tables
--    (nullable initially, set NOT NULL after seed)
-- =============================================

-- --- Sales ---
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Expenses ---
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Invoices ---
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Purchase Orders ---
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Quotations ---
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Returns ---
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Stock Movements ---
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Discounts ---
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Commission Payouts ---
ALTER TABLE public.commission_payouts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Shared Reports (nullable - org-wide reports allowed) ---
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- --- Chart of Accounts ---
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Journal Entries ---
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT;

-- --- Warehouses (UNIQUE - 1:1 branch-to-warehouse) ---
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.warehouses ADD CONSTRAINT IF NOT EXISTS warehouses_branch_id_key UNIQUE (branch_id);

-- =============================================
-- 3. Add branch_id to profiles (nullable)
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- =============================================
-- 4. Create RLS helper function
-- =============================================
CREATE OR REPLACE FUNCTION public.user_has_branch_access(target_branch_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  SELECT p.branch_id INTO v_branch_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- NULL = org-wide access (admin), UUID = scoped to one branch
  RETURN v_branch_id IS NULL OR v_branch_id = target_branch_id;
END;
$$;

-- =============================================
-- 5. Drop existing RLS policies on all
--    branch-scoped tables before recreating
-- =============================================

-- --- Sales ---
DROP POLICY IF EXISTS "sales_select" ON public.sales;
DROP POLICY IF EXISTS "sales_insert" ON public.sales;
DROP POLICY IF EXISTS "sales_update" ON public.sales;
DROP POLICY IF EXISTS "sales_delete" ON public.sales;
DROP POLICY IF EXISTS "sale_items_select" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_insert" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_update" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_delete" ON public.sale_items;

-- --- Expenses ---
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

-- --- Invoices ---
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_own_org" ON public.invoices;
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_select_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_own_org" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_own_org" ON public.invoice_items;

-- --- Purchase Orders ---
DROP POLICY IF EXISTS "purchase_orders_select_own_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_own_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_own_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_own_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_order_items_select_own_org" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_insert_own_org" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_update_own_org" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_delete_own_org" ON public.purchase_order_items;

-- --- Quotations ---
DROP POLICY IF EXISTS "quotations_select_own_org" ON public.quotations;
DROP POLICY IF EXISTS "quotations_insert_own_org" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_own_org" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_own_org" ON public.quotations;
DROP POLICY IF EXISTS "quotation_items_select_own_org" ON public.quotation_items;
DROP POLICY IF EXISTS "quotation_items_insert_own_org" ON public.quotation_items;
DROP POLICY IF EXISTS "quotation_items_update_own_org" ON public.quotation_items;
DROP POLICY IF EXISTS "quotation_items_delete_own_org" ON public.quotation_items;

-- --- Returns ---
DROP POLICY IF EXISTS "returns_select_own_org" ON public.returns;
DROP POLICY IF EXISTS "returns_insert_own_org" ON public.returns;
DROP POLICY IF EXISTS "returns_update_own_org" ON public.returns;
DROP POLICY IF EXISTS "returns_delete_own_org" ON public.returns;
DROP POLICY IF EXISTS "return_items_select_own_org" ON public.return_items;
DROP POLICY IF EXISTS "return_items_insert_own_org" ON public.return_items;
DROP POLICY IF EXISTS "return_items_update_own_org" ON public.return_items;
DROP POLICY IF EXISTS "return_items_delete_own_org" ON public.return_items;

-- --- Stock Movements ---
DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;

-- --- Discounts ---
DROP POLICY IF EXISTS "discounts_select_own_org" ON public.discounts;
DROP POLICY IF EXISTS "discounts_insert_own_org" ON public.discounts;
DROP POLICY IF EXISTS "discounts_update_own_org" ON public.discounts;
DROP POLICY IF EXISTS "discounts_delete_own_org" ON public.discounts;
DROP POLICY IF EXISTS "discount_conditions_select_own_org" ON public.discount_conditions;
DROP POLICY IF EXISTS "discount_conditions_insert_own_org" ON public.discount_conditions;

-- --- Commission Payouts ---
DROP POLICY IF EXISTS "commission_payouts_select" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_insert" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_update" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payouts_delete" ON public.commission_payouts;
DROP POLICY IF EXISTS "commission_payout_items_select" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_insert" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_update" ON public.commission_payout_items;
DROP POLICY IF EXISTS "commission_payout_items_delete" ON public.commission_payout_items;

-- --- Warehouses ---
DROP POLICY IF EXISTS "warehouses_select" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_select_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete_own_org" ON public.warehouses;
DROP POLICY IF EXISTS "warehouse_products_select" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_insert" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_update" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_delete" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_select_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_insert_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_update_own_org" ON public.warehouse_products;
DROP POLICY IF EXISTS "warehouse_products_delete_own_org" ON public.warehouse_products;

-- --- Shared Reports ---
DROP POLICY IF EXISTS "shared_reports_select" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_insert" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_update" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_delete" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_select_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_insert_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_update_own_org" ON public.shared_reports;
DROP POLICY IF EXISTS "shared_reports_delete_own_org" ON public.shared_reports;

-- --- Chart of Accounts ---
DROP POLICY IF EXISTS "chart_of_accounts_select_own_org" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "chart_of_accounts_insert_own_org" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "chart_of_accounts_update_own_org" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "chart_of_accounts_delete_own_org" ON public.chart_of_accounts;

-- --- Journal Entries ---
DROP POLICY IF EXISTS "journal_entries_select_own_org" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert_own_org" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entry_lines_select_own_org" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "journal_entry_lines_insert_own_org" ON public.journal_entry_lines;

-- =============================================
-- 6. Recreate RLS policies with branch awareness
-- =============================================

-- --- Sales ---
CREATE POLICY "sales_select" ON public.sales
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "sales_update" ON public.sales
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
    AND public.user_has_branch_access(branch_id)
  );

-- --- Sale Items (via sales.branch_id) ---
CREATE POLICY "sale_items_select" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sale_items.sale_id
        AND sales.organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(sales.branch_id)
    )
    AND public.has_permission('sales.read')
  );
CREATE POLICY "sale_items_insert" ON public.sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sale_items.sale_id
        AND sales.organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(sales.branch_id)
    )
    AND public.has_permission('sales.create')
  );

-- --- Expenses ---
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.read')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.create')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.update')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('expenses.delete')
    AND public.user_has_branch_access(branch_id)
  );

-- --- Invoices (with token-based public access) ---
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    (
      organization_id = (SELECT get_current_organization())
      AND public.has_permission('invoices.read')
      AND public.user_has_branch_access(branch_id)
    )
    OR token IS NOT NULL
  );
CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.create')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.update')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "invoices_delete" ON public.invoices
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('invoices.delete')
    AND public.user_has_branch_access(branch_id)
  );

-- --- Invoice Items (via invoices.branch_id) ---
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT USING (
    (
      invoice_id IN (
        SELECT id FROM public.invoices
        WHERE organization_id = (SELECT get_current_organization())
          AND public.user_has_branch_access(invoices.branch_id)
      )
      AND public.has_permission('invoices.read')
    )
    OR invoice_id IN (
      SELECT id FROM public.invoices WHERE token IS NOT NULL
    )
  );
CREATE POLICY "invoice_items_insert" ON public.invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(invoices.branch_id)
    )
    AND public.has_permission('invoices.create')
  );
CREATE POLICY "invoice_items_update" ON public.invoice_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(invoices.branch_id)
    )
    AND public.has_permission('invoices.update')
  );
CREATE POLICY "invoice_items_delete" ON public.invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(invoices.branch_id)
    )
    AND public.has_permission('invoices.delete')
  );

-- --- Purchase Orders ---
CREATE POLICY "purchase_orders_select_own_org" ON public.purchase_orders
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.read'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "purchase_orders_insert_own_org" ON public.purchase_orders
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('purchases.create'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "purchase_orders_update_own_org" ON public.purchase_orders
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.update'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "purchase_orders_delete_own_org" ON public.purchase_orders
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('purchases.delete'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Purchase Order Items (via purchase_orders.branch_id) ---
CREATE POLICY "purchase_order_items_select_own_org" ON public.purchase_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization() AND public.user_has_branch_access(po.branch_id))
    AND has_permission('purchases.read'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_insert_own_org" ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization() AND public.user_has_branch_access(po.branch_id))
    AND has_permission('purchases.create'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_update_own_org" ON public.purchase_order_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization() AND public.user_has_branch_access(po.branch_id))
    AND has_permission('purchases.update'::public.app_permission)
  );
CREATE POLICY "purchase_order_items_delete_own_org" ON public.purchase_order_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id AND po.organization_id = get_current_organization() AND public.user_has_branch_access(po.branch_id))
    AND has_permission('purchases.delete'::public.app_permission)
  );

-- --- Quotations ---
CREATE POLICY "quotations_select_own_org" ON public.quotations
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.read'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "quotations_insert_own_org" ON public.quotations
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('quotations.create'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "quotations_update_own_org" ON public.quotations
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.update'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "quotations_delete_own_org" ON public.quotations
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('quotations.delete'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Quotation Items (via quotations.branch_id) ---
CREATE POLICY "quotation_items_select_own_org" ON public.quotation_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization() AND public.user_has_branch_access(q.branch_id))
    AND has_permission('quotations.read'::public.app_permission)
  );
CREATE POLICY "quotation_items_insert_own_org" ON public.quotation_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization() AND public.user_has_branch_access(q.branch_id))
    AND has_permission('quotations.create'::public.app_permission)
  );
CREATE POLICY "quotation_items_update_own_org" ON public.quotation_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization() AND public.user_has_branch_access(q.branch_id))
    AND has_permission('quotations.update'::public.app_permission)
  );
CREATE POLICY "quotation_items_delete_own_org" ON public.quotation_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND q.organization_id = get_current_organization() AND public.user_has_branch_access(q.branch_id))
    AND has_permission('quotations.delete'::public.app_permission)
  );

-- --- Returns ---
CREATE POLICY "returns_select_own_org" ON public.returns
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('returns.read'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "returns_insert_own_org" ON public.returns
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('returns.create'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "returns_update_own_org" ON public.returns
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('returns.update'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "returns_delete_own_org" ON public.returns
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('returns.delete'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Return Items (via returns.branch_id) ---
CREATE POLICY "return_items_select_own_org" ON public.return_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization() AND public.user_has_branch_access(r.branch_id))
    AND has_permission('returns.read'::public.app_permission)
  );
CREATE POLICY "return_items_insert_own_org" ON public.return_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization() AND public.user_has_branch_access(r.branch_id))
    AND has_permission('returns.create'::public.app_permission)
  );
CREATE POLICY "return_items_update_own_org" ON public.return_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization() AND public.user_has_branch_access(r.branch_id))
    AND has_permission('returns.update'::public.app_permission)
  );
CREATE POLICY "return_items_delete_own_org" ON public.return_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.organization_id = get_current_organization() AND public.user_has_branch_access(r.branch_id))
    AND has_permission('returns.delete'::public.app_permission)
  );

-- --- Stock Movements ---
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('stock_movements.read')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('stock_movements.create')
    AND public.user_has_branch_access(branch_id)
  );

-- --- Discounts ---
CREATE POLICY "discounts_select_own_org" ON public.discounts
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.read'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "discounts_insert_own_org" ON public.discounts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('discounts.create'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "discounts_update_own_org" ON public.discounts
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.update'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "discounts_delete_own_org" ON public.discounts
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('discounts.delete'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Discount Conditions (via discounts.branch_id) ---
CREATE POLICY "discount_conditions_select_own_org" ON public.discount_conditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.discounts d WHERE d.id = discount_id AND d.organization_id = get_current_organization() AND public.user_has_branch_access(d.branch_id))
    AND has_permission('discounts.read'::public.app_permission)
  );
CREATE POLICY "discount_conditions_insert_own_org" ON public.discount_conditions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.discounts d WHERE d.id = discount_id AND d.organization_id = get_current_organization() AND public.user_has_branch_access(d.branch_id))
    AND has_permission('discounts.create'::public.app_permission)
  );

-- --- Commission Payouts ---
CREATE POLICY "commission_payouts_select" ON public.commission_payouts
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.read')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "commission_payouts_insert" ON public.commission_payouts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.create')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "commission_payouts_update" ON public.commission_payouts
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.update')
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "commission_payouts_delete" ON public.commission_payouts
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('sales.delete')
    AND public.user_has_branch_access(branch_id)
  );

-- --- Commission Payout Items (via commission_payouts.branch_id) ---
CREATE POLICY "commission_payout_items_select" ON public.commission_payout_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND public.user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.read'::public.app_permission)
  );
CREATE POLICY "commission_payout_items_insert" ON public.commission_payout_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND public.user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.create'::public.app_permission)
  );
CREATE POLICY "commission_payout_items_update" ON public.commission_payout_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND public.user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.update'::public.app_permission)
  );
CREATE POLICY "commission_payout_items_delete" ON public.commission_payout_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND public.user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.delete'::public.app_permission)
  );

-- --- Warehouses ---
CREATE POLICY "warehouses_select_own_org" ON public.warehouses
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "warehouses_insert_own_org" ON public.warehouses
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "warehouses_update_own_org" ON public.warehouses
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "warehouses_delete_own_org" ON public.warehouses
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.user_has_branch_access(branch_id)
  );

-- --- Warehouse Products (via warehouses.branch_id) ---
CREATE POLICY "warehouse_products_select_own_org" ON public.warehouse_products
  FOR SELECT USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(warehouses.branch_id)
    )
  );
CREATE POLICY "warehouse_products_insert_own_org" ON public.warehouse_products
  FOR INSERT WITH CHECK (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(warehouses.branch_id)
    )
  );
CREATE POLICY "warehouse_products_update_own_org" ON public.warehouse_products
  FOR UPDATE USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(warehouses.branch_id)
    )
  );
CREATE POLICY "warehouse_products_delete_own_org" ON public.warehouse_products
  FOR DELETE USING (
    warehouse_id IN (
      SELECT id FROM public.warehouses
      WHERE organization_id = (SELECT get_current_organization())
        AND public.user_has_branch_access(warehouses.branch_id)
    )
  );

-- --- Shared Reports ---
CREATE POLICY "shared_reports_select_own_org" ON public.shared_reports
  FOR SELECT USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
    AND (branch_id IS NULL OR public.user_has_branch_access(branch_id))
  );
CREATE POLICY "shared_reports_insert_own_org" ON public.shared_reports
  FOR INSERT WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
    AND (branch_id IS NULL OR public.user_has_branch_access(branch_id))
  );
CREATE POLICY "shared_reports_update_own_org" ON public.shared_reports
  FOR UPDATE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
    AND (branch_id IS NULL OR public.user_has_branch_access(branch_id))
  );
CREATE POLICY "shared_reports_delete_own_org" ON public.shared_reports
  FOR DELETE USING (
    organization_id = (SELECT get_current_organization())
    AND public.has_permission('reports.manage')
    AND (branch_id IS NULL OR public.user_has_branch_access(branch_id))
  );

-- Keep the anon select for shared reports (public access via link)
CREATE POLICY "anon_select_shared_reports" ON public.shared_reports
  FOR SELECT TO anon USING (true);

-- --- Chart of Accounts ---
CREATE POLICY "chart_of_accounts_select_own_org" ON public.chart_of_accounts
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "chart_of_accounts_insert_own_org" ON public.chart_of_accounts
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "chart_of_accounts_update_own_org" ON public.chart_of_accounts
  FOR UPDATE USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "chart_of_accounts_delete_own_org" ON public.chart_of_accounts
  FOR DELETE USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Journal Entries ---
CREATE POLICY "journal_entries_select_own_org" ON public.journal_entries
  FOR SELECT USING (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );
CREATE POLICY "journal_entries_insert_own_org" ON public.journal_entries
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization()
    AND has_permission('accounting.manage'::public.app_permission)
    AND public.user_has_branch_access(branch_id)
  );

-- --- Journal Entry Lines (via journal_entries.branch_id) ---
CREATE POLICY "journal_entry_lines_select_own_org" ON public.journal_entry_lines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.organization_id = get_current_organization() AND public.user_has_branch_access(je.branch_id))
    AND has_permission('accounting.manage'::public.app_permission)
  );
CREATE POLICY "journal_entry_lines_insert_own_org" ON public.journal_entry_lines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.organization_id = get_current_organization() AND public.user_has_branch_access(je.branch_id))
    AND has_permission('accounting.manage'::public.app_permission)
  );

-- =============================================
-- 7. Seed migration: Create default branch
--    for existing organizations and assign data
-- =============================================
DO $$
DECLARE
  org RECORD;
  v_branch_id UUID;
  v_warehouse_id UUID;
  v_branch_slug TEXT;
BEGIN
  -- For each organization that doesn't have any branches yet
  FOR org IN SELECT id FROM public.organizations
  LOOP
    -- Check if this org already has branches (skip if already migrated)
    IF NOT EXISTS (SELECT 1 FROM public.branches WHERE organization_id = org.id) THEN
      -- Generate slug from "Үндсэн салбар"
      v_branch_slug := 'undersen-salbAr';

      -- Create default branch
      INSERT INTO public.branches (organization_id, name, slug, address, phone, email, is_default)
      VALUES (org.id, 'Үндсэн салбар', v_branch_slug, NULL, NULL, NULL, true)
      RETURNING id INTO v_branch_id;

      -- Assign all existing sales to default branch
      UPDATE public.sales SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing expenses to default branch
      UPDATE public.expenses SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing invoices to default branch
      UPDATE public.invoices SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing purchase_orders to default branch
      UPDATE public.purchase_orders SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing quotations to default branch
      UPDATE public.quotations SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing returns to default branch
      UPDATE public.returns SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing stock_movements to default branch
      UPDATE public.stock_movements SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing discounts to default branch
      UPDATE public.discounts SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing commission_payouts to default branch
      UPDATE public.commission_payouts SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing chart_of_accounts to default branch
      UPDATE public.chart_of_accounts SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Assign all existing journal_entries to default branch
      UPDATE public.journal_entries SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL;

      -- Create default warehouse linked to the default branch
      INSERT INTO public.warehouses (organization_id, name, location, is_default, branch_id)
      VALUES (org.id, 'Үндсэн салбар - Үндсэн агуулах', NULL, true, v_branch_id)
      RETURNING id INTO v_warehouse_id;

      -- Assign existing warehouses to default branch (if any)
      UPDATE public.warehouses SET branch_id = v_branch_id
      WHERE organization_id = org.id AND branch_id IS NULL AND id != v_warehouse_id;
    END IF;
  END LOOP;
END;
$$;

-- =============================================
-- 8. Set NOT NULL on branch_id columns after seed
--    (shared_reports can have NULL for org-wide reports)
-- =============================================
ALTER TABLE public.sales ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.returns ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.discounts ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.commission_payouts ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.chart_of_accounts ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE public.journal_entries ALTER COLUMN branch_id SET NOT NULL;

-- =============================================
-- 9. Create indexes for branch_id columns
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON public.sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch_id ON public.invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON public.purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_quotations_branch_id ON public.quotations(branch_id);
CREATE INDEX IF NOT EXISTS idx_returns_branch_id ON public.returns(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_id ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_discounts_branch_id ON public.discounts(branch_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_branch_id ON public.commission_payouts(branch_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_branch_id ON public.shared_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_branch_id ON public.chart_of_accounts(branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_branch_id ON public.journal_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_branch_id ON public.warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);