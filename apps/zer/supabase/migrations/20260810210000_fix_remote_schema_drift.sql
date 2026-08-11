-- =============================================
-- Fix remote schema drift revealed by the 20260810 types sync
--
-- The remote project (krrkhozadforrydffegg) recorded several base
-- migrations as applied but their schema objects never landed:
--
--   1. app_permission enum is missing 16 values that exist locally
--      (inventory.*, settings.read/update, reports.read, access,
--      hr.*, manufacturing.*) — 20260613000000_create_core_tables
--      recorded remotely but the enum was created from an older file
--      revision (20260616000006), so the extras were never added.
--   2. organization_public_profiles is missing the analytics/SEO
--      columns (ga_measurement_id, meta_pixel_id, meta_title,
--      meta_description, og_image_url) — 20260730000004 is recorded
--      remotely but its ALTER TABLE never took effect.
--   3. increment_smtp_count still has the pre-20260622000002
--      signature (config_id uuid); the app calls it with
--      p_config_id (src/lib/email.ts:124).
--
-- Idempotent: safe to apply on the local stack (already correct) and
-- on any remote that is partially or fully repaired. Never re-runs
-- applied migrations; this is a NEW forward-fix migration.
-- =============================================

-- ─────────────────────────────────────────────
-- 1. app_permission enum — add every locally-known value
--    that the remote enum lacks (IF NOT EXISTS = idempotent).
--    DO-block + duplicate_object guard mirrors the established
--    convention in 20260617000001 / 20260717100000 / 20260802120000.
-- ─────────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'settings.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'settings.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'reports.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'access';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'inventory.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'inventory.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'inventory.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'inventory.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'hr.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'hr.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'hr.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'hr.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'manufacturing.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'manufacturing.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'manufacturing.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'manufacturing.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- 2. organization_public_profiles — analytics/SEO columns
--    (source: 20260730000004_add_analytics_seo_fields.sql; consumed by
--    settings/organization/actions.ts, [slug]/layout.tsx, [slug]/page.tsx)
-- ─────────────────────────────────────────────
ALTER TABLE public.organization_public_profiles
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

COMMENT ON COLUMN public.organization_public_profiles.ga_measurement_id IS 'Google Analytics 4 measurement id for the public storefront';
COMMENT ON COLUMN public.organization_public_profiles.meta_pixel_id IS 'Meta (Facebook) pixel id for the public storefront';
COMMENT ON COLUMN public.organization_public_profiles.meta_title IS 'SEO <title> override for the public storefront';
COMMENT ON COLUMN public.organization_public_profiles.meta_description IS 'SEO meta description override for the public storefront';
COMMENT ON COLUMN public.organization_public_profiles.og_image_url IS 'Open Graph share image for the public storefront';

-- ─────────────────────────────────────────────
-- 3. increment_smtp_count — restore the p_config_id signature the app
--    calls (src/lib/email.ts:124 uses rpc('increment_smtp_count',
--    { p_config_id })). CREATE OR REPLACE cannot rename an input
--    parameter, so drop the old (config_id) form first — identical
--    approach to the 20260810180000 cron param rename.
--    Definition matches 20260622000002_fix_security_definer_functions
--    (SECURITY DEFINER, empty search_path, authenticated-only EXECUTE).
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.increment_smtp_count(uuid);

CREATE OR REPLACE FUNCTION public.increment_smtp_count(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.smtp_configs
  SET daily_count = daily_count + 1, updated_at = now()
  WHERE id = p_config_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_smtp_count(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_smtp_count(UUID) TO authenticated;
