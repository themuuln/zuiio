# Vercel Deployment Guide

## Architecture

This monorepo uses git submodules. Each app has its own repo but shares `@zuiio/*` packages via the workspace.

### Deploy from Monorepo (Recommended)

Each Vercel project points to `themuuln/zuiio.git` with a Root Directory:

| App | Root Directory | Notes |
|-----|---------------|-------|
| zuiio-id | `apps/zuiio-id` | Central SSO (Supabase) |
| agent-gateway | `apps/agent-gateway` | Telegram bot (has vercel.json) |
| onoo | `apps/onoo` | Basketball stats (Supabase) |

**Steps:**
1. Vercel Dashboard → Project → Settings → General
2. Git Repository → `themuuln/zuiio`
3. Root Directory → `apps/<app-name>`
4. Save → Redeploy

### Standalone Repos (Submodules)

Some apps deploy from their own repo:

| App | Git Repository | Notes |
|-----|---------------|-------|
| zer | `themuuln/zer` | SMB ERP |
| tolom | `themuuln/tolom` | Auto repair management |
| tumurch | `themuuln/tumurch` | Gym platform |
| website | `themuuln/website` | Company site (no env vars, fully static) |
| sms-pay | `themuuln/sms-pay` | SMS payment |
| tumurch-rn | `themuuln/tumurch-rn` | Gym platform RN app |

### Not on Vercel

| App | Stack | Why |
|-----|-------|-----|
| tamga | Flutter | Mobile app, distributed via APK/GitHub Release |
| agent-gateway | Next.js + Telegram | Can be Vercel or standalone |

## Turbo Scripts

Use these from the monorepo root:

```bash
# Run a specific app
pnpm dev:zuiio-id
pnpm dev:agent-gateway

# Typecheck everything
pnpm typecheck

# Build everything
pnpm build

# Run tests
pnpm test
```

## pnpm Catalog

Shared dependency versions are centralized in `pnpm-workspace.yaml`. Apps use `catalog:` protocol:

```json
{
  "dependencies": {
    "next": "catalog:",
    "react": "catalog:",
    "@supabase/supabase-js": "catalog:"
  }
}
```

This ensures all apps use the same versions without manual synchronization.
