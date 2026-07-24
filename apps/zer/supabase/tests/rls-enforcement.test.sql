BEGIN;
SELECT plan(25);

-- =============================================
-- Verify EVERY business table has RLS enabled.
-- pgTAP runs as superuser so we can query pg_class directly.
-- =============================================

-- P0 tables + P1 tables
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sales'::regclass),
  true,
  'sales has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.sale_items'::regclass),
  true,
  'sale_items has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stock_movements'::regclass),
  true,
  'stock_movements has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.products'::regclass),
  true,
  'products has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.categories'::regclass),
  true,
  'categories has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.brands'::regclass),
  true,
  'brands has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.contacts'::regclass),
  true,
  'contacts has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.warehouses'::regclass),
  true,
  'warehouses has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.warehouse_products'::regclass),
  true,
  'warehouse_products has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.expenses'::regclass),
  true,
  'expenses has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invoices'::regclass),
  true,
  'invoices has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invoice_items'::regclass),
  true,
  'invoice_items has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.purchase_orders'::regclass),
  true,
  'purchase_orders has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.purchase_order_items'::regclass),
  true,
  'purchase_order_items has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.returns'::regclass),
  true,
  'returns has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.return_items'::regclass),
  true,
  'return_items has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.roles'::regclass),
  true,
  'roles has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.role_permissions'::regclass),
  true,
  'role_permissions has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.chart_of_accounts'::regclass),
  true,
  'chart_of_accounts has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.journal_entries'::regclass),
  true,
  'journal_entries has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.journal_entry_lines'::regclass),
  true,
  'journal_entry_lines has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.bank_accounts'::regclass),
  true,
  'bank_accounts has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cash_registers'::regclass),
  true,
  'cash_registers has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cash_sessions'::regclass),
  true,
  'cash_sessions has RLS enabled'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass),
  true,
  'profiles has RLS enabled'
);

SELECT * FROM finish();
ROLLBACK;
