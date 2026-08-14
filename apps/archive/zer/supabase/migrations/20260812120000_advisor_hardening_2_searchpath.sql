-- ============================================================================
-- Advisor hardening round 2 — search_path syntax fix (20260812110000 follow-up)
--
-- 20260812100000 set `search_path = 'public, extensions'` (whole list quoted).
-- In PostgreSQL that is ONE schema named "public, extensions" (nonexistent) —
-- the effective search_path became pg_catalog-only, breaking every unqualified
-- table/operator reference inside those functions (verified live:
-- search_agent_knowledge -> relation "agent_knowledge_sources" does not exist).
--
-- The correct form for a list GUC is unquoted: SET search_path = public,
-- extensions. Re-apply to all 31 functions touched by the earlier migrations
-- (24 flagged + search_products x2 + 5 no-arg overloads). [public, extensions]
-- resolves public tables + moved extension objects (pg_trgm, vector, ...).
-- Also drop the temporary debug functions created during verification.
-- ============================================================================

ALTER FUNCTION public.generate_purchase_order_number(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.generate_quote_number(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.generate_return_number(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.generate_journal_entry_number(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.seed_default_chart_of_accounts(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.generate_invoice_number(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_trial_balance(uuid, date, uuid) SET search_path = public, extensions;
-- gateway-owned functions (defined by apps/agent-gateway migrations; absent on fresh zer-only replay)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_active_handoff') THEN
    EXECUTE 'ALTER FUNCTION public.get_active_handoff(uuid, bigint) SET search_path = public, extensions';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'search_agent_knowledge') THEN
    EXECUTE 'ALTER FUNCTION public.search_agent_knowledge(uuid, extensions.vector, integer, double precision) SET search_path = public, extensions';
  END IF;
END $$;
ALTER FUNCTION public.generate_category_slug() SET search_path = public, extensions;
ALTER FUNCTION public.get_profit_loss(uuid, date, date, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_balance_sheet(uuid, date, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_cash_flow(uuid, date, date, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.seed_default_bank_accounts(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.get_inventory_valuation(uuid, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.soft_delete_record(text, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.restore_record(text, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.close_fiscal_period(uuid) SET search_path = public, extensions;
ALTER FUNCTION public.check_period_locked(date, uuid) SET search_path = public, extensions;
ALTER FUNCTION public.validate_journal_balance(uuid) SET search_path = public, extensions;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'resolve_org_from_channel') THEN
    EXECUTE 'ALTER FUNCTION public.resolve_org_from_channel(text, text, text) SET search_path = public, extensions';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'resolve_org_from_page') THEN
    EXECUTE 'ALTER FUNCTION public.resolve_org_from_page(text) SET search_path = public, extensions';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'update_channel_connections_updated_at') THEN
    EXECUTE 'ALTER FUNCTION public.update_channel_connections_updated_at() SET search_path = public, extensions';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'update_agent_context_profiles_updated_at') THEN
    EXECUTE 'ALTER FUNCTION public.update_agent_context_profiles_updated_at() SET search_path = public, extensions';
  END IF;
END $$;
ALTER FUNCTION public.search_products(text, integer) SET search_path = public, extensions;
ALTER FUNCTION public.search_products(text, integer, jsonb) SET search_path = public, extensions;
ALTER FUNCTION public.generate_invoice_number() SET search_path = public, extensions;
ALTER FUNCTION public.generate_purchase_order_number() SET search_path = public, extensions;
ALTER FUNCTION public.generate_quote_number() SET search_path = public, extensions;
ALTER FUNCTION public.generate_return_number() SET search_path = public, extensions;
ALTER FUNCTION public.generate_journal_entry_number() SET search_path = public, extensions;

-- Clean up verification helpers
DROP FUNCTION IF EXISTS public._t_sp();
DROP FUNCTION IF EXISTS public._t_tbl();
DROP FUNCTION IF EXISTS public._t_a();
DROP FUNCTION IF EXISTS public._t_b();
DROP FUNCTION IF EXISTS public._t_c();
