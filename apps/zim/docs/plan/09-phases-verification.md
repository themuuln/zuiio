# 9. Implementation phases & verification

Each phase is independently verifiable.

## Phase 1 — Scaffold
Copy zill skeleton shape → apps/zim with catalog versions, Biome, next-intl wiring, shadcn init + base components, AGENTS.md, root AGENTS.md table row, `.env.example`. Placeholder landing page in mn/en.

**Verify:** `pnpm install && pnpm --filter zim dev` renders `/mn` and `/en`; `pnpm --filter zim typecheck && pnpm --filter zim lint` clean.

## Phase 2 — Database
Migration + seed (regions, global pricing rule 20%, min-margin 10%, FX 3450, one admin user); apply to Supabase; generate `types.ts`.

**Verify:** migration applies cleanly; anon client cannot `select cost_usd from packages` (RLS check).

## Phase 3 — Provider adapter + pricing engine
`lib/provider/*`, `lib/pricing/*`, catalog sync server action, vitest suites.

**Verify:** `pnpm --filter zim test` — pricing: rule precedence, floor, rounding edges (exact-step values, floor-vs-round interaction); mock provider: determinism (same orderRef → same ICCID), failure simulation. Run sync → packages rows appear.

## Phase 4 — Storefront (read-only)
Landing, destinations, package list/filters, package detail with real computed prices, i18n messages.

**Verify:** browse all pages both locales on mobile viewport; displayed price for a known package matches hand-computed engine output.

## Phase 5 — Checkout + payments
Checkout action, order/payment creation, `qpay.ts` with `QPAY_MOCK`, pay page with polling, `settleOrderPayment`, callback/status routes, expiry cron.

**Verify:** with `QPAY_MOCK=true`: checkout → QR → mock-pay → poll flips paid; double callback + simultaneous poll → exactly one transition (check DB); order past TTL → expired.

## Phase 6 — Provisioning + delivery
`provisioning.ts`, retry cron, webhook route, delivery page + access tokens, lookup page, delivery email, Telegram alerts.

**Verify:** happy path e2e: pay → delivered page with phone-scannable QR + email received; `MOCK_PROVIDER_FAILURE_RATE=1` → paid-but-failed → retries → Telegram alert; `MOCK_PROVIDER_ASYNC=true` → webhook path delivers; duplicate webhook → single esims row.

## Phase 7 — Admin
Auth gate, dashboard, catalog sync UI, pricing CRUD + preview, FX page, orders/esim detail, retry/refund actions, my-orders for authed customers.

**Verify:** non-admin blocked from `/admin`; global markup change moves storefront price without deploy; new FX rate previews + applies; retry heals a failed order; dashboard margins match order_items snapshots (unchanged after later FX/rule edits — snapshot proof).

## Phase 8 — Polish
Sentry via `@zuiio/capture`, Playwright smoke e2e (browse → buy → mock-pay → delivery), README, final AGENTS.md updates.
