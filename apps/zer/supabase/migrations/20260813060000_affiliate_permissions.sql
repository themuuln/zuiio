-- =============================================
-- Affiliate program permissions (2026-08-13, G-AFFILIATE)
--
-- Standalone migration: ALTER TYPE ... ADD VALUE cannot share a
-- transaction with statements that USE the new values (SQLSTATE 55P04).
-- The affiliates.* permission family is defined here and consumed by
-- 20260813070000_affiliate_program.sql (tables, RLS, RPCs, role backfill).
-- =============================================

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'affiliates.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'affiliates.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'affiliates.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'affiliates.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
