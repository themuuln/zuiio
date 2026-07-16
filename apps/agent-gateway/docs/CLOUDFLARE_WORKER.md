# Cloudflare Worker — Webhook Proxy

This Worker sits between Telegram and your MacBook, ensuring zero message loss during reboots.

## How It Works

1. Telegram sends webhook to the Worker (always on Cloudflare edge)
2. Worker stores the raw update in Supabase `pending_updates` table
3. Worker forwards to your MacBook via Cloudflare Tunnel
4. If MacBook is down, message waits in Supabase
5. On startup, MacBook drains the queue

## Setup

### 1. Create Supabase table

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE pending_updates (
  id BIGSERIAL PRIMARY KEY,
  raw_json JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient queue draining
CREATE INDEX idx_pending_updates_unprocessed
  ON pending_updates (created_at)
  WHERE processed = FALSE;
```

### 2. Deploy the Worker

```bash
cd cloudflare-worker
npm install
npx wrangler deploy
```

### 3. Set environment variables

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put MACBOOK_TUNNEL_URL
```

### 4. Update Telegram webhook

Point your Telegram webhook to the Worker URL instead of your MacBook:

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://agent-gateway-worker.YOUR_SUBDOMAIN.workers.dev/webhook"
```

### 5. MacBook startup — drain queue

Add this to your app startup (e.g., in `src/app/api/cron/drain-queue/route.ts`):

The MacBook periodically checks for unprocessed updates and processes them.
