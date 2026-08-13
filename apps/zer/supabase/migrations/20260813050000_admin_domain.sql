-- =============================================
-- Admin (ERP) custom domain
--
-- Org-scoped domain that serves the ERP dashboard instead of the
-- storefront: e.g. erp.bujin.mn → https://zer.zuiiotech.com dashboard.
-- The proxy does NOT rewrite admin hosts to /{slug} — the auth guard and
-- dashboard render under the admin host, so org admins get their own
-- login + dashboard URL. admin_domain_verified gates activation (same
-- TXT ownership flow as custom_domain).
-- =============================================

ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS admin_domain TEXT,
  ADD COLUMN IF NOT EXISTS admin_domain_verified BOOLEAN NOT NULL DEFAULT false;

-- A verified admin domain can be claimed by at most one org (same rule as
-- the storefront domain). NOTE: this index does not prevent an org from
-- claiming another org's verified storefront domain as its admin domain —
-- the proxy resolves storefront domains first, so such a collision would
-- serve the storefront. Documented, not enforced.
DROP INDEX IF EXISTS idx_org_profiles_verified_admin_domain;
CREATE UNIQUE INDEX idx_org_profiles_verified_admin_domain
  ON public.organization_public_profiles (admin_domain)
  WHERE admin_domain_verified = true;
