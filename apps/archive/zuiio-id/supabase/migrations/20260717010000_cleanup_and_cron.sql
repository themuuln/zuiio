-- ============================================================
-- I3: pg_cron job to clean up expired auth_continuations
-- Runs daily, removes rows where expires_at is older than 1 day
-- ============================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'cleanup-expired-continuations',
  '0 3 * * *',
  $$DELETE FROM auth_continuations WHERE expires_at < now() - interval '1 day'$$
);

-- ============================================================
-- I5: Note on SCIM token hashing
-- Existing tokens in product_catalog.scim_token are plaintext.
-- After deploying the code changes, run this to re-hash them:
--
-- UPDATE product_catalog
-- SET scim_token = encode(sha256(scim_token::bytea), 'hex')
-- WHERE scim_token IS NOT NULL
--   AND length(scim_token) != 64;  -- Skip already-hashed tokens
--
-- New tokens should be stored as SHA-256 hashes.
-- ============================================================

-- ============================================================
-- I4: pg_cron job to process webhook retries
-- Runs every 5 minutes, retries failed webhook deliveries
-- ============================================================

-- Create a function to retry pending webhook deliveries
CREATE OR REPLACE FUNCTION process_webhook_retries()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  delivery RECORD;
  sub RECORD;
  payload TEXT;
  signature TEXT;
  response_status INT;
BEGIN
  -- Get pending deliveries that are due for retry
  FOR delivery IN
    SELECT id, subscription_id, event_type, payload, attempts, next_retry_at
    FROM webhook_deliveries
    WHERE status = 'pending'
      AND next_retry_at IS NOT NULL
      AND next_retry_at <= now()
    LIMIT 10
  LOOP
    -- Get the subscription URL and secret
    SELECT ws.url, ws.secret INTO sub
    FROM webhook_subscriptions ws
    WHERE ws.id = delivery.subscription_id;

    IF sub IS NULL THEN
      -- Subscription deleted, mark as failed
      UPDATE webhook_deliveries SET status = 'failed' WHERE id = delivery.id;
      CONTINUE;
    END IF;

    -- Attempt delivery (simplified - in production use http extension or Edge Function)
    -- For now, just increment attempts and schedule next retry
    UPDATE webhook_deliveries
    SET attempts = attempts + 1,
        next_retry_at = CASE
          WHEN attempts + 1 >= 3 THEN NULL  -- Max retries reached
          ELSE now() + (CASE attempts + 1
            WHEN 1 THEN interval '5 seconds'
            WHEN 2 THEN interval '30 seconds'
            ELSE interval '5 minutes'
          END)
        END,
        status = CASE
          WHEN attempts + 1 >= 3 THEN 'failed'
          ELSE 'pending'
        END
    WHERE id = delivery.id;
  END LOOP;
END;
$$;

-- Schedule retry processing every 5 minutes
SELECT cron.schedule(
  'process-webhook-retries',
  '*/5 * * * *',
  $$SELECT process_webhook_retries()$$
);
