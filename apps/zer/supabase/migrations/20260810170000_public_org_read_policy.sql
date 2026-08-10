-- =============================================
-- Public storefront read access to organizations
--
-- The public storefront (org home, cart, blog, account, product pages) reads
-- `organizations` directly with the anon key (org name/slug/currency for
-- headers, meta, JSON-LD). Prod RLS blocked anon entirely (`org_select` was
-- `id = get_current_organization()`, NULL for anon), so every storefront page
-- returned not-found for anonymous visitors — the pages only worked locally
-- because local RLS on `organizations` was disabled.
--
-- This migration:
--   1. Grants anon COLUMN-LEVEL SELECT on the public-facing fields only
--      (id for FK joins, name, slug, currency, company_type). Revokes the
--      table-level SELECT so the internal config columns (report_email_*,
--      brand_config, enabled_features, has_* flags, prefixes, …) stay
--      invisible to anon.
--   2. Replaces `org_select` so anon/authenticated can read an organization
--      row when it belongs to the caller (staff) OR when the org publishes a
--      public storefront (organization_public_profiles.catalog_enabled).
--      Staff access is unchanged. RLS stays ON.
-- =============================================

-- anon: drop table-level SELECT, grant only public columns.
REVOKE SELECT ON public.organizations FROM anon;
GRANT SELECT (id, name, slug, currency, company_type) ON public.organizations TO anon;

-- authenticated keeps full table access (dashboard reads the config columns).
GRANT SELECT ON public.organizations TO authenticated;

-- Row filter: own org (staff) OR catalog-enabled (public storefront).
DROP POLICY IF EXISTS org_select ON public.organizations;
CREATE POLICY org_select ON public.organizations
  FOR SELECT TO public
  USING (
    id = get_current_organization()
    OR EXISTS (
      SELECT 1 FROM public.organization_public_profiles p
      WHERE p.organization_id = organizations.id
        AND p.catalog_enabled = true
    )
  );
