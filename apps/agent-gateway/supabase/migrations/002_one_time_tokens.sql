-- 002_one_time_tokens.sql
-- One-time tokens for Telegram bot linking via QR code

CREATE TABLE IF NOT EXISTS one_time_tokens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash        text NOT NULL UNIQUE,       -- SHA-256 of raw token
  organization_id   uuid NOT NULL,
  user_id           text NOT NULL,
  product_type      text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  expires_at        timestamptz NOT NULL,        -- 15 min from creation
  used_at           timestamptz,                 -- null until consumed
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_one_time_tokens_hash ON one_time_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_org ON one_time_tokens(organization_id);
