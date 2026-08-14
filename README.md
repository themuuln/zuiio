# @zuiio — Mongolian Software and Apps

**Private monorepo** for Zuiio, a Mongolian software company building organization tools and consumer products.

## Products

| Product | Audience | Description |
|---------|----------|-------------|
| **Zer** | Organizations | SMB ERP — inventory, sales, expenses, customer management |
| **Tolom** | Organizations | Auto repair shop management — bay view, work orders, parts |
| **Tumurch** | Organizations + Consumers | Gym platform — workout logging, coaching, operations, billing |
| **Tamga** | Consumers | Horse management — bloodlines, health, training, performance |
| **Zuiio ID** | Organizations | Central SSO — single sign-on, org management, SAML/OIDC federation |

## Structure

```
zuiio/
├── apps/
│   ├── agent-gateway/   ← Multi-tenant AI agent gateway (Telegram bots)
│   ├── onoo/            ← Basketball stats tracker (Next.js 16, Supabase)
│   ├── tamga/           ← Horse management (Flutter)
│   ├── tumurch-rn/      ← Tumurch gym platform (standalone repo)
│   ├── zim/             ← App
│   ├── zerbu/           ← App
│   └── ...              ← Other apps and submodules
│   └── archive/         ← Archived apps (zer, tolom, website, sms-pay, tumurch-rn, zuiio-id, …)
├── packages/            ← 16 shared @zuiio/* packages
│   ├── ai-agent/        ← LLM client, tool-calling loop, provider abstraction
│   ├── auth/            ← SSO federation (startZuiioSso, exchangeCode)
│   ├── branding/        ← Design tokens (OKLch colors, typography, spacing)
│   ├── capture/         ← Sentry error capture wrapper
│   ├── config/          ← Shared tsconfig
│   ├── core/            ← Formatting, validation, timezone, domain rules, lookups
│   ├── export/          ← CSV, XLSX, DOCX, PDF generation
│   ├── hooks/           ← Generic React hooks (debounce, fuzzy search, lookups)
│   ├── hr/              ← Mongolian payroll: tax, insurance, overtime
│   ├── i18n/            ← Internationalization utilities
│   ├── offline/         ← Mutation queue engine, IndexedDB persister
│   ├── query/           ← React Query provider + optimistic CRUD hooks
│   ├── realtime/        ← Supabase Realtime hooks
│   ├── sdk/             ← SDK package
│   ├── search/          ← Search utilities
│   └── ui/              ← Pure utility components (HighlightText, formatting)
├── docs/                ← Design system, stacks, vision, architecture
├── README.md
└── AGENTS.md            ← Project instructions (for AI agents)
```

## Quick start

```bash
pnpm install
pnpm exec tsc --noEmit   # Type-check all packages
pnpm test                # Run tests (packages with vitest)
```

### Run an app

```bash
pnpm dev:agent-gateway   # AI agent gateway
```

### Build an app

## Design system

[`docs/design.md`](docs/design.md) — full reference for OKLch colors, fluid typography, motion, spacing, and component conventions. All tokens are defined in [`packages/branding/globals.css`](packages/branding/globals.css).

## Architecture

All apps live inside this monorepo and consume shared packages via `workspace:*`:

```json
"@zuiio/core": "workspace:*"
```

**Zuiio ID** is the central SSO — all other apps authenticate through it via the `@zuiio/auth` package (OIDC federation).

### Org catalog

[`docs/org.yaml`](docs/org.yaml) — centralized source of truth for company info and every product's details (name, tagline, description, URL, features). The website and future apps reference this for canonical product data.
