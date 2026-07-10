-- =============================================
-- Fix RLS update policies: add WITH CHECK clause
--
-- The Supabase skill warns that UPDATE policies require
-- both USING and WITH CHECK. Without WITH CHECK, a user
-- could reassign a row's organization_id to another org.
--
-- Migration: drop + recreate every UPDATE policy that
-- was missing WITH CHECK, mirroring the USING condition.
-- Also adds missing INSERT/UPDATE/DELETE policies for
-- telegram_links.
-- =============================================

-- ── Branches ────────────────────────────────────────────────────

DROP POLICY IF EXISTS branches_update_own_org ON public.branches;
CREATE POLICY branches_update_own_org ON public.branches
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('settings.manage'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('settings.manage'::app_permission));

-- ── Brands ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS brands_update ON public.brands;
CREATE POLICY brands_update ON public.brands
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('brands.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('brands.update'::app_permission));

-- ── Categories ──────────────────────────────────────────────────

DROP POLICY IF EXISTS categories_update ON public.categories;
CREATE POLICY categories_update ON public.categories
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('categories.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('categories.update'::app_permission));

-- ── Chart of Accounts ───────────────────────────────────────────

DROP POLICY IF EXISTS chart_of_accounts_update_own_org ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_update_own_org ON public.chart_of_accounts
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('accounting.manage'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('accounting.manage'::app_permission) AND user_has_branch_access(branch_id));

-- ── Commission Payout Items ─────────────────────────────────────

DROP POLICY IF EXISTS commission_payout_items_update ON public.commission_payout_items;
CREATE POLICY commission_payout_items_update ON public.commission_payout_items
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.update'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commission_payouts
      WHERE commission_payouts.id = commission_payout_items.payout_id
        AND commission_payouts.organization_id = get_current_organization()
        AND user_has_branch_access(commission_payouts.branch_id)
    )
    AND has_permission('sales.update'::app_permission)
  );

-- ── Commission Payouts ──────────────────────────────────────────

DROP POLICY IF EXISTS commission_payouts_update ON public.commission_payouts;
CREATE POLICY commission_payouts_update ON public.commission_payouts
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('sales.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('sales.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Contacts ────────────────────────────────────────────────────

DROP POLICY IF EXISTS contacts_update ON public.contacts;
CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('contacts.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('contacts.update'::app_permission));

-- ── Discounts ───────────────────────────────────────────────────

DROP POLICY IF EXISTS discounts_update_own_org ON public.discounts;
CREATE POLICY discounts_update_own_org ON public.discounts
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('discounts.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('discounts.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Expenses ────────────────────────────────────────────────────

DROP POLICY IF EXISTS expenses_update ON public.expenses;
CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('expenses.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('expenses.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Invoice Items ───────────────────────────────────────────────

DROP POLICY IF EXISTS invoice_items_update ON public.invoice_items;
CREATE POLICY invoice_items_update ON public.invoice_items
  FOR UPDATE TO public
  USING (
    invoice_id IN (
      SELECT invoices.id FROM public.invoices
      WHERE invoices.organization_id = (SELECT get_current_organization())
        AND user_has_branch_access(invoices.branch_id)
    )
    AND has_permission('invoices.update'::app_permission)
  )
  WITH CHECK (
    invoice_id IN (
      SELECT invoices.id FROM public.invoices
      WHERE invoices.organization_id = (SELECT get_current_organization())
        AND user_has_branch_access(invoices.branch_id)
    )
    AND has_permission('invoices.update'::app_permission)
  );

-- ── Invoices ────────────────────────────────────────────────────

DROP POLICY IF EXISTS invoices_update ON public.invoices;
CREATE POLICY invoices_update ON public.invoices
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('invoices.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('invoices.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Journal Entries ─────────────────────────────────────────────

DROP POLICY IF EXISTS journal_entries_update_own_org ON public.journal_entries;
CREATE POLICY journal_entries_update_own_org ON public.journal_entries
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('accounting.manage'::app_permission))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('accounting.manage'::app_permission));

-- ── Journal Entry Lines ─────────────────────────────────────────

DROP POLICY IF EXISTS journal_entry_lines_update_own_org ON public.journal_entry_lines;
CREATE POLICY journal_entry_lines_update_own_org ON public.journal_entry_lines
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
        AND je.organization_id = get_current_organization()
    )
    AND has_permission('accounting.manage'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
        AND je.organization_id = get_current_organization()
    )
    AND has_permission('accounting.manage'::app_permission)
  );

-- ── Notification Configs ────────────────────────────────────────

DROP POLICY IF EXISTS notification_configs_update ON public.notification_configs;
CREATE POLICY notification_configs_update ON public.notification_configs
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('notifications.manage'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('notifications.manage'::app_permission));

-- ── Product Bundle Items ────────────────────────────────────────

DROP POLICY IF EXISTS product_bundle_items_update ON public.product_bundle_items;
CREATE POLICY product_bundle_items_update ON public.product_bundle_items
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND has_permission('products.update'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_bundles
      WHERE product_bundles.id = product_bundle_items.bundle_id
        AND product_bundles.organization_id = (SELECT get_current_organization())
    )
    AND has_permission('products.update'::app_permission)
  );

