-- =============================================
-- Custom Domains
--
-- Org-scoped custom domain for the public storefront.
-- custom_domain is the verified apex domain; middleware resolves host →
-- org slug and rewrites to the /[slug] routes. domain_verified gates
-- activation (set after DNS verification in production).
-- =============================================

ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN NOT NULL DEFAULT false;

-- Unique index over verified domains only (partial) — a domain can be
-- claimed by at most one org once it is verified.
DROP INDEX IF EXISTS idx_org_profiles_verified_domain;
CREATE UNIQUE INDEX idx_org_profiles_verified_domain
  ON public.organization_public_profiles (custom_domain)
  WHERE domain_verified = true;

-- Public read of verified domains: any anon visitor reaching
-- https://custom.example.com must be able to resolve it to a slug.
-- The base table select is gated on catalog_enabled; this policy lets
-- the domain resolver read verified domains for enabled orgs.
DROP POLICY IF EXISTS org_profiles_resolve_domain ON public.organization_public_profiles;
CREATE POLICY org_profiles_resolve_domain ON public.organization_public_profiles
  FOR SELECT USING (custom_domain IS NOT NULL AND domain_verified = true);
