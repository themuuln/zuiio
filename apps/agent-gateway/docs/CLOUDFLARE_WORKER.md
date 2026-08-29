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

## Codex subscription proxy

The dedicated `agent-gateway-codex` Worker exposes an OpenAI-compatible Codex
proxy at `/codex/v1`. It uses the ChatGPT OAuth quota. This is an unofficial
private Codex endpoint. Keep the proxy key private and do not expose it without
authentication.

### Deploy

Create the KV namespace once, capture its ID, and bind it in `wrangler-codex.jsonc`. Never commit `.dev.vars`.

```bash
cd cloudflare-worker
# Create (only once per Cloudflare account) — note the returned `id`
pnpm dlx wrangler kv namespace create CODEX_KV --config wrangler-codex.jsonc
# → { "id": "abc123..." }  — copy this id into wrangler-codex.jsonc → kv_namespaces[0].id
# Then set secrets (all scoped to the Codex config)
pnpm dlx wrangler secret put CODEX_REFRESH_TOKEN --config wrangler-codex.jsonc
pnpm dlx wrangler secret put CODEX_ACCOUNT_ID --config wrangler-codex.jsonc
pnpm dlx wrangler secret put CODEX_CLIENT_ID --config wrangler-codex.jsonc
pnpm dlx wrangler secret put CODEX_PROXY_API_KEY --config wrangler-codex.jsonc
pnpm dlx wrangler deploy --config wrangler-codex.jsonc
```

If the `1afd09e03d914220bc55f247551b9f1a` namespace already exists in your account, skip the `create` step.

### Agent Gateway configuration

Set the gateway's OpenAI fallback to the Worker URL:

```dotenv
OPENAI_API_KEY=<same value as CODEX_PROXY_API_KEY>
OPENAI_BASE_URL=https://agent-gateway-codex.zerone-offical.workers.dev/codex/v1
OPENAI_FALLBACK_MODEL=gpt-5.6-luna
```

The gateway calls `/chat/completions`; the Worker converts it to Codex
Responses SSE and converts the output back to OpenAI-compatible SSE.
