# zim — eSIM Reseller Implementation Plan

## Context

Mongolians travel heavily to China and other Asian countries, making travel eSIMs a high-demand, high-competition product locally. zim is a reseller product: buy wholesale eSIM packages from an upstream API provider, sell at a markup in MNT.

The upstream API provider will be chosen later (Airalo / eSIM Access / eSIM-Go / etc.), so v1 is a **full end-to-end build against a provider-agnostic adapter with a mock provider** — swapping in the real provider later means writing one adapter file.

## Decisions

- **New standalone app** in the zuiio monorepo: `apps/zim` (z-prefix like zer/zill/zoa; reads "z + SIM")
- **Rule-based markup pricing**: cost USD × FX rate + markup rules (global % / per-region / per-package, min-margin floor), all admin-adjustable
- **QPay only** for v1 payments
- Guest checkout (phone + email), Mongolian-first UI with English
- **UI built on shadcn/ui**: init with `npx shadcn@latest init` (Tailwind v4), install components via `npx shadcn@latest add …` (button, card, input, form, select, accordion, badge, table, dialog, drawer, tabs, sonner, skeleton, dropdown-menu). Admin tables use shadcn table + TanStack Table.

## Plan sections

1. [Scaffold](./01-scaffold.md)
2. [Data model](./02-data-model.md)
3. [Provider adapter](./03-provider-adapter.md)
4. [Pricing engine](./04-pricing-engine.md)
5. [Storefront](./05-storefront.md)
6. [Payment flow](./06-payments.md)
7. [Admin dashboard](./07-admin.md)
8. [Delivery & notifications](./08-delivery-notifications.md)
9. [Phases & verification](./09-phases-verification.md)

## Reused monorepo assets

| What | Source |
|---|---|
| App skeleton (Next.js 16 + Supabase SSR + Tailwind v4) | `apps/zill` structure (upgraded to catalog versions + Biome like `apps/zer`); UI components come from shadcn CLI, not zill |
| QPay client (qpay-js: invoice create, check, callback) | `apps/zerbu/src/lib/payment-service.ts` + `apps/zerbu/src/app/api/payments/*` |
| next-intl `[locale]` wiring + messages structure | `apps/zatly/src/i18n/*` |
| Delivery email (nodemailer, HTML templates) | `apps/zer/src/lib/email.ts` |
| Telegram admin alerts | `apps/zer/src/lib/notification.ts` |
| Admin data table pattern | `apps/tolom/src/components/data-table-dashboard.tsx` |
| MNT formatting (`formatCurrency`), validators, error capture | `@zuiio/core`, `@zuiio/capture` |
| Order-creation server-action pattern | `apps/zer/src/app/(dashboard)/shop/actions.ts` |

Per `CONTRIBUTING.md`: create `apps/zim/AGENTS.md`, add zim to root `AGENTS.md` apps table, add new env vars to root `turbo.json` build.env.

## Edge cases handled

- **FX volatility**: price locked into invoice + snapshot at order creation; 30-min order TTL bounds exposure
- **Provider price/catalog drift**: sync flags `needs_repricing`, archives vanished packages; snapshots keep history correct; min-margin floor prevents below-margin sales before admin reacts
- **Callback/polling race, duplicate callbacks**: single settlement function + conditional-update transition + verify-with-QPay
- **Paid but provisioning failed**: retry queue with backoff → admin alert → manual retry/refund; honest customer-facing states

## V2 (explicitly out of scope for v1)

Multi-item cart, promo codes, auto FX fetch cron, automated QPay refunds, real provider adapter, usage-tracking UI, customer accounts beyond magic-link my-orders.
