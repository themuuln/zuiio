-- ============================================================================
-- Advisor hardening round 2 — grant fix (20260812100000 follow-up)
--
-- Root cause found while verifying 20260812100000: `REVOKE EXECUTE ... FROM
-- anon` only removes an EXPLICIT anon grant. Most of these functions were
-- never granted to anon directly — they were executable by everyone through
-- the default PUBLIC grant (`=X` in proacl), which anon inherits. The first
-- migration therefore only locked the 9 functions that had explicit anon
-- grants. This migration removes the PUBLIC grant too, which is the actual
-- anon exposure.
--
-- Also: the advisor's remaining 5 "Function Search Path Mutable" findings are
-- the no-arg overloads generate_*_number() (proconfig NULL, leftover dead
-- API) — give them an explicit search_path as well.
--
-- Every function here keeps explicit EXECUTE for authenticated and
-- service_role (verified present), so the app's user-JWT RPC calls and the
-- service-role server actions are unaffected.
-- ============================================================================

-- ─── 1. search_path on the no-arg number-generator overloads ───────────────
ALTER FUNCTION public.generate_invoice_number() SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_purchase_order_number() SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_quote_number() SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_return_number() SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_journal_entry_number() SET search_path = 'public, extensions';

-- ─── 2. Remove PUBLIC + explicit anon EXECUTE from internal functions ──────
REVOKE EXECUTE ON FUNCTION public.activate_bom(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_stock_transfer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_default_stages(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock_safe(uuid, uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_journal_entry_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_journal_entry_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_purchase_order_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_purchase_order_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_return_number(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_return_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_daily_spend(uuid, date, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.issue_production_materials(uuid, uuid[], numeric[], text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_batch_adjustment(uuid, uuid, uuid, jsonb, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_receive_purchase_items(uuid, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_restock_stock_movements(uuid, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_restock_stock_movements(uuid, uuid, uuid, uuid, jsonb, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_sale_stock_decrement(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_shop_sale(uuid, uuid, uuid, uuid, numeric, numeric, text, uuid, jsonb, jsonb, text, text, numeric, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_production_usage(uuid, uuid[], numeric[], text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.return_production_materials(uuid, uuid[], numeric[], text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_products(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_products(text, integer, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, public.app_permission) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_promotions(uuid, jsonb, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_smtp_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(uuid, uuid, numeric, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.schedule_daily_report_cron(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unschedule_daily_report_cron() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_role_permissions(uuid, public.app_permission[]) FROM PUBLIC, anon;
