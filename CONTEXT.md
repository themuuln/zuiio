# Zuiio — Ubiquitous Language / Domain Glossary

Source of truth for shared terminology across the Zuiio monorepo.
App-level CONTEXT.md files refine this glossary for their domain (e.g. `~/.workspace/tolom/CONTEXT.md`).
When app and root definitions conflict, the app-level file wins for its own scope.

## Core Concepts

- **Organization** — The tenant that owns data. Every table has an `organization_id` column; every query is RLS-scoped to it. Never call it "company", "tenant", or "workspace" in code or docs.
- **Product** — A shipped Zuiio application: Zer (mini ERP), Tolom (auto repair), Tumurch (gym platform), Tamga (horse management), Zuiio ID (single sign-on). Products share one brand and ship independently.
- **App** — A product codebase under `apps/`. Never call an app a "project".
- **Package** — A shared library under `packages/`, published as `@zuiio/*` (`core`, `ui`, `query`, `capture`, `hr`, `realtime`, `sdk`, `search`, …). Shared logic lives here, not in apps.
- **Ledger** — An append-only record of inventory or financial changes. Never `UPDATE quantity` directly; write a ledger entry.
- **FastGate** — The verification contract: `npm run verify` runs typecheck → lint → unit tests with coverage gating. A change is complete only when the gate is green.
- **RLS (Row Level Security)** — The database-level tenant isolation mechanism. Never bypass it; never expose service-role credentials to client code.
- **Design system** — The shared visual language (OKLch tokens, typography, spacing, motion) defined in `docs/design.md`. Every product uses it.
- **Production service hostname** — `<service>.zuiio.app` is the production hostname for a service. **Hostname-level test alias** — `<service>.zuiiotech.com` is a test alias for that service only; it does not imply isolated infrastructure. Both apex domains and all other aliases remain unchanged.

## Preferred Terms

- "organization" for the multi-tenant unit — not "company", "tenant", or "workspace".
- "customer" for the person buying from a business — not "user" or "client".
- "inventory" for the stock system; "stock" for the quantity on hand.
- "work order" for a repair job in service domains — not "job" or "ticket".
- "estimate" for a pre-work price proposal in service domains — not "quote".
- Keep Mongolian product names (Zer, Tolom, Tumurch, Tamga) untranslated.
- User-facing copy in Mongolian products is Mongolian-first; keep `mn` and `en` message catalogs in sync.

## Naming Conventions

- Database tables and columns: `snake_case`; every table carries `organization_id`.
- Components: `PascalCase`. Files: `kebab-case`. Hooks: `use` prefix.
- Packages: `@zuiio/<name>`, kebab-case.
- API routes: `createRouteHandler` / `createSimpleRouteHandler` (Tolom) or Server Actions with FormData (Zer) — never raw `NextResponse.json()`.
- Do not invent synonyms for domain entities; reuse the terms above.
