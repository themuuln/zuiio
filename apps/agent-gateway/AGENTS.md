<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->

# Agent Gateway — Agent Instructions

> Load [root AGENTS.md](../../AGENTS.md) for shared monorepo rules, conventions, and permission boundaries.

Multi-tenant AI agent gateway for Telegram, Facebook Messenger, and Instagram. Connects messaging bots to Zer/Tolom business data via LLM-powered tools with org isolation, rate limiting, and budget controls.

## Multi-Channel Status (2026-08-27)

| Channel | Status | Notes |
|---------|--------|-------|
| Telegram | ✅ Live | Mode A (shared bot) + Mode B (custom bot) |
| Facebook Messenger | ✅ Live | Cards + QPay — product Generic Template (3 buttons: Detail/Add to Cart/Buy), `BUY:`→LLM buy flow, `confirm:` sends `qpay_qr_image` via `sendImage` |
| FB comment auto-reply | ✅ Built | `src/gateway/comment-agent.ts` — `feed` webhook, public AI reply + Private Reply DM; config in `channel_connections.metadata.comment_reply` |
| Instagram DMs | ⚠️ Partial | Shares Messenger webhook; OAuth requests NO IG scopes. IG comment replies NOT built (separate `instagram` webhook object) |
| Web chat widget | ✅ Built | `/api/webchat/widget.js` + `webchat_widgets` |
| WhatsApp | 📋 Planned | Skeleton adapter + webhook routes exist; needs Cloud API creds |

**Current blockers:** Meta App Review for `pages_manage_engagement`/`pages_read_engagement`/`pages_read_user_content` pending (BV done); App `feed` check required.
See [docs/FACEBOOK_INSTAGRAM_PLAN.md](docs/FACEBOOK_INSTAGRAM_PLAN.md) and [docs/MANYCHAT_COMPETITIVE_PLAN.md](docs/MANYCHAT_COMPETITIVE_PLAN.md) §6.

**Observability (2026-08-27):** `gateway_traces` (30d, RLS forced) + `src/lib/trace.ts` structured JSON (`traceId` from `x-vercel-id` or UUID, `after()` persist) + `GET /api/dashboard/traces` + `GET /dashboard/traces` — Vercel logs are 768-char/1h ephemeral; DB keeps full request/response/tool_calls. Tail: `vercel logs --since 1h --expand --json | jq` or `curl /api/dashboard/traces?orgId=…` .
## Core Rules

- **Org isolation:** `orgId` resolved from DB (`channel_connections` table), never from LLM output
- **Channel adapter pattern:** `Channel` interface abstracts Telegram/Messenger/Instagram/WhatsApp
- **Tool pattern:** Every tool receives `ToolContext { orgId, userId, supabase }` and MUST filter by `orgId`
- **Provider pattern:** Each provider owns the multi-turn tool-calling loop; `AiGateway` handles fallback
- **State:** Session (Supabase, 24h TTL), rate limit (in-memory, 60s window), budget (Supabase, daily), traces (`gateway_traces`, 30d, `after()` persist)
- **Write tools:** Go through confirmation gate (inline keyboards for Telegram, Quick Replies for Messenger/Instagram); QPay orders via `placeOrderWithQpay`/`checkoutCartWithQpay` return `payment_link` + `qpay_qr_image` → `confirm:` sends text + `sendImage`
- **Mongolian-first:** All user-facing text is in Mongolian
- **Meta webhook:** Single endpoint handles Messenger, Instagram, AND Page `feed` (comment) events — routed by `page_id` / IG business-account id; every request gets `traceId` (`x-vercel-id` or UUID) → JSON logs + `gateway_traces`
- **Product cards:** Messenger `sendProductCards` Generic Template (10 cards, `imageUrl` from `products.image_url`, 3 buttons `Дэлгэрэнгүй`/`Сагсанд нэмэх`/`Худалдаж авах` → `PRODUCT:`/`CART_ADD:`/`BUY:` postbacks; `BUY:` delegates to LLM buy flow)
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
# Traces (DX)
curl "/api/dashboard/traces?orgId=<id>&limit=20"  # DB traces (30d, full request/response/tool_calls)
vercel logs --since 1h --expand --json | jq '.logs[] | select(.traceId)'  # Vercel JSON logs with traceId
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
- **Fix Facebook/Instagram issue** → `src/channels/facebook.ts` (cards: `sendProductCards` 3 buttons + `sendImage` QR, `BUY:`→LLM) + `src/gateway/webhook-helpers.ts` + `src/app/api/facebook/webhook/route.ts` (trace: `createTraceLogger`)
- **Fix comment auto-reply** → `src/gateway/comment-agent.ts` (+ `tests/unit/comment-agent.test.ts`)
- **Debug production issue** → `GET /dashboard/traces` or `GET /api/dashboard/traces?traceId=…` + `vercel logs --since 1h --expand --json` + `gateway_traces` table; legacy: Sentry via `@zuiio/capture`
- **Product cards / Buy / QPay** → `customer-product-tool.ts` (`imageUrl`), `customer-order-tool.ts` (`qpay_qr_image`), `facebook.ts` (`BUY:`→buy flow, `confirm:`→`sendImage`)
---

**Package APIs change across versions. Always use current docs, never training data.**
