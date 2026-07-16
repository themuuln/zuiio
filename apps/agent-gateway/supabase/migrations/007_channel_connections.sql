-- 007_channel_connections.sql
-- Multi-channel support: unified channel_connections table
-- Replaces telegram_links + custom_bots with channel-agnostic design

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. New table: channel_connections
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS channel_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel identification
  channel           text NOT NULL CHECK (channel IN ('telegram', 'messenger', 'instagram', 'whatsapp')),
  channel_user_id   text NOT NULL,        -- PSID, IGSID, telegram user_id, phone number
  channel_chat_id   text NOT NULL,        -- page_id, telegram chat_id, phone number

  -- Facebook/Instagram specific (nullable for Telegram/WhatsApp)
  page_id           text,                 -- FB/IG page ID
  page_name         text,                 -- display name
  page_access_token text,                 -- encrypted page access token
  token_expires_at  timestamptz,          -- token expiry (null for system user tokens)

  -- Product + user mapping
  product_type      text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  user_id           text,                 -- Zuiio user_id (for Mode A linking)
  bot_key           text,                 -- custom bot key (for Mode B)

  -- Status + metadata
  is_active         boolean DEFAULT true,
  webhook_subscribed_at timestamptz,      -- when webhook was subscribed
  last_user_message_at timestamptz,       -- for 24h window tracking
  metadata          jsonb DEFAULT '{}',   -- channel-specific data

  -- Timestamps
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  -- Uniqueness: one active connection per (org, channel, chat, user)
  UNIQUE(organization_id, channel, channel_chat_id, channel_user_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_channel_connections_org
  ON channel_connections(organization_id);

CREATE INDEX IF NOT EXISTS idx_channel_connections_page
  ON channel_connections(page_id) WHERE page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_connections_active_lookup
  ON channel_connections(channel, channel_chat_id, channel_user_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_channel_connections_bot_key
  ON channel_connections(bot_key) WHERE bot_key IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Add generic columns to agent_sessions
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS channel text DEFAULT 'telegram';
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS channel_chat_id text;
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS channel_user_id text;

-- Backfill from existing telegram columns
UPDATE agent_sessions SET
  channel_chat_id = telegram_chat_id::text,
  channel_user_id = telegram_user_id::text
WHERE channel_chat_id IS NULL;

-- Update unique constraint to use generic columns
-- (Drop old constraint, add new one)
ALTER TABLE agent_sessions DROP CONSTRAINT IF EXISTS agent_sessions_organization_id_telegram_chat_id_telegram_user_id_key;
ALTER TABLE agent_sessions ADD CONSTRAINT agent_sessions_org_channel_chat_user_unique
  UNIQUE(organization_id, channel, channel_chat_id, channel_user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Add generic columns to agent_audit_log
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE agent_audit_log ADD COLUMN IF NOT EXISTS channel text DEFAULT 'telegram';
ALTER TABLE agent_audit_log ADD COLUMN IF NOT EXISTS channel_chat_id text;
ALTER TABLE agent_audit_log ADD COLUMN IF NOT EXISTS channel_user_id text;

-- Backfill from existing columns
UPDATE agent_audit_log SET
  channel_chat_id = chat_id::text,
  channel_user_id = telegram_user_id::text
WHERE channel_chat_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Migrate existing telegram_links data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO channel_connections (
  organization_id,
  channel,
  channel_user_id,
  channel_chat_id,
  product_type,
  user_id,
  is_active,
  created_at,
  updated_at
)
SELECT
  organization_id,
  'telegram',
  telegram_user_id::text,
  telegram_chat_id::text,
  product_type,
  user_id,
  is_active,
  linked_at,
  last_active_at
FROM telegram_links
ON CONFLICT (organization_id, channel, channel_chat_id, channel_user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Migrate existing custom_bots data (Mode B)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Custom bots are org-level, not per-user. Store as metadata for webhook routing.
-- The bot_key is used to resolve org from incoming webhook messages.
INSERT INTO channel_connections (
  organization_id,
  channel,
  channel_user_id,
  channel_chat_id,
  product_type,
  bot_key,
  page_name,
  is_active,
  created_at,
  updated_at
)
SELECT
  organization_id,
  'telegram',
  'bot_' || bot_username,    -- synthetic user_id for bot
  bot_username,              -- chat_id = bot username
  product_type,
  bot_token_hash,            -- bot_key = token hash for webhook routing
  bot_username,
  is_active,
  created_at,
  updated_at
FROM custom_bots
ON CONFLICT (organization_id, channel, channel_chat_id, channel_user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Helper function: resolve org from channel connection
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION resolve_org_from_channel(
  p_channel text,
  p_channel_chat_id text,
  p_channel_user_id text
) RETURNS TABLE(
  org_id uuid,
  product_type text,
  page_access_token text,
  page_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.organization_id,
    cc.product_type,
    cc.page_access_token,
    cc.page_id
  FROM channel_connections cc
  WHERE cc.channel = p_channel
    AND cc.channel_chat_id = p_channel_chat_id
    AND cc.channel_user_id = p_channel_user_id
    AND cc.is_active = true
  ORDER BY cc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Helper function: resolve org from page_id (for Meta webhooks)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION resolve_org_from_page(
  p_page_id text
) RETURNS TABLE(
  org_id uuid,
  product_type text,
  channel text,
  page_access_token text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.organization_id,
    cc.product_type,
    cc.channel,
    cc.page_access_token
  FROM channel_connections cc
  WHERE cc.page_id = p_page_id
    AND cc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. Updated_at trigger
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_channel_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channel_connections_updated_at ON channel_connections;
CREATE TRIGGER trigger_channel_connections_updated_at
  BEFORE UPDATE ON channel_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_connections_updated_at();
