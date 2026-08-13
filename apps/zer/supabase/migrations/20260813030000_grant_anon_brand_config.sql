-- =============================================
-- Public storefront: anon read of organizations.brand_config
--
-- The storefront layout (src/app/[slug]/layout.tsx) reads the org's
-- brand theme (brand_config) and display name to apply the org's theme
-- to public pages and mount the AI chat widget. The anon column grant
-- from 20260810170000_public_org_read_policy.sql deliberately limited
-- anon SELECT to (id, name, slug, currency, company_type), so the
-- layout's query — which adds brand_config — fails with 42501 for
-- anonymous visitors. PostgREST returns an error for the whole query,
-- so `org` is null: the brand theme silently falls back to the default
-- Zuiio preset and the AI shopping assistant widget never renders.
--
-- brand_config is the org's PUBLIC brand theme (preset name, radius,
-- logo_url, custom colors, font choices) — exactly the data the public
-- storefront renders. Nothing sensitive lives there, so it belongs in
-- the anon column grant like name/slug/currency.
-- =============================================

GRANT SELECT (brand_config) ON public.organizations TO anon;

-- Keep the RLS row filter unchanged (org_select already gates rows to
-- catalog-enabled orgs for anonymous visitors).
