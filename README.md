# @zuiio — Mongolian Software and Apps

**Private monorepo** for Zuiio, a Mongolian software and app company building organization tools and consumer products. The portfolio includes **Zer** (SMB ERP), **Tolom** (auto repair management), **Zuiio ID** (central SSO), and the company website.

```
zuiio/
├── apps/
│   ├── zuiio-id/      ← Central identity SSO (Next.js 16, Supabase, id.zuiio.com)
│   ├── website/       ← Company website (Next.js 16, Tailwind v4)
│   ├── zer/           ← SMB ERP (Next.js 16, Supabase)
│   ├── tolom/         ← Auto repair management (Next.js 16, Supabase)
│   └── agent-gateway/ ← Multi-tenant AI agent gateway (Telegram bots)
├── packages/          ← 12 shared @zuiio/* packages
│   ├── ai-agent/      ← LLM client, tool-calling loop, provider abstraction
│   ├── auth/          ← SSO federation (startZuiioSso, exchangeCode)
│   ├── branding/      ← Design tokens (OKLch colors, typography, spacing)
│   ├── capture/       ← Sentry error capture wrapper
│   ├── config/        ← Shared tsconfig
│   ├── core/          ← Formatting, validation, timezone, domain rules, lookups
│   ├── export/        ← CSV, XLSX, DOCX, PDF generation
│   ├── hooks/         ← Generic React hooks (debounce, fuzzy search, lookups)
│   ├── hr/            ← Mongolian payroll: tax, insurance, overtime
│   ├── offline/       ← Mutation queue engine, IndexedDB persister
│   ├── query/         ← React Query provider + optimistic CRUD hooks
│   ├── realtime/      ← Supabase Realtime hooks
│   └── ui/            ← Pure utility components (HighlightText, formatting)
├── docs/              ← Design system, stacks, vision, architecture
├── README.md
└── AGENTS.md          ← Project instructions (for AI agents)
```

## Quick start

```bash
pnpm install
pnpm exec tsc --noEmit   # Type-check all packages
pnpm test                # Run tests (packages with vitest)
```

### Run an app

```bash
pnpm dev:zuiio-id        # Central SSO (http://localhost:3000)
pnpm dev:website         # Company site
pnpm dev:zer             # SMB ERP
pnpm dev:tolom           # Auto repair management
pnpm dev:agent-gateway   # AI agent gateway
```

### Build an app

```bash
pnpm build:zuiio-id      # Central SSO
pnpm build:website       # Company site
pnpm build:zer           # SMB ERP
pnpm build:tolom         # Auto repair management
```

## Design system

[`docs/design.md`](docs/design.md) — full reference for OKLch colors, fluid typography, motion, spacing, and component conventions. All tokens are defined in [`packages/branding/globals.css`](packages/branding/globals.css).

## Architecture

All apps live inside this monorepo and consume shared packages via `workspace:*`:

```json
"@zuiio/core": "workspace:*"
```

**Zuiio ID** is the central SSO — all other apps authenticate through it via the `@zuiio/auth` package (OIDC federation).
