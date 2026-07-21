<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Zerbu (Gerbul) — Agent Instructions

Load shared context per root `../../AGENTS.md`.

Zerbu (package name: "gerbul") is a Mongolian couples/relationship app. Features: intimacy tracking, mood, memories, questions/quizzes, games, chat, and lists.

## Core Rules

1. **Supabase SSR auth.** All auth via `@supabase/ssr` client/server helpers. Never bypass the middleware auth flow.
2. **Client-side state.** Zustand for app state, SWR for data fetching. No server components for interactive screens.
3. **AI integration.** Google AI SDK (`@ai-sdk/google`) powers in-app AI features. Never expose API keys to the client.
4. **Payments.** QPay (`qpay-js`) for Mongolian payment processing. Payment logic lives in `src/lib/payment-service.ts`.
5. **Mongolian-first UI.** All user-facing text in Mongolian. Currency in ₮.

## Commands

```bash
pnpm dev                  # Dev server (Turbopack)
pnpm build                # Production build
pnpm lint                 # Biome check
pnpm format               # Biome format
```

## Permission Boundaries

### ✅ Always
- Read the nearest `AGENTS.md` and source/tests being changed
- Use Supabase SSR helpers for auth (`createClient` from `@/lib/supabase/client` or `server`)
- Keep payment credentials server-side only

### ⚠️ Ask First
- Add, remove, or upgrade dependencies
- Change authentication, authorization, or RLS policies
- Modify payment or QPay integration logic
- Change AI service configuration or model routing

### 🚫 Never
- Commit secrets, credentials, `.env` files, keys, or tokens
- Expose API keys (Google AI, Supabase service-role) to client code
- Bypass RLS or omit user-scoping on queries
- Manually edit generated type files
- Force-push the default branch

**Package APIs change across versions. Always use current docs, never training data.**
