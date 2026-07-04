# Agent Gateway — Production Checklist

## Prerequisites

- [ ] Valid **DeepSeek API key** (`DEEPSEEK_API_KEY` in `.env.local`)
- [ ] Valid **OpenAI API key** (`OPENAI_API_KEY` in `.env.local`) for fallback
- [ ] Valid **Groq API key** (`GROQ_API_KEY` in `.env.local`) for voice STT
- [ ] Production Telegram bot created via [@BotFather](https://t.me/BotFather)
- [ ] Supabase project with all migrations applied
- [ ] Domain with HTTPS (required by Telegram webhooks)

## Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_WEBHOOK_SECRET=<random-32-char-string>
TOKEN_SIGNING_SECRET=<random-32-char-string>

# LLM Providers
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat          # or deepseek-v4-flash
OPENAI_API_KEY=sk-...
OPENAI_FALLBACK_MODEL=gpt-4o-mini

# Optional — Voice STT
GROQ_API_KEY=gsk_...

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

## Deploy

### Vercel (recommended)

1. Import the `apps/agent-gateway` directory as a Vercel project
2. Set all environment variables in Vercel dashboard
3. Deploy
4. Set Telegram webhook: `POST https://api.telegram.org/bot<TOKEN>/setWebhook` with `{"url":"https://your-domain.vercel.app/api/telegram/webhook"}`

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
# Open <GATEWAY_URL>/link?orgId=...&userId=...&productType=zer

# 4. Run security audit (logs on startup)
# Check server logs for securityAudit() warnings

# 5. Verify rate limiting
# Send 25 messages rapidly — should get limited after 20
```

## Security Hardening

- [ ] `TOKEN_SIGNING_SECRET` changed from dev default
- [ ] `TELEGRAM_WEBHOOK_SECRET` changed from dev default
- [ ] API keys are valid, not placeholders
- [ ] Supabase RLS policies reviewed for `agent_sessions`, `agent_daily_spend`, `agent_audit_log`
- [ ] CORS restricted to Telegram IPs (91.108.4.0/22, 149.154.160.0/20)
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
|---------|----------------|-----------------|
| Bot | `@zuiio_bot` | Enterprise bot |
| Linking | QR code `/start` | Pre-mapped via `custom_bots` table |
| Webhook | `/api/telegram/webhook` | `/api/telegram/webhook/<botKey>` |
| Multi-org | `/switch` command | N/A (one bot = one org) |

## Monitoring

- **Audit log**: `agent_audit_log` table — every tool call with timing
- **Daily spend**: `agent_daily_spend` table — tokens per org per day
- **Sessions**: `agent_sessions` table — conversation history per user
- **Errors**: Check Sentry / Vercel logs for `Agent error:` console logs

## Capacity Planning

- DeepSeek Flash: ~$0.14/1M input tokens, ~$0.28/1M output tokens
- Daily soft cap: 500K tokens per org (~$0.14-0.28/day)
- Rate limit: 20 messages/min per org
- Concurrent users: limited by Vercel plan (hobby: 10 concurrent requests)
