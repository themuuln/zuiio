# Agent Gateway — Production Checklist

## Deployment Status (2026-08-25)

- ✅ Live at `https://agent.zuiiotech.com` (Vercel project `agent-gateway`; health, FB webhook verify, and token-verified `/api/facebook/start` all probed OK 2026-08-25)
- ✅ Region: Singapore (`sin1`)
- ✅ Environment variables set on Vercel (see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the full list)
- ✅ Telegram webhook registered with `@zuiio_bot`
- ✅ SSO protection disabled (public webhook endpoint)
- ✅ Core DB tables exist: `telegram_links`, `one_time_tokens`, `agent_sessions`
- ✅ **Crons registered in `vercel.json`** (all protected by `CRON_SECRET` via `Authorization: Bearer`):
  - `cleanup-sessions` — daily 03:00 UTC (expired sessions + stale handoff sweep)
  - `resume-flows` — every 5 minutes
  - `briefing` — daily 08:00 UTC
  - `reminders` — every 5 minutes
  - `drain-queue` — every 5 minutes
  - `re-embed` — hourly
- ✅ **Auth gates in place**:
  - Link APIs (`/api/link/generate`, `/api/link/code`) require `x-api-key: <AGENT_GATEWAY_API_SECRET>` (shared with Zer/Tolom; fail-closed)
  - Dashboard (`/dashboard/*`, `/api/dashboard/*`) gated by `DASHBOARD_SECRET` via middleware + `/api/dashboard/login`/`logout`
  - Link page (`/link`) verifies `?token=` via HMAC `verifyCompactToken`
- ✅ `/api/test/stream-draft` is dev-only (returns 404 outside `NODE_ENV=development`)
- ✅ All gateway migrations applied to the shared Supabase project (`channel_connections`, `agent_knowledge_sources`, `agent_sessions` verified live 2026-08-07 — the old "not applied" note was stale; see GAPS.md)
- ⚠️ OpenAI fallback disabled (no key) — DeepSeek OpenCodeGo primary

## Prerequisites

