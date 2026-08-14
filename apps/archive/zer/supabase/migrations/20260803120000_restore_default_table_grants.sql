-- =============================================
-- Restore Supabase-standard table grants
--
-- Supabase platform provisioning grants authenticated/anon CRUD on all
-- tables by default (row-level RLS policies gate what each role can
-- actually touch). A local environment can lose these defaults (db reset
-- from a non-standard baseline, manual hardening), which silently breaks
-- every RLS-scoped query with "permission denied for table X".
--
-- This restores the platform-default table grants and is a no-op wherever
-- the defaults are already present (idempotent). It does NOT touch function
-- execution grants — those are intentionally revoked per-function in the
-- hardening migrations (20260802062427, 20260802062737, ...).
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
