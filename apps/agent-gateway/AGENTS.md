<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->

# Agent Gateway — Agent Instructions

> Load [root AGENTS.md](../../AGENTS.md) for shared monorepo rules, conventions, and permission boundaries.

Multi-tenant AI agent gateway for Telegram, Facebook Messenger, and Instagram. Connects messaging bots to Zer/Tolom business data via LLM-powered tools with org isolation, rate limiting, and budget controls.

## Multi-Channel Status (2026-08-25)

| Channel | Status | Notes |
|---------|--------|-------|
| Telegram | ✅ Live | Mode A (shared bot) + Mode B (custom bot) |
| Facebook Messenger | ✅ Live | Deployed + Business Verification APPROVED. Advanced-access App Review for `pages_manage_engagement`/`pages_read_engagement`/`pages_read_user_content` pending |
| FB comment auto-reply | ✅ Built | `src/gateway/comment-agent.ts` — `feed` webhook, public AI reply + Private Reply DM; config in `channel_connections.metadata.comment_reply` |
| Instagram DMs | ⚠️ Partial | Shares the Messenger webhook; OAuth requests NO IG scopes (they break the dialog when the IG product is disabled). IG comment replies NOT built (separate `instagram` webhook object) |
| Web chat widget | ✅ Built | `/api/webchat/widget.js` + `webchat_widgets` |
| WhatsApp | 📋 Planned | Skeleton adapter + webhook routes exist; needs Cloud API creds |

**Current blockers:** Meta App Review for the comment scopes (BV done);
App-level webhook config must also check `feed` for the Page object.
See [docs/FACEBOOK_INSTAGRAM_PLAN.md](docs/FACEBOOK_INSTAGRAM_PLAN.md) and
[docs/MANYCHAT_COMPETITIVE_PLAN.md](docs/MANYCHAT_COMPETITIVE_PLAN.md) §6.

## Core Rules

- **Org isolation:** `orgId` resolved from DB (`channel_connections` table), never from LLM output
- **Channel adapter pattern:** `Channel` interface abstracts Telegram/Messenger/Instagram/WhatsApp
- **Tool pattern:** Every tool receives `ToolContext { orgId, userId, supabase }` and MUST filter by `orgId`
- **Provider pattern:** Each provider owns the multi-turn tool-calling loop; `AiGateway` handles fallback
- **State:** Session (Supabase, 24h TTL), rate limit (in-memory, 60s window), budget (Supabase, daily)
- **Write tools:** Go through confirmation gate (inline keyboards for Telegram, Quick Replies for Messenger/Instagram)
- **Mongolian-first:** All user-facing text is in Mongolian
- **Meta webhook:** Single endpoint handles Messenger, Instagram, AND Page `feed` (comment) events — routed by `page_id` / IG business-account id

## Code Style

- Biome formatter (tabs, double quotes)
- Strict TypeScript, `interface` over `type`, `as const` over `enum`
- Named exports only
- Never throw from tool `execute()` — return Mongolian error strings
- Never expose raw DB errors — use `sanitizeDbError()`

## Commands

```bash
pnpm dev                        # Start dev server
pnpm build                      # Production build (Next.js)
pnpm validate                   # Type-check + lint + tests
pnpm test                       # Run all tests (vitest)
pnpm test:unit                  # Unit tests only
pnpm test:integration           # Integration tests
pnpm test:e2e                   # E2E tests (60s timeout)
pnpm lint                       # Biome lint
pnpm format                     # Biome format
```

## Permission Boundaries

### ✅ Always
- Read nearest `AGENTS.md` and source/tests before editing
- Filter all data access by `orgId` resolved from DB
- Use pnpm and app-scoped commands
- Return Mongolian error strings to users
- Preserve channel adapter abstraction
- Run `pnpm validate` after changes

### ⚠️ Ask First
- Modify org isolation or tenant-scoping logic
- Change rate limiting or budget controls
- Add a new AI provider or modify provider fallback chain
- Add a new tool that performs write actions
- Deploy to production or change environment variables
- Add, remove, or upgrade dependencies

### 🚫 Never
- Commit secrets, API keys, bot tokens, or `.env` files
- Trust `orgId` from LLM output (always resolve from DB)
- Expose raw DB errors to users — use `sanitizeDbError()`
- Skip tool confirmation gates for write operations
- Bypass rate limiting or budget controls
- Use npm or Bun (pnpm only)
- Force-push the default branch

## Task Router

### Adding features
- **New tool** → [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md)
- **New AI provider** → [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md)
- **New messaging channel** → [docs/ADDING_CHANNELS.md](docs/ADDING_CHANNELS.md)

### Understanding the system
- **Architecture** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Environment variables** → [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)
- **Security model** → [docs/SECURITY.md](docs/SECURITY.md)
- **Facebook/Instagram plan** → [docs/FACEBOOK_INSTAGRAM_PLAN.md](docs/FACEBOOK_INSTAGRAM_PLAN.md)

### Common tasks
- **Fix Telegram bot issue** → `src/channels/telegram.ts` + `src/gateway/`
- **Fix Facebook/Instagram issue** → `src/channels/facebook.ts` + `src/gateway/webhook-helpers.ts`
- **Fix comment auto-reply** → `src/gateway/comment-agent.ts` (+ `tests/unit/comment-agent.test.ts`)
- **Debug production issue** → Check Sentry via `@zuiio/capture`

---

**Package APIs change across versions. Always use current docs, never training data.**
