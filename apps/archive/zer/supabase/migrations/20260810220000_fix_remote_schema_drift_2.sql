-- =============================================
-- Fix remote schema drift (part 2): social_links column
--
-- 20260727000001_add_social_links_to_public_profiles is RECORDED in the
-- remote schema_migrations but the column never landed (same pattern as
-- the analytics/SEO columns fixed by 20260810210000). The app writes and
-- reads it (src/app/(dashboard)/settings/organization/actions.ts:202).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is a no-op on any environment
-- that already has the column (local stack included).
-- =============================================

ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB;

COMMENT ON COLUMN public.organization_public_profiles.social_links IS 'Social media links as key-value pairs (platform -> URL)';
