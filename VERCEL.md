# Vercel Deployment Guide

## Architecture

This monorepo uses git submodules. Each app has its own repo but shares `@zuiio/*` packages via the workspace.

### Option A: Deploy from Monorepo (Recommended)

Each Vercel project points to `themuuln/zuiio.git` with a Root Directory:

| App | Root Directory | Notes |
|-----|---------------|-------|
| zer | `apps/zer` | SMB ERP |
| website | `apps/website` | Company site |
| agent-gateway | `apps/agent-gateway` | Telegram bot (has vercel.json) |

**Steps:**
1. Vercel Dashboard → Project → Settings → General
2. Git Repository → `themuuln/zuiio`
3. Root Directory → `apps/<app-name>`
4. Save → Redeploy

### Option B: Deploy Standalone (for tolom)

Tolom is a standalone repo (`themuuln/tolom.git`) and deploys directly:

| App | Git Repository | Root Directory |
|-----|---------------|----------------|
| tolom | `themuuln/tolom` | _(empty)_ |

## Turbo Scripts

Use these from the monorepo root:

```bash
# Run a specific app
pnpm dev:zer
pnpm dev:tolom
pnpm dev:website
pnpm dev:agent-gateway

# Run all apps in parallel
pnpm dev

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
