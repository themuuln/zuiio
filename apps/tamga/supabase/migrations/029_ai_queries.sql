-- ============================================================
-- AI Queries — rate-limit tracking for AI Breeding Advisor
-- Version: 29 (2026-06-18)
--
-- Tracks per-user AI queries for rate limiting:
--   free    = 5/month
--   pro     = 50/month
--   breeder = unlimited (no row inserted; 0 = unlimited)
-- ============================================================

-- ── 1. Create ai_queries table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_queries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL DEFAULT 'ai-breeding',
  model         TEXT NOT NULL DEFAULT 'deepseek-v4-flash',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for rate-limit counting
CREATE INDEX IF NOT EXISTS idx_ai_queries_user_month
  ON ai_queries(user_id, created_at);

-- ── 2. RLS policies ────────────────────────────────────────────────

ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

-- Users can read their own query history
CREATE POLICY "ai_queries_select_own"
  ON ai_queries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert (Edge Function uses service role)
CREATE POLICY "ai_queries_insert_service"
  ON ai_queries
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No update/delete policies needed (immutable after insert)
