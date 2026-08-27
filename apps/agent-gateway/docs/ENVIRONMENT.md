# Environment Variables

Complete reference for all environment variables used by Agent Gateway.

## Required Variables

These must be set for the application to start.

### Supabase

| Variable | Description | Example |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL for Zer/gateway | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | `eyJ...` |

### LLM Provider

| Variable | Description | Example |
|---|---|---|
| `OPENCODE_API_KEY` | OpenCodeGo API key (primary provider) | `sk-...` |

### Telegram

| Variable | Description | Example |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `123456:ABC-DEF...` |
| `TELEGRAM_BOT_USERNAME` | Bot username (without @) | `zuiio_bot` |
| `TELEGRAM_WEBHOOK_SECRET` | Secret token for webhook validation (random 32+ chars) | `<random-string>` |
| `TOKEN_SIGNING_SECRET` | HMAC secret for link tokens (min 16 chars) | `<random-32-byte-string>` |
| `AGENT_GATEWAY_URL` | Public URL where webhook is accessible | `https://gateway.zuiio.com` |

### API Auth & Dashboard

These do not block startup; each gates its own surface and fails closed when unset.

| Variable | Description | Example |
|---|---|---|
| `AGENT_GATEWAY_API_SECRET` | Shared server-to-server secret. Sent as `x-api-key` by Zer/Tolom to `/api/link/generate` and `/api/link/code`. Must match the value configured in Zer/Tolom. Fail-closed: both routes return 401 when unset. | `<random-32-byte-string>` |
| `ZER_APP_URL` | Zer public server URL for the authenticated customer checkout boundary (`/api/internal/v1/checkout/orders`) | _(none — QPay chat orders disabled)_ |
| `DASHBOARD_SECRET` | Gate for the ops dashboard: `/dashboard/login` sets an HMAC cookie, middleware protects `/dashboard/*` and `/api/dashboard/*`. Fail-closed: dashboard returns 503 when unset. | `<random-32-byte-string>` |
| `CRON_SECRET` | Optional but recommended. All `/api/cron/*` endpoints (and `/api/flow/publish`) require `Authorization: Bearer <CRON_SECRET>` when set; skipped when unset. | `<random-32-byte-string>` |

## Optional Variables

### Fallback LLM Provider

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for fallback provider | _(none — fallback disabled)_ |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_FALLBACK_MODEL` | Model name for fallback | `gpt-4o-mini` |

### OpenCodeGo Configuration

| Variable | Description | Default |
|---|---|---|
| `OPENCODE_BASE_URL` | OpenCodeGo API base URL | `https://opencode.ai/zen/go/v1` |
| `OPENCODE_MODEL` | Model name | `deepseek-v4-flash` |

### Voice STT

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for Whisper voice transcription | _(none — voice disabled)_ |

### Tolom (Separate Supabase Project)

| Variable | Description | Default |
|---|---|---|
| `TOLOM_SUPABASE_URL` | Tolom's Supabase project URL | _(none — Tolom queries fail)_ |
| `TOLOM_SUPABASE_SERVICE_ROLE_KEY` | Tolom's service role key | _(none — Tolom queries fail)_ |

### Facebook Messenger

| Variable | Description | Default | Required for |
|---|---|---|---|
| `FB_APP_ID` | Facebook App ID (server-side; used in OAuth dialog + token exchange) | _(none)_ | OAuth connect, token refresh |
| `FB_APP_SECRET` | Facebook App Secret | _(none)_ | Webhook HMAC validation |
| `FB_VERIFY_TOKEN` | Facebook webhook verify token — MUST match the value entered in the Meta app dashboard webhook config | _(none)_ | Webhook subscription handshake |
| `FB_OAUTH_REDIRECT_URI` | Absolute callback URL, e.g. `https://agent.zuiiotech.com/api/facebook/callback` — MUST be added to the Meta app's Valid OAuth Redirect URIs | _(none)_ | OAuth connect |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Public App ID for the client-side FB SDK (page-select UI in `/link/select`) | _(none)_ | Page selection UI |
| `FB_GRAPH_API_VERSION` | Graph API version | `v25.0` | All Graph API calls |
| `FB_RETURN_URL_ZER` | Where the user lands after connecting a page from Zer settings (e.g. `https://app.zer.example/settings`) — server-controlled, returned by `/api/facebook/select`; no redirect when unset | _(none)_ | Post-connect UX |
| `FB_RETURN_URL_TOLOM` | Same for Tolom | _(none)_ | Post-connect UX |
| `META_TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for encrypting Facebook page access tokens at rest (wired via `20260802000000_meta_token_encryption.sql`) | _(none — derived fallback)_ | Token at-rest encryption |

> ⚠️ **Deployment audit (2026-08-06):** production (`agent-gateway` on Vercel) was missing `FB_APP_ID`, `FB_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_FACEBOOK_APP_ID`, `FB_GRAPH_API_VERSION`, and migrations 007+ were never applied to the shared Supabase project (`krrkhozadforrydffegg`). The Messenger/Instagram channel is therefore non-functional in production until env vars + migrations + a fresh deploy land. See [FACEBOOK_INSTAGRAM_PLAN.md §1.5](FACEBOOK_INSTAGRAM_PLAN.md).

### WhatsApp Cloud API

| Variable | Description | Default |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API phone number ID (channel disabled without it) | _(none — WhatsApp disabled)_ |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API access token (channel disabled without it) | _(none — WhatsApp disabled)_ |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify token for the `hub.verify_token` challenge | _(none)_ |

### Redis (optional)

| Variable | Description | Default |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for session/knowledge/tool caching | _(none — in-memory fallback)_ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | _(none — in-memory fallback)_ |

### Sentry & Debug

| Variable | Description | Default |
|---|---|---|
| `SENTRY_DSN` | Sentry DSN for error capture | _(none — capture disabled)_ |
| `DEBUG` | Set to `true` to enable structured debug logs | `false` |

### Node.js

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment (`production` / `development`) | `development` |

## Security Notes

- `TOKEN_SIGNING_SECRET` — In production, must be ≥16 characters and not a known default. The `securityAudit()` function checks for weak values at startup.
- `TELEGRAM_WEBHOOK_SECRET` — Must match the `secret_token` sent in `setWebhook` calls. Prevents unauthorized webhook calls.
- `SUPABASE_SERVICE_ROLE_KEY` — Bypasses Row Level Security. Never expose to client-side code.
- `ZER_APP_URL` and `AGENT_GATEWAY_API_SECRET` are required for customer QPay checkout. The gateway sends the shared secret only in server-to-server requests; it never reaches Messenger or Instagram.
- `QPAY_*` credentials stay in Zer. Agent Gateway must never receive or log them.
- All API keys should be stored in Vercel/Cloudflare environment variables, never committed to git.

## Validation

The `securityAudit()` function in `src/state/security.ts` checks for common misconfigurations at startup:

- Missing or placeholder API keys
- Weak `TOKEN_SIGNING_SECRET` (<16 chars or known default)
- Default `TELEGRAM_WEBHOOK_SECRET`
- Placeholder `SUPABASE_URL`

Run it manually:

```typescript
import { securityAudit } from "@/state/security";
const warnings = securityAudit();
if (warnings.length > 0) {
  console.warn("Security warnings:", warnings);
}
```

## .env.example

A template `.env.example` file is provided at the project root. Copy it to `.env.local`:

```bash
cp .env.example .env.local
```
