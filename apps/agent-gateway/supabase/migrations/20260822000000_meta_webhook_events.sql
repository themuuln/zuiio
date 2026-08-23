-- meta_webhook_events: delivery-level idempotency for Meta webhooks.
--
-- Meta retries webhook deliveries until they are acked, so the same signed
-- payload can arrive more than once. Without dedup every replay re-runs the
-- agent pipeline: duplicate customer replies, double LLM spend, double budget.
--
-- src/app/api/facebook/webhook/route.ts claims each messaging event
-- insert-first into this table; a unique (channel, event_id) conflict means
-- "already processed" and the event is skipped. Non-conflict insert errors are
-- logged and treated as unseen so a transient DB hiccup never drops a message.

CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('messenger', 'instagram')),
  event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, event_id)
);

COMMENT ON TABLE public.meta_webhook_events IS 'Meta webhook delivery idempotency - insert-first claim; unique conflict = replay';

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_created_at
  ON public.meta_webhook_events(created_at);

ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY meta_webhook_events_service ON public.meta_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
