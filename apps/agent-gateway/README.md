# Agent Gateway

Multi-tenant AI agent gateway for Telegram, Facebook Messenger/Instagram, and WhatsApp. Connects chat channels to business data in [Zer](https://zer.mn) and [Tolom](https://tolom.mn) via LLM-powered tools with full org isolation, rate limiting, and budget controls.

## Features

- **Multi-tenant architecture** — every query is scoped to an organization; tools never leak data across tenants
- **Dual product support** — serves both Zer (retail/accounting) and Tolom (POS) from a single deployment
- **Pluggable AI providers** — DeepSeek primary with OpenAI fallback; swap providers without changing tool logic
- **Curated tool system** — domain-specific tools (sales, customers, inventory, reports) execute against Supabase with service-role privileges
- **Conversation memory** — per-user session persistence with configurable history depth
- **Rate limiting & budgets** — sliding-window rate limits and daily token spend caps per organization
- **Audit trail** — every tool call logged with timing, args, and results
- **Voice support** — Groq Whisper STT for voice messages
- **Two bot modes** — shared bot (Mode A) with QR linking, or custom bot per org (Mode B)

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Fill in your keys (see docs/ENVIRONMENT.md)
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENCODE_API_KEY, TELEGRAM_BOT_TOKEN

# Start development server
pnpm dev
```

The webhook endpoint is available at `http://localhost:3000/api/telegram/webhook`.

## Architecture

```
Telegram ──▶ Webhook ──▶ Gateway ──▶ AI Provider ──▶ Tools ──▶ Supabase
                │           │
                │           ├── Rate Limit Check
                │           ├── Budget Check
                │           ├── Session Load
                │           └── Org Resolution
                │
                └── Bot UX (commands, menu buttons)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Project Structure

```
src/
├── app/api/                     # Next.js route handlers
│   ├── telegram/webhook/        # Telegram webhook (entry point)
│   ├── facebook/webhook/        # Messenger + Instagram webhook (HMAC-validated)
│   ├── whatsapp/webhook/        # WhatsApp Cloud API webhook
│   ├── link/                    # /generate + /code (x-api-key protected)
│   ├── dashboard/               # login/logout, usage, handoffs (DASHBOARD_SECRET)
│   └── cron/                    # cleanup-sessions, resume-flows, briefing, reminders, drain-queue, re-embed
├── gateway/                     # Core gateway logic
│   ├── agent-handler.ts         # Message processing pipeline
│   ├── webhook-helpers.ts       # System prompts, tool registry & cache
│   ├── mode-a.ts                # Shared bot org resolution
│   ├── mode-b.ts                # Custom bot org resolution
│   └── types.ts                 # GatewayContext, AgentAudience, LinkRecord
├── channels/                    # Messaging adapters
│   ├── telegram.ts              # Telegram Bot API wrapper
│   ├── facebook.ts              # Messenger/Instagram adapter
│   ├── whatsapp.ts              # WhatsApp Cloud API adapter
│   └── types.ts                 # Channel interface
├── providers/                   # AI provider adapters
│   ├── opencode-go.ts           # DeepSeek via OpenCodeGo (primary)
│   ├── gpt-mini.ts              # OpenAI GPT-4o-mini fallback
│   └── types.ts                 # AiProvider, GatewayTool, AiGateway, ToolContext
├── state/                       # Request-scoped state management
│   ├── session.ts               # Conversation memory (Supabase + Redis)
│   ├── budget.ts                # Daily token spend tracking
│   ├── rate-limit.ts            # Sliding-window rate limiter
│   ├── audit.ts                 # Tool call audit logging
│   ├── security.ts              # Startup security checks
│   ├── agent-profile.ts         # Audience-scoped context profile loading
│   ├── knowledge.ts             # Audience-filtered knowledge retrieval
│   ├── handoff.ts               # Human handoff triggers + queue
│   ├── usage.ts                 # Dashboard analytics (percentiles, tool averages)
│   └── async-job.ts             # Long-running query fallback
├── lib/                         # Shared utilities
│   ├── env.ts                   # Type-safe env access
│   ├── supabase.ts              # Client factories (service, reader, Tolom)
│   ├── tokens.ts                # HMAC-signed link tokens
│   ├── api-auth.ts              # x-api-key validation (AGENT_GATEWAY_API_SECRET)
│   ├── link-code.ts             # One-time link code generation
│   ├── format-result.ts         # Write-result formatting for channels
│   └── sanitize.ts              # Input sanitization & prompt injection defense
├── runtime/                     # Runtime helpers
│   ├── confirmation.ts          # Staged-action confirm/reject store
│   └── write-gate.ts            # Write-tool confirmation gate wrapper
├── stt/                         # Speech-to-text
│   └── groq.ts                  # Groq Whisper transcription
├── middleware.ts                # Dashboard gate (DASHBOARD_SECRET)
├── bot-ux.ts                    # Bot profile & menu setup
└── components/                  # UI components (link page, page select)
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `OPENCODE_API_KEY` | ✅ | OpenCodeGo API key (primary LLM provider) |
| `OPENCODE_BASE_URL` | ❌ | OpenCodeGo base URL (default: `https://opencode.ai/zen/go/v1`) |
| `OPENCODE_MODEL` | ❌ | Model name (default: `deepseek-v4-flash`) |
| `OPENAI_API_KEY` | ❌ | OpenAI API key for fallback provider |
| `OPENAI_FALLBACK_MODEL` | ❌ | Fallback model (default: `gpt-4o-mini`) |
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram bot token from @BotFather |
| `TELEGRAM_BOT_USERNAME` | ✅ | Telegram bot username |
| `TELEGRAM_WEBHOOK_SECRET` | ✅ | Secret token for webhook validation |
| `TOKEN_SIGNING_SECRET` | ✅ | HMAC secret for link tokens (min 16 chars) |
| `AGENT_GATEWAY_URL` | ✅ | Public URL for webhook registration |
| `AGENT_GATEWAY_API_SECRET` | ✅ | Shared server-to-server secret (`x-api-key`) for `/api/link/*` (fail-closed) |
| `DASHBOARD_SECRET` | ❌ | Gate for `/dashboard` + `/api/dashboard/*` (fail-closed when unset) |
| `CRON_SECRET` | ❌ | Bearer auth for `/api/cron/*` and `/api/flow/publish` |
| `GROQ_API_KEY` | ❌ | Groq API key for voice STT |
| `TOLOM_SUPABASE_URL` | ❌ | Tolom's separate Supabase project URL |
| `TOLOM_SUPABASE_SERVICE_ROLE_KEY` | ❌ | Tolom's service role key |
| `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_VERIFY_TOKEN` | ❌ | WhatsApp Cloud API channel (disabled without) |
| `META_TOKEN_ENCRYPTION_KEY` | ❌ | AES-256-GCM key for FB page tokens (planned) |

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the full reference.

## Extending

- **Add tools** → [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md)
- **Add providers** → [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md)
- **Add channels** → [docs/ADDING_CHANNELS.md](docs/ADDING_CHANNELS.md)

## Testing

```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm test:e2e          # End-to-end tests
pnpm test:watch        # Watch mode
```

See [docs/TESTING.md](docs/TESTING.md) for test structure and conventions.

## Security

The gateway enforces multi-tenant isolation at every layer. See [docs/SECURITY.md](docs/SECURITY.md) for the full security model.

## Deployment

### Vercel

```bash
vercel deploy
```

Set the **Root Directory** to `apps/agent-gateway` in Vercel project settings.

### Cloudflare Workers

```bash
pnpm cf:deploy
```

### Register Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook", "secret_token": "<SECRET>"}'
```

## License

Private — part of the [Zuiio](https://zuiio.com) ecosystem.

