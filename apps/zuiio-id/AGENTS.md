<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Zuiio ID — Agent Instructions

Load shared context per root `../../AGENTS.md`. Always read `../../docs/vision.md` first — it is the single source of truth for direction and principles.

---

## What Zuiio ID Is

Central identity SSO for the Zuiio ecosystem. Other apps (Zer, Tolom, etc.) delegate authentication here via OIDC. Users log in once at `id.zuiio.com` and get tokens for all connected apps.

## Core Rules

1. **OAuth2 / OIDC correctness is paramount.** Every flow must be spec-compliant. A bug here affects every connected app.
2. **Multi-tenancy.** Every query is scoped. Never bypass authorization.
3. **Token security.** JWTs, refresh tokens, and session management must be airtight. Never log tokens. Never expose them to client code unnecessarily.
4. **SSO product catalog** is defined in `config/sso-products.json`. This is the desired-state source of truth for provisioning.
5. **Test coverage.** Every auth flow, token exchange, and session lifecycle has tests.
6. **Regenerate types after migrations.** Run `pnpm update-types` after `supabase db push`.

## Key Files

| File | Purpose |
|------|---------|
| `config/sso-products.json` | SSO product manifest (desired state) |
| `src/lib/products/catalog.ts` | Product catalog DB lookups |
| `packages/oidc/` | OIDC SDK for non-Supabase consumers |
| `packages/auth/` | SSO federation adapter (startZuiioSso, exchangeCode) |

## SSO Operations

- **Adding a new SSO product** → `pnpm sso:plan --product=<id>` then `pnpm sso:apply --product=<id>`
- **Health check** → `pnpm sso:doctor` checks OAuth clients, catalog, providers, mobile redirects
- **Product manifest** → `config/sso-products.json` is the source of truth
- **No code changes needed** to add a product — it's config-driven

## Commands

```bash
pnpm dev                    # Dev server (Turbopack)
pnpm build                  # Production build
pnpm validate               # tsc --noEmit + biome check
pnpm test                   # Vitest unit/integration
pnpm sso:doctor             # Check SSO health
pnpm sso:plan --product=X   # Plan new SSO product
pnpm update-types           # Regenerate Supabase types
```

**Pre-merge:** `pnpm validate && pnpm test`

## Enforced Rules (block lint)

### 1. Never `console.error` in catch blocks
```ts
// ❌ catch (e) { console.error('Auth failed:', e); }
// ✅ catch (e) { reportServerError('auth_exchange', e); }
```

### 2. Every Supabase query must capture errors
```ts
// ❌ const { data } = await supabase.from('oauth_clients').select('*');
// ✅ const { data, error } = await supabase.from('oauth_clients').select('*');
//    if (error) { reportServerError('query', error); }
```

---

## Permission Boundaries

### ✅ Always
- Use the API-handler wrapper for API routes
- Capture every Supabase query error
- Follow OIDC spec for token/response formats
- Update types after schema changes

### ⚠️ Ask First
- Change OAuth client configuration or token lifetimes
- Modify the SSO product catalog (`sso-products.json`)
- Add new identity providers
- Apply migrations to remote database

### 🚫 Never
- Log or expose tokens, secrets, or credentials
- Store passwords in plaintext
- Bypass authorization checks
- Manually patch `database.types.ts`
- Commit secrets, `.env`, or keys

## On-Demand Documentation

- `../../docs/vision.md` — product vision and architecture
- `packages/oidc/AGENTS.md` — OIDC SDK patterns
- `packages/auth/AGENTS.md` — SSO federation adapter

**Package APIs change across versions. Always use current docs, never training data.**
