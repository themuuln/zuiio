# Agent Gateway Infrastructure

Multi-Mac server setup with Cloudflare Tunnels.

## Architecture

```
                    ┌─────────────────┐
                    │  Telegram API   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloudflare     │
                    │  Worker         │
                    │  (webhook proxy)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐             ┌────────▼──────┐
     │  MacBook Home │             │  iMac Work    │
     │  (Primary)    │             │  (Backup)     │
     │  CF Tunnel    │             │  CF Tunnel    │
     │  App running  │             │  App running  │
     └───────────────┘             └───────────────┘
```

## Components

| Component | Role | Cost |
|---|---|---|
| MacBook (home) | Primary server | $0 |
| iMac (work) | Backup server | $0 |
| Cloudflare Tunnel | Secure access | Free |
| Cloudflare Worker | Webhook proxy + queue | Free |
| Supabase | Message queue + DB | Free/Pro |

## Quick Start

### 1. Setup MacBook
```bash
cd infrastructure
./setup-macbook.sh
```

### 2. Setup iMac
```bash
cd infrastructure
./setup-imac.sh
```

### 3. Deploy Cloudflare Worker
```bash
cd cloudflare-worker
npx wrangler deploy
```

### 4. Point Telegram webhook to Worker
```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://agent-gateway-worker.YOUR_SUB.workers.dev/webhook"
```

## How It Works

1. Telegram sends webhook to Cloudflare Worker (always on)
2. Worker stores update in Supabase `pending_updates`
3. Worker forwards to MacBook via tunnel
4. If MacBook is down, message waits in Supabase
5. On startup, MacBook drains the queue

## Files

| File | Purpose |
|---|---|
| `setup-macbook.sh` | Setup MacBook as primary server |
| `setup-imac.sh` | Setup iMac as backup server |
| `Caddyfile` | Optional: Caddy config for load balancing |
| `setup-vps.sh` | Optional: Hetzner VPS setup |
