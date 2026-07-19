# zim — Travel eSIM Reseller

Consumer storefront + admin for reselling travel eSIMs in Mongolia. Guest checkout, QPay payments, provider-agnostic eSIM provisioning (mock provider until the real API provider is chosen).

Full plan: `docs/plan/README.md`.

## Rules

- **Never compute prices client-side.** All pricing goes through `src/lib/pricing/quote.ts` (server-only). Displayed price must equal charged price.
- **Money types**: MNT amounts are integer `bigint`/`number` (no decimals); USD costs `numeric(10,4)`; FX rates `numeric(12,4)`.
- **`packages.cost_usd` is secret** — never expose to anon clients; catalog pages pass display-safe DTOs with computed retail only.
- **State machines**: order and esim status transitions only via functions in `src/lib/orders.ts` / `src/lib/provisioning.ts`. Payment settlement only via `settleOrderPayment` (idempotent, verify-with-QPay, conditional-update transition).
- **Pricing snapshots**: order_items carries cost_usd, fx_rate(+id), markup(+rule id), retail at purchase time. Never recompute historical margins from live rules.
- **RLS**: enabled on all tables. Guest order access only through server actions verifying order_code + phone or the HMAC access token (`ORDER_ACCESS_SECRET`).
- **i18n**: `mn` is the default locale; every user-facing string goes through next-intl messages (mn + en).
- **UI**: shadcn/ui components in `src/components/ui` (install via `npx shadcn@latest add <name>`, don't hand-edit unless necessary).
- Lint/format with Biome (`pnpm lint`), test with vitest (`pnpm test`).

## Env

See `.env.example`. Dev defaults: `ESIM_PROVIDER=mock`, `QPAY_MOCK=true` — the full buy flow works locally without real credentials (`POST /api/payments/mock-pay` marks an invoice paid; dev-only).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.
<!-- END:nextjs-agent-rules -->

---

## Package Documentation — READ BEFORE CODING

Before using ANY npm package from `package.json`, verify current API against the package's own documentation. **Never hardcode API patterns from training data.**

**Discovery order:**
1. Check `node_modules/<pkg>/package.json` for `llms`, `llmsFull`, or `mcpServer` fields → use those URLs as primary docs
2. Check `node_modules/<pkg>/AGENTS.md` or `node_modules/<pkg>/SKILL.md` → read for API guidance
3. If neither exists, fetch current docs from the web before writing code

**Key packages and their docs:**
| Package | Docs Source |
|---------|------------|
| `@tanstack/react-query` | https://tanstack.com/query/latest/docs/framework/react/overview |
| `@supabase/supabase-js` | `node_modules/@supabase/supabase-js/AGENTS.md` (per-package) |
| `@supabase/ssr` | https://supabase.com/docs/guides/auth/server-side/nextjs |
| `zod` | `node_modules/zod/AGENTS.md` + `llms` field in package.json |
| `react-hook-form` | https://react-hook-form.com/docs/useform |
| `next` | `node_modules/next/dist/docs/` (bundled) |

**This is not optional.** Package APIs change across versions. Training data is stale by definition.

## Permission Boundaries

### ✅ Always
- Run all pricing through `src/lib/pricing/quote.ts` (server-only)
- Use next-intl for all user-facing strings (mn + en)
- Use shadcn/ui components (install via `npx shadcn@latest add`)
- Lint with Biome and test with vitest before committing

### ⚠️ Ask First
- Adding new payment methods or provider integrations
- Modifying order or eSIM state machine transitions
- Changing RLS policies or Supabase schema
- Adding new API routes or modifying existing ones

### 🚫 Never
- Expose `packages.cost_usd` to anonymous clients
- Compute prices client-side
- Bypass RLS or access orders without verification (order_code + phone or HMAC token)
- Commit secrets, API keys, or `.env` files
- Recompute historical margins from live pricing rules

**Package APIs change across versions. Always use current docs, never training data.**
