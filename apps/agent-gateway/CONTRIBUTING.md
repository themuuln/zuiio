# Contributing to Agent Gateway

## Development Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start dev server
pnpm dev
```

The webhook endpoint is at `http://localhost:3000/api/telegram/webhook`.

## Code Style

- **Formatter:** Biome (tabs, double quotes)
- **Linter:** Biome
- **TypeScript:** Strict mode

```bash
pnpm lint       # Check
pnpm format     # Auto-fix
```

## Project Conventions

### File Organization

- `src/gateway/` — Core gateway logic (org resolution, agent handler)
- `src/channels/` — Messaging adapters (Telegram, etc.)
- `src/providers/` — AI provider adapters (DeepSeek, OpenAI)
- `src/state/` — Request-scoped state (session, budget, rate limit, audit)
- `src/lib/` — Shared utilities (env, supabase, tokens, sanitize)
- `src/runtime/` — Runtime helpers (confirmation gate)
- `src/stt/` — Speech-to-text (Groq Whisper)

### TypeScript

- Use `interface` over `type` for object shapes
- Avoid `any` — use `unknown` with type narrowing
- Use `as const` over `enum`
- Named exports only

### Error Handling

- **Never throw from tool `execute()`** — return user-friendly error strings in Mongolian
- **Never expose raw DB errors** — use `sanitizeDbError()` or return generic messages
- **Capture errors to Sentry** — use `capture()` from `@zuiio/capture`

### Multi-Tenancy

- **Always filter by `orgId`** — every Supabase query must include `.eq("organization_id", orgId)`
- **Never trust LLM-provided orgId** — always use the resolved `context.orgId`
- **Service-role bypasses RLS** — application-level filtering is the only guard

### Mongolian

- All user-facing text is in Mongolian
- Error messages, button text, system prompts — all Mongolian
- Technical terms can stay in English (e.g., "webhook", "API")

## Commit Style

Use conventional commits:

```
feat: add WhatsApp channel adapter
fix: rate limiter not cleaning up stale entries
chore: update Supabase client to v2.110
docs: add architecture diagram
```

## Testing

```bash
pnpm test              # All tests
pnpm test:unit         # Unit only
pnpm test:integration  # Integration only
pnpm test:e2e          # End-to-end only
```

See [docs/TESTING.md](docs/TESTING.md) for test structure and conventions.

## Adding Features

- **New tools** → [docs/ADDING_TOOLS.md](docs/ADDING_TOOLS.md)
- **New providers** → [docs/ADDING_PROVIDERS.md](docs/ADDING_PROVIDERS.md)
- **New channels** → [docs/ADDING_CHANNELS.md](docs/ADDING_CHANNELS.md)

## Pull Requests

1. Create a feature branch from `main`
2. Make changes with tests
3. Run `pnpm validate` (types + lint + tests)
4. Open a PR with a clear description
5. Link any related issues

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for the security model and threat analysis.
