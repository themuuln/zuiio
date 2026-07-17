-- ============================================================
-- Organizer API — tiered API keys + usage tracking
-- Version: 20250716170000
--
-- Tables:
--   organizer_api_keys — SHA-256 hashed keys with tier-based access
--   api_usage_log      — per-request usage tracking + rate limiting
--
-- Extends the base api_keys table (032) with:
--   - user_id (UUID FK to auth.users) instead of text organizer_id
--   - tier field (breeder=read-only, stable=full access)
--   - rate_limit_per_minute for sliding window rate limiting
--   - permissions array for granular access control
-- ============================================================

-- ── 1. Organizer API keys ────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizer_api_keys (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  key_hash                TEXT NOT NULL UNIQUE,
  key_prefix              TEXT NOT NULL,  -- first 8 chars for display
  tier                    TEXT NOT NULL DEFAULT 'breeder'
                            CHECK (tier IN ('breeder', 'stable')),
  permissions             TEXT[] DEFAULT '{read_events}',
  rate_limit_per_minute   INTEGER NOT NULL DEFAULT 30,
  is_active               BOOLEAN DEFAULT true,
  last_used_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at              TIMESTAMPTZ
);

-- ── 2. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_oak_user
  ON organizer_api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_oak_hash
  ON organizer_api_keys(key_hash)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_oak_expires
  ON organizer_api_keys(expires_at);

-- ── 3. API usage log ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id      UUID NOT NULL REFERENCES organizer_api_keys(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  method          TEXT NOT NULL,
  status_code     INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key
  ON api_usage_log(api_key_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_created
  ON api_usage_log(created_at);

-- ── 4. RLS policies ─────────────────────────────────────────────

ALTER TABLE organizer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own API keys
CREATE POLICY "oak_select_own"
  ON organizer_api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "oak_insert_own"
  ON organizer_api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "oak_update_own"
  ON organizer_api_keys FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "oak_delete_own"
  ON organizer_api_keys FOR DELETE
  USING (user_id = auth.uid());

-- Users can view their own API usage
CREATE POLICY "api_usage_select_own"
  ON api_usage_log FOR SELECT
  USING (
    api_key_id IN (
      SELECT id FROM organizer_api_keys WHERE user_id = auth.uid()
    )
  );
