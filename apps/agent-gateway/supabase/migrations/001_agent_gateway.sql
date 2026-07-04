-- 001_agent_gateway.sql
-- Agent tables for the zuiio Agent Gateway

CREATE TABLE IF NOT EXISTS telegram_links (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL,
  user_id           text NOT NULL,
  telegram_chat_id  bigint NOT NULL,
  telegram_user_id  bigint NOT NULL,
  product_type      text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  is_active         boolean DEFAULT true,
  linked_at         timestamptz DEFAULT now(),
  last_active_at    timestamptz DEFAULT now(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_chat_user
  ON telegram_links(telegram_chat_id, telegram_user_id);
