# @onoo/core

Shared domain package for the Onoo sports stats platform.

**Pure TypeScript only** — no React, no DOM, no react-native. Runs identically in Next.js server components, the browser tracker, Supabase Edge Functions (Deno), and Expo.

## Modules

| Module | Purpose |
|---|---|
| `types` | Database row types (generated), domain types, Zod schemas |
| `stats` | Stat engine: `deriveBoxScore()`, standings, leaders |
| `events` | Event dictionary, payload validation, canonical ordering |
| `sync` | Offline event queue logic |
| `format` | Clock, name, percentage formatters; i18n stat labels |

## Usage

```ts
import { deriveBoxScore } from "@onoo/core/stats";
import { sortEvents } from "@onoo/core/events";
import { formatClock } from "@onoo/core/format";
```

## Development

```bash
cd apps/onoo/packages/core
pnpm test          # run vitest
pnpm validate:types  # type-check
```
