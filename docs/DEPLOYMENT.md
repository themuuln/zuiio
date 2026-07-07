# Deployment

## App Targets

| App | Platform | Trigger | Notes |
|-----|----------|---------|-------|
| **zer** | Vercel | Auto-deploy from `main` | Next.js 16, Sentry |
| **tolom** | Vercel | Auto-deploy from `main` | Next.js 16, Sentry |
| **agent-gateway** | Vercel *or* Cloudflare | Auto-deploy / `wrangler deploy` | Dual-target via OpenNext |
| **website** | Vercel | Auto-deploy from `main` | Next.js 16, i18n, no backend |

All apps are in `apps/` within a pnpm workspace. Vercel detects the root via `vercel.json` (agent-gateway) or `.vercel/project.json`.

## Environment Variables

Copy `.env.example` to `.env.local` per app. Shared across zer & tolom:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SENTRY_DSN=https://...@o.../...
```

App-specific vars:

| App | Variables |
|-----|-----------|
| **zer** | `NEXT_PUBLIC_AGENT_GATEWAY_URL`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` |
| **tolom** | `AGENT_GATEWAY_URL`, `SMTP_HOST`, `SMTP_PORT` |
| **agent-gateway** | `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TOKEN_SIGNING_SECRET`, `AGENT_GATEWAY_URL` |
| **website** | _(none — static marketing site)_ |

## Supabase Projects

Two Supabase projects for data isolation:

| Project | Used By | Migrations |
|---------|---------|------------|
| **Tolom** (`fhzuolncswccxkcqzclg`) | tolom, agent-gateway | `apps/tolom/supabase/migrations/`, `apps/agent-gateway/supabase/migrations/` |
| **Zer** | zer | `apps/zer/supabase/migrations/` |

Agent-gateway connects to Tolom's project via `TOLOM_SUPABASE_URL` / `TOLOM_SUPABASE_SERVICE_ROLE_KEY`.

Push migrations:
```bash
cd apps/tolom && supabase db push && pnpm update-types   # Tolom
cd apps/agent-gateway && supabase db push                 # Gateway
```

## CI/CD Pipeline

Vercel handles all CI/CD — push to `main` triggers production deploys; PR branches get preview URLs. Builds run from monorepo root via pnpm workspace filtering.

**Cloudflare** (agent-gateway only): `pnpm cf:deploy` in `apps/agent-gateway`. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

**Local validation** before push:
```bash
pnpm --filter <app> validate   # typecheck + lint
pnpm --filter <app> test       # unit/integration tests
```

## Monitoring (Sentry)

zer, tolom, and agent-gateway use Sentry via `@zuiio/capture`:

- **zer & tolom**: `@sentry/nextjs` + Supabase integration. 15% trace sampling in prod. Config in `sentry.server.config.ts`.
- **agent-gateway**: `@zuiio/capture` → Sentry via `setCaptureHandler()`. Config in `src/state/security.ts`.

All three route errors through `capture()` → `Sentry.captureException()`. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars. Source maps upload automatically via the `@sentry/nextjs` build plugin.

**website**: No error tracking.
