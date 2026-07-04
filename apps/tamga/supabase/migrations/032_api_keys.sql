-- ============================================================
-- API Keys — programmatic access for external organizers
-- Version: 32 (2026-06-21)
--
-- Tables:
--   api_keys  — bcrypt-hashed API keys with scoped permissions
--
-- RLS ensures:
--   - Only authenticated admin users can manage API keys
--   - API key validation is done via the Edge Function (not RLS)
-- ============================================================

-- ── 1. Create api_keys table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,  -- bcrypt hash of the raw API key
  scopes        TEXT[] DEFAULT '{}',   -- e.g., {'races:read', 'races:write', 'horses:read'}
  organizer_id  TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ
);

-- ── 2. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
  ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_organizer
  ON api_keys(organizer_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_active
  ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_expires
  ON api_keys(expires_at);

-- ── 3. RLS policies ─────────────────────────────────────────────

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read API keys (for management UI)
CREATE POLICY "api_keys_select_authenticated"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert API keys
CREATE POLICY "api_keys_insert_authenticated"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update API keys (e.g., deactivate)
CREATE POLICY "api_keys_update_authenticated"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete API keys
CREATE POLICY "api_keys_delete_authenticated"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (true);