- [x] Valid **OpenCodeGo API key** (`OPENCODE_API_KEY` in `.env.local`)
- [x] Production Telegram bot created via [@BotFather](https://t.me/BotFather) — `@zuiio_bot`
- [x] Deployed to Vercel with `--archive=tgz` from monorepo root
- [ ] OpenAI API key (optional — fallback provider disabled when absent)
- [ ] Groq API key (optional — voice STT disabled when absent)
- [x] Zer/gateway migrations applied (see above)

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_BOT_USERNAME=zuiio_bot
TELEGRAM_WEBHOOK_SECRET=<random-32-char-string>
TOKEN_SIGNING_SECRET=<random-32-char-string>

# LLM Providers
OPENCODE_API_KEY=sk-...
OPENAI_API_KEY=sk-...
OPENAI_FALLBACK_MODEL=gpt-4o-mini

# API Auth & Dashboard
AGENT_GATEWAY_API_SECRET=<random-32-char-string>   # x-api-key for /api/link/* (shared with Zer/Tolom)
DASHBOARD_SECRET=<random-32-char-string>           # /dashboard gate
CRON_SECRET=<random-32-char-string>                # Bearer auth for /api/cron/*

# Optional — Voice STT
GROQ_API_KEY=gsk_...

# Optional — WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

# Optional — Custom bot domain
AGENT_GATEWAY_URL=https://gateway.yourdomain.com
```

## Database Migrations

Run in order on your Supabase project:

```bash
cd supabase
supabase migration up  # Applies all migrations
```

Migrations:
1. `001_agent_gateway.sql` — `telegram_links` table
2. `002_one_time_tokens.sql` — one-time link tokens
3. `003_agent_sessions.sql` — sessions, daily spend, audit log
4. `004_custom_bots.sql` — enterprise bot registry
5. `005_production_hardening.sql` — Telegram profile columns, RLS, indexes, spend RPC hardening
6. `006_knowledge_handoff_briefing.sql` — knowledge sources, handoff config/events, briefing log
7. `007_channel_connections.sql` — unified multi-channel connections + generic session/audit columns
8. `008_rls_agent_knowledge_handoff.sql` — RLS for knowledge/handoff
9. `009_agent_context_profiles.sql` — audience-scoped context profiles
Plus timestamped migrations for `pending_updates`, SMS payment verification, and the flow executor.
## Deploy

### Vercel (recommended)

1. Import the `apps/agent-gateway` directory as a Vercel project
2. Set all environment variables in Vercel dashboard
3. Deploy
4. Set Telegram webhook with the secret header enabled:
   ```bash
   curl -sS -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"https://your-domain.vercel.app/api/telegram/webhook\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\"}"
   ```

### Docker

```bash
cd apps/agent-gateway
docker build -t agent-gateway .
docker run -p 3999:3999 --env-file .env.local agent-gateway
```

## Post-Deploy Verification

```bash
# 1. Check webhook is set
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 2. Test bot responds
# Send /start to your bot on Telegram

# 3. Test linking
# Mint a token server-side (x-api-key required):
curl -X POST <GATEWAY_URL>/api/link/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $AGENT_GATEWAY_API_SECRET" \
  -d '{"orgId":"...","userId":"...","productType":"zer"}'
# Then open <GATEWAY_URL>/link?token=<minted-token> (token-verified, not raw params)

# 4. Verify dashboard gate
# Open <GATEWAY_URL>/dashboard → redirected to /dashboard/login (DASHBOARD_SECRET)

# 5. Run security audit (logs on startup)
# Check server logs for securityAudit() warnings

# 6. Verify rate limiting
# Send 25 messages rapidly — should get limited after 20
```

## Security Hardening

- [ ] `TOKEN_SIGNING_SECRET` changed from dev default
- [ ] `TELEGRAM_WEBHOOK_SECRET` changed from dev default
- [ ] API keys are valid, not placeholders
- [ ] Supabase RLS enabled on `telegram_links`, `one_time_tokens`, `agent_sessions`, `agent_daily_spend`, `agent_audit_log`, `custom_bots`
- [ ] `telegram_links_select` policy exists so Zer settings can show linked status
- [ ] Rate limiting enabled (20 req/min per org)
- [ ] Daily spend cap: 500K (soft) / 1M (hard) tokens per org

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Telegram Bot   │────▶│  Agent Gateway   │────▶│  DeepSeek    │
│  @zuiio_bot     │     │  (Next.js 16)    │     │  (LLM)       │
└─────────────────┘     │                  │     └──────────────┘
                        │  ┌────────────┐  │
                        │  │ Agent Loop │  │     ┌──────────────┐
                        │  │ + Tools    │──│────▶│  Supabase    │
                        │  └────────────┘  │     │  (Tolom/Zer) │
                        │                  │     └──────────────┘
                        │  Mode A: shared  │
                        │  Mode B: custom  │
                        └──────────────────┘
```

## Mode A vs Mode B

| Feature | Mode A (Shared) | Mode B (Custom) |
|---------|-----------------|-----------------|
| Bot | `@zuiio_bot` | Enterprise bot |
| Linking | QR code `/start` | Pre-mapped via `custom_bots` table |
| Webhook | `/api/telegram/webhook` | `/api/telegram/webhook/<botKey>` |
| Multi-org | `/switch` command | N/A (one bot = one org) |
| Audience | `internal` (SSO-linked staff) | `customer` by default (read from `channel_connections.audience`, explicitly configurable to `internal`) |

## Monitoring

- **Audit log**: `agent_audit_log` table — every tool call with timing
- **Daily spend**: `agent_daily_spend` table — tokens per org per day
- **Sessions**: `agent_sessions` table — conversation history per user
- **Errors**: Check Sentry / Vercel logs for `[capture] agent-gateway:*` entries

## Capacity Planning

- DeepSeek Flash: ~$0.14/1M input tokens, ~$0.28/1M output tokens
- Daily soft cap: 500K tokens per org (~$0.14-0.28/day)
- Rate limit: 20 messages/min per org
- Concurrent users: limited by Vercel plan (hobby: 10 concurrent requests)
