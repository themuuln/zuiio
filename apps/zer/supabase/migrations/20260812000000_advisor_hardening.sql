-- ============================================================================
-- Advisor hardening (forward-fix; applied to local stack + remote zer)
--
-- 1. Consolidate duplicate permissive SELECT policies:
--    - organization_public_profiles: org_profiles_resolve_domain +
--      org_public_profiles_select -> ONE policy, both quals OR'd (role public)
--    - sales: sales_select + sales_select_own_store_account -> ONE policy,
--      both quals OR'd (role public)
--    Postgres ORs permissive policies for the same command, so a single
--    OR'd policy is exactly equivalent to the two originals. Tenant
--    isolation semantics preserved verbatim.
-- 2. Convert gateway read views to SECURITY INVOKER:
--    sale_items_v, invoice_items_v, return_items_v, purchase_order_items_v.
--    The only consumer is the agent-gateway read engine, which queries as
--    service_role (BYPASSRLS) -> unaffected. anon/authenticated hold SELECT
--    grants via Supabase default privileges; with SECURITY DEFINER (owner
--    postgres) they could read cross-tenant line items. security_invoker
--    makes the caller's RLS apply on the base tables (all RLS-enabled).
-- 3. search_path on SECURITY DEFINER functions: VERIFIED ALREADY HARDENED —
--    pg_proc WHERE prosecdef AND proconfig IS NULL returns 0 rows on both
--    local and remote. No ALTERs required.
-- ============================================================================

-- ─── 1a. organization_public_profiles ──────────────────────────────────────
DROP POLICY IF EXISTS org_profiles_resolve_domain ON public.organization_public_profiles;
DROP POLICY IF EXISTS org_public_profiles_select ON public.organization_public_profiles;

CREATE POLICY org_public_profiles_select ON public.organization_public_profiles
  FOR SELECT
  TO public
  USING (
    ((custom_domain IS NOT NULL) AND (domain_verified = true))
    OR (catalog_enabled = true)
    OR (organization_id = (SELECT public.get_current_organization()))
  );

-- ─── 1b. sales ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_select_own_store_account ON public.sales;

CREATE POLICY sales_select ON public.sales
  FOR SELECT
  TO public
  USING (
    (
      (organization_id = (SELECT public.get_current_organization()))
      AND public.has_permission('sales.read')
      AND public.user_has_branch_access(branch_id)
    )
    OR (auth.uid() = store_account_id)
  );

-- ─── 2. Gateway read views -> SECURITY INVOKER ─────────────────────────────
ALTER VIEW public.sale_items_v SET (security_invoker = true);
ALTER VIEW public.invoice_items_v SET (security_invoker = true);
ALTER VIEW public.return_items_v SET (security_invoker = true);
ALTER VIEW public.purchase_order_items_v SET (security_invoker = true);
