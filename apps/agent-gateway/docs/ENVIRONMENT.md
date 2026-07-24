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

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID | _(none)_ |
| `FB_APP_SECRET` | Facebook App Secret | _(none)_ |
| `FB_VERIFY_TOKEN` | Facebook webhook verify token | _(none)_ |

### Node.js

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment (`production` / `development`) | `development` |

## Security Notes

- `TOKEN_SIGNING_SECRET` — In production, must be ≥16 characters and not a known default. The `securityAudit()` function checks for weak values at startup.
- `TELEGRAM_WEBHOOK_SECRET` — Must match the `secret_token` sent in `setWebhook` calls. Prevents unauthorized webhook calls.
- `SUPABASE_SERVICE_ROLE_KEY` — Bypasses Row Level Security. Never expose to client-side code.
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
