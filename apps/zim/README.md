# zim — Travel eSIM Reseller

Mongolian-first storefront + admin for reselling travel eSIMs (China, Japan, Korea, Thailand, and more). Guest checkout, QPay payments, instant QR delivery.

Built provider-agnostic: the upstream eSIM API (Airalo / eSIM Access / eSIM-Go / …) plugs in behind one adapter interface. Until it's chosen, a deterministic **mock provider** powers the full flow.

📋 Full implementation plan: [`docs/plan/`](./docs/plan/README.md)

## Quick start (zero credentials)

```bash
pnpm install
pnpm --filter zim dev
```

That's it. With no env vars set, the app runs in **dev mode**:
- **In-memory database** (auto-seeded regions, 20% global markup, FX 3450, mock catalog auto-synced and enabled)
- **Mock QPay** — the pay page shows a `[DEV] Mark as paid` button
- **Mock eSIM provider** — deterministic ICCIDs/LPA strings derived from the order code
- **Admin open** at `/admin` (no login in dev mode)

Full buy flow works locally: browse → checkout → pay → eSIM QR delivered.

### Dev simulation switches

| Env | Effect |
|---|---|
| `MOCK_PROVIDER_FAILURE_RATE=1` | Provisioning fails → retry queue + failure states |
| `MOCK_PROVIDER_ASYNC=true` | Provisioning completes via the webhook path (~3 s) |

## Going to production

1. **Supabase**: create a project, `supabase db push` the migrations in `supabase/migrations/`, regenerate `src/lib/supabase/types.ts`, set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`. Insert your user into `admin_users`.
2. **QPay**: merchant credentials in `QPAY_*`, set `QPAY_MOCK=false`.
3. **Real eSIM provider**: implement `EsimProvider` (see `src/lib/provider/types.ts`) in a new file, add a factory case in `src/lib/provider/index.ts` and a `normalizeWebhook` branch in `src/lib/provider/webhook.ts`, then set `ESIM_PROVIDER=<name>`. Nothing else changes.
4. **SMTP** (`SMTP_*`, `EMAIL_FROM`) for QR delivery emails; **Telegram** (`TELEGRAM_*`) for admin sale/failure alerts.
5. **Crons**: schedule `GET /api/cron/expire-orders` (~10 min) and `GET /api/cron/retry-provisioning` (~5 min) with `Authorization: Bearer $CRON_SECRET`.
6. Secrets: `ORDER_ACCESS_SECRET`, `PROVIDER_WEBHOOK_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`.

See `.env.example` for the full list.

## Architecture notes

- **Pricing**: provider cost (USD) × FX rate + markup rules (package > region > global), min-margin floor, ceil-to-₮500 rounding. Pure engine in `src/lib/pricing/engine.ts`; admin-adjustable without deploys. Every order item snapshots cost/FX/markup/retail at purchase — margin reports never drift.
- **Payment settlement**: QPay callback and status polling both funnel into `settleOrderPayment` (`src/lib/orders.ts`) — verified against QPay (callback data is never trusted) with a conditional-update transition, so duplicate callbacks and races settle exactly once.
- **Provisioning**: state machine in `src/lib/provisioning.ts` with a retry queue (exponential backoff, 5 attempts) and idempotent webhook ingestion (`webhook_events` unique constraint).
- **Data layer**: `src/lib/db/` — one repository interface, two backends (in-memory dev / Supabase production, zill's `db.ts` pattern).
- **RLS**: `packages.cost_usd` has no anon read path — catalog pages serve display-safe DTOs computed server-side.

## Commands

```bash
pnpm dev          # dev server
pnpm test         # vitest (pricing engine, mock provider)
pnpm typecheck    # tsc
pnpm lint         # biome
pnpm build        # production build
```

## Not in v1 (flagged for v2)

Multi-item cart, promo codes, automatic FX fetching, automated QPay refunds (manual in merchant portal for now), usage-tracking UI, Sentry wiring via `@zuiio/capture` (add once a DSN exists).
