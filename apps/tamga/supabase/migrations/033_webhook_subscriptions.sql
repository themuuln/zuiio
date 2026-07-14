-- ============================================================
-- Webhook Subscriptions — external event notifications
-- Version: 33 (2026-06-21)
--
-- Tables:
--   webhook_subscriptions  — webhook URLs subscribed to events
--
-- RLS ensures:
--   - Authenticated users can manage their webhook subscriptions
-- ============================================================

-- ── 1. Create webhook_subscriptions table ───────────────────────

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id    UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  events        TEXT[] NOT NULL,  -- e.g., {'race.entry.created', 'race.result.posted'}
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_api_key
  ON webhook_subscriptions(api_key_id);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active
  ON webhook_subscriptions(is_active);

-- ── 3. RLS policies ─────────────────────────────────────────────

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read webhook subscriptions
CREATE POLICY "webhook_subscriptions_select_authenticated"
  ON webhook_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert webhook subscriptions
CREATE POLICY "webhook_subscriptions_insert_authenticated"
  ON webhook_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update webhook subscriptions
CREATE POLICY "webhook_subscriptions_update_authenticated"
  ON webhook_subscriptions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete webhook subscriptions
CREATE POLICY "webhook_subscriptions_delete_authenticated"
  ON webhook_subscriptions
  FOR DELETE
  TO authenticated
  USING (true);
