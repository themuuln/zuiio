-- Keep one active connection per channel identity across organizations.
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY channel, channel_chat_id, channel_user_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM channel_connections
  WHERE is_active = true
)
UPDATE channel_connections AS cc
SET is_active = false, updated_at = now()
FROM ranked
WHERE cc.id = ranked.id AND ranked.rn > 1;

ALTER TABLE channel_connections
  DROP CONSTRAINT IF EXISTS channel_connections_organization_id_channel_channel_chat_id_channel_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS ux_channel_connections_active
  ON channel_connections (channel, channel_chat_id, channel_user_id)
  WHERE is_active = true;