-- ── Product Bundles ─────────────────────────────────────────────

DROP POLICY IF EXISTS product_bundles_update ON public.product_bundles;
CREATE POLICY product_bundles_update ON public.product_bundles
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('products.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('products.update'::app_permission));

-- ── Products ────────────────────────────────────────────────────

DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update ON public.products
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('products.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('products.update'::app_permission));

-- ── Purchase Order Items ────────────────────────────────────────

DROP POLICY IF EXISTS purchase_order_items_update_own_org ON public.purchase_order_items;
CREATE POLICY purchase_order_items_update_own_org ON public.purchase_order_items
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = get_current_organization()
        AND user_has_branch_access(po.branch_id)
    )
    AND has_permission('purchases.update'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND po.organization_id = get_current_organization()
        AND user_has_branch_access(po.branch_id)
    )
    AND has_permission('purchases.update'::app_permission)
  );

-- ── Purchase Orders ─────────────────────────────────────────────

DROP POLICY IF EXISTS purchase_orders_update_own_org ON public.purchase_orders;
CREATE POLICY purchase_orders_update_own_org ON public.purchase_orders
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('purchases.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('purchases.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Quotation Items ─────────────────────────────────────────────

DROP POLICY IF EXISTS quotation_items_update_own_org ON public.quotation_items;
CREATE POLICY quotation_items_update_own_org ON public.quotation_items
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.organization_id = get_current_organization()
        AND user_has_branch_access(q.branch_id)
    )
    AND has_permission('quotations.update'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.organization_id = get_current_organization()
        AND user_has_branch_access(q.branch_id)
    )
    AND has_permission('quotations.update'::app_permission)
  );

-- ── Quotations ──────────────────────────────────────────────────

DROP POLICY IF EXISTS quotations_update_own_org ON public.quotations;
CREATE POLICY quotations_update_own_org ON public.quotations
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('quotations.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('quotations.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Return Items ────────────────────────────────────────────────

DROP POLICY IF EXISTS return_items_update_own_org ON public.return_items;
CREATE POLICY return_items_update_own_org ON public.return_items
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.returns r
      WHERE r.id = return_items.return_id
        AND r.organization_id = get_current_organization()
        AND user_has_branch_access(r.branch_id)
    )
    AND has_permission('returns.update'::app_permission)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.returns r
      WHERE r.id = return_items.return_id
        AND r.organization_id = get_current_organization()
        AND user_has_branch_access(r.branch_id)
    )
    AND has_permission('returns.update'::app_permission)
  );

-- ── Returns ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS returns_update_own_org ON public.returns;
CREATE POLICY returns_update_own_org ON public.returns
  FOR UPDATE TO public
  USING (organization_id = get_current_organization() AND has_permission('returns.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = get_current_organization() AND has_permission('returns.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Role Permissions ────────────────────────────────────────────

DROP POLICY IF EXISTS role_permissions_update_org ON public.role_permissions;
CREATE POLICY role_permissions_update_org ON public.role_permissions
  FOR UPDATE TO public
  USING (
    role_id IN (
      SELECT roles.id FROM public.roles
      WHERE roles.organization_id = (SELECT get_current_organization())
    )
    AND has_permission('roles.manage'::app_permission)
  )
  WITH CHECK (
    role_id IN (
      SELECT roles.id FROM public.roles
      WHERE roles.organization_id = (SELECT get_current_organization())
    )
    AND has_permission('roles.manage'::app_permission)
  );

-- ── Roles ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS roles_update_org ON public.roles;
CREATE POLICY roles_update_org ON public.roles
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('roles.manage'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('roles.manage'::app_permission));

-- ── Sales ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS sales_update ON public.sales;
CREATE POLICY sales_update ON public.sales
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('sales.update'::app_permission) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('sales.update'::app_permission) AND user_has_branch_access(branch_id));

-- ── Shared Reports ──────────────────────────────────────────────

DROP POLICY IF EXISTS shared_reports_update_own_org ON public.shared_reports;
CREATE POLICY shared_reports_update_own_org ON public.shared_reports
  FOR UPDATE TO public
  USING (
    organization_id = (SELECT get_current_organization())
    AND has_permission('reports.manage'::app_permission)
    AND (branch_id IS NULL OR user_has_branch_access(branch_id))
  )
  WITH CHECK (
    organization_id = (SELECT get_current_organization())
    AND has_permission('reports.manage'::app_permission)
    AND (branch_id IS NULL OR user_has_branch_access(branch_id))
  );

-- ── UOM Conversions ─────────────────────────────────────────────

DROP POLICY IF EXISTS uom_conversions_update ON public.uom_conversions;
CREATE POLICY uom_conversions_update ON public.uom_conversions
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND has_permission('uom_conversions.update'::app_permission))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND has_permission('uom_conversions.update'::app_permission));

