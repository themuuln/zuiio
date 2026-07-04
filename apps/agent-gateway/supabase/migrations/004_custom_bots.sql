-- 004_custom_bots.sql
-- Mode B — custom bot per organization (enterprise white-label)

CREATE TABLE IF NOT EXISTS custom_bots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bot_token_hash  text NOT NULL UNIQUE,
  bot_username    text NOT NULL,
  product_type    text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  is_active       boolean DEFAULT true,
  webhook_set_at  timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_bots_org
  ON custom_bots(organization_id);

CREATE INDEX IF NOT EXISTS idx_custom_bots_token_hash
  ON custom_bots(bot_token_hash);
