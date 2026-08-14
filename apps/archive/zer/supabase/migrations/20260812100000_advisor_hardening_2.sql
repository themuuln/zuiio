-- ============================================================================
-- Advisor hardening round 2 (forward-fix; remote zer + local stack)
--
-- Remaining Security Advisor findings after 20260812000000:
--   1. Extensions vector/pg_trgm/fuzzystrmatch installed in `public` -> move
--      them to the dedicated `extensions` schema. This also removes the
--      trgm/fuzzystrmatch/vector functions from the PostgREST surface.
--   2. 24 public functions have no explicit search_path (proconfig NULL or
--      search_path=''). Set one. Two extension consumers (search_products x2)
--      had search_path='' with UNQUALIFIED pg_trgm calls - a latent runtime
--      failure (verified live: similarity() does not resolve with
--      search_path=''), which this migration fixes.
--   3. `anon` could EXECUTE internal SECURITY DEFINER mutators/generators
--      (number-sequence generators, stock mutations, sale processing, org
--      creation, ...). Revoke EXECUTE from anon. `authenticated` KEEPS
--      EXECUTE - the app calls these with the user JWT (verified:
--      src/__integration__/*.spec.ts, app/(onboarding)/organization/new,
--      app/(dashboard)/settings).
--      Intentionally left anon-executable:
--        - public storefront contract: get_public_*, submit_shop_order,
--          submit_product_review, cancel_my_order (anon JWT calls them)
--        - RLS-policy helpers referenced by TO-public policies:
--          get_current_organization(), has_permission(app_permission)
--        - trigger functions: handle_new_user(), handle_updated_at()
--   4. RLS enabled with NO policies on 9 tables -> add policies:
--        - 7 agent-gateway tables (service-role only): FOR ALL TO service_role
--        - product_presets: authenticated SELECT (app reads via user client)
--        - smtp_configs: authenticated ALL (app_config convention; the app's
--          own settings/smtp pages do user-client CRUD)
--   5. Leaked password protection: platform auth setting; this project's auth
--      schema has no auth.config table -> cannot be set via SQL. Requires the
--      dashboard or Management API (Settings -> Auth -> Password Protection).
-- ============================================================================

-- ─── 1. Move extensions out of public ──────────────────────────────────────
ALTER EXTENSION vector SET SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION fuzzystrmatch SET SCHEMA extensions;

-- ─── 2. Explicit search_path on flagged + extension-consuming functions ────
ALTER FUNCTION public.generate_purchase_order_number(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_quote_number(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_return_number(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_journal_entry_number(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.seed_default_chart_of_accounts(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.generate_invoice_number(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.get_trial_balance(uuid, date, uuid) SET search_path = 'public, extensions';
-- gateway-owned functions (defined by apps/agent-gateway migrations; absent on fresh zer-only replay)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_active_handoff') THEN
    EXECUTE 'ALTER FUNCTION public.get_active_handoff(uuid, bigint) SET search_path = ''public, extensions''';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'search_agent_knowledge') THEN
    EXECUTE 'ALTER FUNCTION public.search_agent_knowledge(uuid, extensions.vector, integer, double precision) SET search_path = ''public, extensions''';
  END IF;
END $$;
ALTER FUNCTION public.generate_category_slug() SET search_path = 'public, extensions';
ALTER FUNCTION public.get_profit_loss(uuid, date, date, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.get_balance_sheet(uuid, date, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.get_cash_flow(uuid, date, date, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.seed_default_bank_accounts(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.get_inventory_valuation(uuid, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.soft_delete_record(text, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.restore_record(text, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.close_fiscal_period(uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.check_period_locked(date, uuid) SET search_path = 'public, extensions';
ALTER FUNCTION public.validate_journal_balance(uuid) SET search_path = 'public, extensions';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'resolve_org_from_channel') THEN
    EXECUTE 'ALTER FUNCTION public.resolve_org_from_channel(text, text, text) SET search_path = ''public, extensions''';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'resolve_org_from_page') THEN
    EXECUTE 'ALTER FUNCTION public.resolve_org_from_page(text) SET search_path = ''public, extensions''';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'update_channel_connections_updated_at') THEN
    EXECUTE 'ALTER FUNCTION public.update_channel_connections_updated_at() SET search_path = ''public, extensions''';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'update_agent_context_profiles_updated_at') THEN
    EXECUTE 'ALTER FUNCTION public.update_agent_context_profiles_updated_at() SET search_path = ''public, extensions''';
  END IF;
END $$;
-- extension consumers that previously had search_path='' (latent similarity() bug)
ALTER FUNCTION public.search_products(text, integer) SET search_path = 'public, extensions';
ALTER FUNCTION public.search_products(text, integer, jsonb) SET search_path = 'public, extensions';

-- ─── 3. Revoke anon EXECUTE from internal SECURITY DEFINER functions ──────
REVOKE EXECUTE ON FUNCTION public.activate_bom(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_stock_transfer(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_default_stages(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock_safe(uuid, uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_journal_entry_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_purchase_order_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_return_number(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_orders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_daily_spend(uuid, date, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.issue_production_materials(uuid, uuid[], numeric[], text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_batch_adjustment(uuid, uuid, uuid, jsonb, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_receive_purchase_items(uuid, uuid, uuid, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_restock_stock_movements(uuid, uuid, uuid, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_restock_stock_movements(uuid, uuid, uuid, uuid, jsonb, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_sale_stock_decrement(uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_shop_sale(uuid, uuid, uuid, uuid, numeric, numeric, text, uuid, jsonb, jsonb, text, text, numeric, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_production_usage(uuid, uuid[], numeric[], text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.return_production_materials(uuid, uuid[], numeric[], text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_products(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_products(text, integer, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, public.app_permission) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_promotions(uuid, jsonb, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_smtp_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(uuid, uuid, numeric, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.schedule_daily_report_cron(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unschedule_daily_report_cron() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_role_permissions(uuid, public.app_permission[]) FROM anon;

-- ─── 4. RLS policies for tables with RLS enabled but no policies ───────────
-- 4a. Agent-gateway tables: service-role only (gateway runs with service_role,
--     which bypasses RLS; policy documents intent + satisfies linter).
--     agent_async_jobs/agent_webchat_widgets/channel_connections are
--     gateway-owned (defined by apps/agent-gateway migrations) -> guarded.
CREATE POLICY agent_async_jobs_service ON public.agent_async_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY agent_sessions_service ON public.agent_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DO $$ BEGIN
  IF to_regclass('public.agent_webchat_widgets') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY agent_webchat_widgets_service ON public.agent_webchat_widgets FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;
CREATE POLICY bot_buyer_sessions_service ON public.bot_buyer_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DO $$ BEGIN
  IF to_regclass('public.channel_connections') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY channel_connections_service ON public.channel_connections FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;
CREATE POLICY custom_bots_service ON public.custom_bots
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY one_time_tokens_service ON public.one_time_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4b. product_presets: global template catalog, read by authenticated users
--     (presets page, onboarding, settings count); writes via service role.
CREATE POLICY product_presets_select_authenticated ON public.product_presets
  FOR SELECT TO authenticated USING (true);

-- 4c. smtp_configs: global SMTP config managed from settings/smtp pages which
--     perform user-client CRUD (matches the app_config policy convention).
CREATE POLICY smtp_configs_all_authenticated ON public.smtp_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
