-- ============================================================
-- Fix recursive RLS policies (PostgreSQL error 42P17)
-- Version: 34 (2026-06-20)
--
-- Problem:
--   There is a circular policy chain:
--     horses  SELECT policy → subquery on co_ownerships
--     co_ownerships SELECT policy → subquery on horses
--   This causes PostgreSQL error 42P17 (infinite recursion)
--   when an authenticated user queries the horses table,
--   blocking the web dashboard from retrieving data.
--
-- Fix:
--   1. co_ownerships SELECT policy: Use direct owner_id = auth.uid()
--      check instead of a subquery on horses. This breaks the cycle
--      because it no longer references the horses table.
--   2. horses SELECT policy: Keep the co_ownerships subquery, but
--      since co_ownerships SELECT no longer queries horses, the
--      recursion chain is broken.
--
--   Other policies (health_logs, pedigree_links, etc.) that query
--   co_ownerships via WHERE owner_id = auth.uid() are safe: the new
--   co_ownerships policy matches this check directly with no
--   subquery back to horses.
-- ============================================================

-- ── Drop problematic policies ──────────────────────────────
DROP POLICY IF EXISTS "Horses select for owner or co-owner" ON horses;
DROP POLICY IF EXISTS "Co-ownership select for owner or co-owner" ON co_ownerships;
DROP POLICY IF EXISTS "Co-ownership select for owner" ON co_ownerships;

-- ── Recreate horses SELECT policy ──────────────────────────
-- Allows the owner to see their own horses, and co-owners to
-- see horses they are listed as co-owner of via co_ownerships.
-- No recursion because co_ownerships SELECT policy no longer
-- queries horses.
CREATE POLICY "Horses select for owner or co-owner"
  ON horses FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT horse_id FROM co_ownerships WHERE owner_id = auth.uid()
    )
  );

-- ── Recreate co_ownerships SELECT policy ──────────────────
-- Uses a direct owner_id = auth.uid() check instead of a
-- subquery on horses. This breaks the circular RLS dependency.
CREATE POLICY "Co-ownership select for owner or co-owner"
  ON co_ownerships FOR SELECT
  USING (owner_id = auth.uid());
