<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# ZRAf — Agent Instructions

Load shared context per root `../../AGENTS.md`.

ZRAf is a Mongolian driving theory exam prep app. Features: onboarding, practice sessions, mock exams, progress tracking, and weak-topic identification. All data is static JSON in `public/data/` — no backend required.

## Core Rules

1. **Static data only.** Question bank and images live in `public/data/`. Watch total size — deploy target is Vercel Hobby (100 MB limit).
2. **No backend.** No auth, no database, no API routes (except placeholder stubs). All state is client-side.
3. **Offline-capable.** Since data is static, the app should work without a network connection once loaded.
4. **Mongolian-first.** UI text, explanations, and question content are in Mongolian.
5. **Type-safe models.** Domain types in `src/lib/models.ts`. Question, Session, Progress, and Learner models define the full data shape.

## Commands

```bash
pnpm dev                  # Dev server (Turbopack)
pnpm build                # Production build
pnpm lint                 # Biome check
pnpm format               # Biome format
```

**No test suite yet.** Add tests when the app is ready for production hardening.

## Permission Boundaries

### ✅ Always
- Read the nearest `AGENTS.md` and source files being changed
- Keep static data assets under the Vercel Hobby size limit
- Use existing model types from `src/lib/models.ts`

### ⚠️ Ask First
- Add, remove, or upgrade dependencies
- Introduce a backend, auth, or database layer
- Add CI/CD or test infrastructure
- Change the question bank format or data schema

### 🚫 Never
- Commit secrets, credentials, `.env` files, keys, or tokens
- Add server-side logic or API routes beyond existing stubs
- Exceed the Vercel Hobby deployment size limit
- Force-push the default branch

**Package APIs change across versions. Always use current docs, never training data.**