-- ── Variant Groups ──────────────────────────────────────────────

DROP POLICY IF EXISTS variant_groups_update_own_org ON public.product_variant_groups;
CREATE POLICY variant_groups_update_own_org ON public.product_variant_groups
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variant_groups.product_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variant_groups.product_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  );

-- ── Variant Options ─────────────────────────────────────────────

DROP POLICY IF EXISTS variant_options_update_own_org ON public.product_variant_options;
CREATE POLICY variant_options_update_own_org ON public.product_variant_options
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variant_groups
      JOIN public.products ON products.id = product_variant_groups.product_id
      WHERE product_variant_groups.id = product_variant_options.group_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_variant_groups
      JOIN public.products ON products.id = product_variant_groups.product_id
      WHERE product_variant_groups.id = product_variant_options.group_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  );

-- ── Variants ────────────────────────────────────────────────────

DROP POLICY IF EXISTS variants_update_own_org ON public.product_variants;
CREATE POLICY variants_update_own_org ON public.product_variants
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variants.product_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variants.product_id
        AND products.organization_id = (SELECT get_current_organization())
        AND has_permission('products.update'::app_permission)
    )
  );

-- ── Warehouse Products ──────────────────────────────────────────

DROP POLICY IF EXISTS warehouse_products_update_own_org ON public.warehouse_products;
CREATE POLICY warehouse_products_update_own_org ON public.warehouse_products
  FOR UPDATE TO public
  USING (
    warehouse_id IN (
      SELECT warehouses.id FROM public.warehouses
      WHERE warehouses.organization_id = (SELECT get_current_organization())
        AND user_has_branch_access(warehouses.branch_id)
    )
  )
  WITH CHECK (
    warehouse_id IN (
      SELECT warehouses.id FROM public.warehouses
      WHERE warehouses.organization_id = (SELECT get_current_organization())
        AND user_has_branch_access(warehouses.branch_id)
    )
  );

-- ── Warehouses ──────────────────────────────────────────────────

DROP POLICY IF EXISTS warehouses_update_own_org ON public.warehouses;
CREATE POLICY warehouses_update_own_org ON public.warehouses
  FOR UPDATE TO public
  USING (organization_id = (SELECT get_current_organization()) AND user_has_branch_access(branch_id))
  WITH CHECK (organization_id = (SELECT get_current_organization()) AND user_has_branch_access(branch_id));

-- ── Storage: Brand Assets ───────────────────────────────────────

DROP POLICY IF EXISTS "Org users can update brand assets" ON storage.objects;
CREATE POLICY "Org users can update brand assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'brand_assets'
    AND (
      owner = auth.uid()
      OR (
        (SELECT public.get_current_organization()) IS NOT NULL
        AND public.has_permission('settings.manage')
      )
    )
  )
  WITH CHECK (
    bucket_id = 'brand_assets'
    AND (
      owner = auth.uid()
      OR (
        (SELECT public.get_current_organization()) IS NOT NULL
        AND public.has_permission('settings.manage')
      )
    )
  );

-- =============================================
-- Missing telegram_links policies
-- =============================================

DROP POLICY IF EXISTS telegram_links_insert ON public.telegram_links;
CREATE POLICY telegram_links_insert ON public.telegram_links
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS telegram_links_update ON public.telegram_links;
CREATE POLICY telegram_links_update ON public.telegram_links
  FOR UPDATE TO authenticated
  USING (organization_id = (SELECT get_current_organization()))
  WITH CHECK (organization_id = (SELECT get_current_organization()));

DROP POLICY IF EXISTS telegram_links_delete ON public.telegram_links;
CREATE POLICY telegram_links_delete ON public.telegram_links
  FOR DELETE TO authenticated
  USING (organization_id = (SELECT get_current_organization()));
