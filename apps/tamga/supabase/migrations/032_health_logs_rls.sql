-- ============================================================
-- Health Logs RLS Policies — INSERT, UPDATE, DELETE
-- Version: 32 (2026-06-20)
--
-- The original health_logs table only has a SELECT policy.
-- These policies allow authenticated users to create, update,
-- and delete health entries via the web dashboard (and any
-- anon-key SSR client).
-- ============================================================

-- ── INSERT ──────────────────────────────────────────────────────
-- Horse owners can create health logs for their own horses.
-- Also allows co-owners (via co_ownerships table).
CREATE POLICY "health_logs_insert_owner"
  ON health_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
    OR horse_id IN (
      SELECT co.horse_id FROM co_ownerships co WHERE co.owner_id = auth.uid()
    )
  );

-- ── UPDATE ──────────────────────────────────────────────────────
-- Horse owners can update health logs for their own horses.
CREATE POLICY "health_logs_update_owner"
  ON health_logs
  FOR UPDATE
  TO authenticated
  USING (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
    OR horse_id IN (
      SELECT co.horse_id FROM co_ownerships co WHERE co.owner_id = auth.uid()
    )
  );

-- ── DELETE ──────────────────────────────────────────────────────
-- Horse owners can delete health logs for their own horses.
CREATE POLICY "health_logs_delete_owner"
  ON health_logs
  FOR DELETE
  TO authenticated
  USING (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
    OR horse_id IN (
      SELECT co.horse_id FROM co_ownerships co WHERE co.owner_id = auth.uid()
    )
  );
