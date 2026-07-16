-- Pending updates queue for Cloudflare Worker webhook proxy.
-- Stores Telegram updates during MacBook downtime, drained on startup.

CREATE TABLE pending_updates (
  id BIGSERIAL PRIMARY KEY,
  update_id BIGINT,
  raw_json JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient queue draining (only unprocessed, oldest first)
CREATE INDEX idx_pending_updates_unprocessed
  ON pending_updates (created_at)
  WHERE processed = FALSE;

-- Unique constraint to prevent duplicate processing
CREATE UNIQUE INDEX idx_pending_updates_update_id
  ON pending_updates (update_id)
  WHERE update_id IS NOT NULL;

-- RLS: only service role can access
ALTER TABLE pending_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON pending_updates
  FOR ALL
  USING (auth.role() = 'service_role');
