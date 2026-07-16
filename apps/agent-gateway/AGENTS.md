<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->

# Agent Gateway

Multi-tenant AI agent gateway for Telegram, Facebook Messenger, and Instagram. Connects messaging bots to Zer/Tolom business data via LLM-powered tools with org isolation, rate limiting, and budget controls.

## Multi-Channel Roadmap

**Status:** Telegram live. Facebook/Instagram in progress (code foundation).

| Channel | Status | Notes |
|---|---|---|
| Telegram | ✅ Live | Mode A (shared bot) + Mode B (custom bot) |
| Facebook Messenger | 🔨 In progress | Webhook + OAuth in dev. App Review deferred. |
| Instagram DMs | 🔨 In progress | Same webhook as Messenger. App Review deferred. |
| WhatsApp | 📋 Planned | Skeleton adapter exists. |

**Current blocker:** Meta Business Verification — waiting for English company certificate.
**ETA:** ~4 weeks after Business Verification submission.

See [docs/FACEBOOK_INSTAGRAM_PLAN.md](docs/FACEBOOK_INSTAGRAM_PLAN.md) for full integration plan.

## Documentation

- [README.md](README.md) — Quick start, features, project structure
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design, data flow, bot modes
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — Environment variables reference
- [docs/SECURITY.md](docs/SECURITY.md) — Security model, threat analysis, controls
- [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md) — How to add new tools
- [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md) — How to add new AI providers
- [docs/ADDING_CHANNELS.md](docs/ADDING_CHANNELS.md) — How to add new messaging channels
- [docs/TESTING.md](docs/TESTING.md) — Test structure and conventions
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development setup and guidelines

## Key Architecture Facts

- **Org isolation:** `orgId` resolved from DB (channel_connections table), never from LLM output
- **Channel adapter pattern:** `Channel` interface abstracts Telegram/Messenger/Instagram/WhatsApp
- **Tool pattern:** Every tool receives `ToolContext { orgId, userId, supabase }` and MUST filter by `orgId`
- **Provider pattern:** Each provider owns the multi-turn tool-calling loop; `AiGateway` handles fallback
- **State:** Session (Supabase, 24h TTL), rate limit (in-memory, 60s window), budget (Supabase, daily)
- **Write tools:** Go through confirmation gate (channel-aware: inline keyboards for Telegram, Quick Replies for Messenger/Instagram)
- **Mongolian-first:** All user-facing text is in Mongolian
- **Meta webhook:** Single endpoint handles both Messenger and Instagram (routed by page_id)

## Code Style

- Biome formatter (tabs, double quotes)
- Strict TypeScript, `interface` over `type`, `as const` over `enum`
- Named exports only
- Never throw from tool `execute()` — return Mongolian error strings
- Never expose raw DB errors — use `sanitizeDbError()`
## Tasks (Agent Router)

Use this section to find the right context for your task. Read the linked file before proceeding.

### Adding features

- **Add a new tool** → [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md)
- **Add a new AI provider** → [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md)
- **Add a new messaging channel** → [docs/ADDING_CHANNELS.md](docs/ADDING_CHANNELS.md)

### Understanding the system

- **System architecture** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Environment variables** → [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)
- **Security model** → [docs/SECURITY.md](docs/SECURITY.md)
- **Facebook/Instagram plan** → [docs/FACEBOOK_INSTAGRAM_PLAN.md](docs/FACEBOOK_INSTAGRAM_PLAN.md)

### Development

- **Testing** → [docs/TESTING.md](docs/TESTING.md)
- **Contributing** → [CONTRIBUTING.md](CONTRIBUTING.md)

### Common tasks

- **Fix a Telegram bot issue** → Check `src/channels/telegram.ts` and `src/gateway/`
- **Fix a Facebook/Instagram issue** → Check `src/channels/facebook.ts` and `src/gateway/webhook-helpers.ts`
- **Add a new tool** → See [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md)
- **Change AI provider** → See `src/providers/` and [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md)
- **Debug a production issue** → Check Sentry via `@zuiio/capture`
