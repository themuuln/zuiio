# Production Readiness Plan — Zer

_Audit date: 2026-07-12. Based on a 5-dimension codebase audit (features, security, testing/CI, observability/ops, data layer)._

Overall assessment: **~80% ready. Feature surface is nearly complete; the blockers are data-integrity, security hardening, and ops gaps — not missing modules.**

---

## Phase 0 — Data Integrity Blockers (fix before any launch)

These can corrupt financial/inventory data under real concurrent usage.

### 0.1 Stock decrement race condition (TOCTOU)
- `src/lib/stock-utils.ts:67-97` (products) and `:103-133` (variants) use fetch-then-update. Two concurrent sales can oversell and drive stock negative.
- The fix already exists in the DB: migration `20260624000001` defines `process_sale_stock_decrement(p_org_id, p_items)` and `decrement_product_stock_safe(...)` with `FOR UPDATE` locking — **but nothing calls them**.
- Action: switch `createSale()` (`src/app/(dashboard)/sales/new/actions.ts`) and shop checkout (`src/app/(dashboard)/shop/actions.ts`) to the RPC. Delete or deprecate the client-side decrement path.

### 0.2 Sale creation is non-atomic
- `sales/new/actions.ts:196-341`: sale → sale_items → stock_movements → stock decrement are separate client calls with manual client-side rollback. Partial failure leaves orphaned sales or unrolled stock.
- Action: move the whole flow into a single Postgres RPC (extend `process_sale_stock_decrement` or new `create_sale_atomic`). Same for restock's `Promise.all()` mutations (`inventory/restock/actions.ts`).

### 0.3 Rate limiting on auth endpoints
- `src/app/(auth)/login/actions.ts` and `register/actions.ts` have no `rateLimit()` despite it existing in `@zuiio/core`. Brute-force + enumeration exposure.
- Action: add `rateLimit()` keyed by IP+email to login, register, and password reset.

**Exit criteria:** concurrent-sale e2e/unit test proving no oversell; sale-creation failure injection test proving no orphaned rows; rate-limit test on login.

---

## Phase 1 — Security & Audit Hardening (week 1)

1. **Audit financial deletions** — `deleteJournalEntry()` and `toggleAccountActive()` (`accounting/actions.ts:379-435`) don't log audit events. Extend audit coverage to role/permission changes and product/expense/purchase mutations (only ~18 `logAuditEvent` call sites today).
2. **Security headers** — `next.config.ts` has no CSP, HSTS, X-Frame-Options, X-Content-Type-Options. Add a headers block.
3. **Sentry PII leak** — `sendDefaultPii: true` unconditionally in `sentry.client.config.ts:18` and `sentry.edge.config.ts:18`. Disable in production; align trace sample rates (server 5% vs client/edge 15%).
4. **Defensive org scoping** — deletes by ID only (commission payouts, sales rollback paths) rely solely on RLS. Add `.eq('organization_id', orgId)` to all mutation queries.
5. **Superadmin gate** — single env var (`SUPERADMIN_EMAIL`), no MFA, no audit trail. At minimum: audit-log every superadmin action; consider MFA.
6. **Zod-validate server action inputs** — actions parse raw FormData with `getString()`; migrate the money-touching actions (sales, accounting, payroll) to zod schemas first.

---

## Phase 2 — Data Layer Consistency (weeks 1–2)

1. **withDbCapture adoption: 32% → 100%** — 387 of 572 `.from()` calls are raw (worst: `src/lib/invoicing.ts`, `src/lib/reports.ts`, `src/app/r/invoice/[token]/page.tsx`). This is an ENFORCED rule in AGENTS.md; consider adding a lint script like `capture-check.mjs` to gate it.
2. **Pagination** — customers list (`customers/page.tsx:42-49`) loads all rows with no limit. Sweep all list pages; standardize on `.range()` like products already does.
3. **Soft-delete consistency** — only `products` has `deleted_at`; filtering is ad-hoc (30 call sites). Decide scope: either extend soft delete to all transactional tables + partial indexes, or document products-only.
4. **Missing indexes** — add `organization_id` indexes to `order_templates`, `product_presets`, `business_events`, `customer_segments`, `price_books`.
5. **Fire-and-forget failures** — invoice creation and journal posting after sale commit can silently fail. Surface failures (retry or at least notify).

---

## Phase 3 — Ops & Observability (week 2)

1. **Env var documentation + startup validation** — `.env.example` is missing `SENTRY_DSN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`, `DEEPSEEK_API_KEY`. Add all; add a startup check (or `/api/health` that validates) so misconfiguration fails loudly.
2. **Health endpoint** — add `GET /api/health` (DB ping + env presence) for uptime monitoring.
3. **Cron reliability** — `/api/cron/setup` must be manually invoked post-deploy or daily reports never send. Automate (Vercel cron or deploy hook) and monitor.
4. **Notification durability** — Telegram sends have no retry/queue; notification record is only inserted after a successful send. Make delivery idempotent, log failures to Sentry.
5. **Email fallback** — SMTP is fully user-configured with no fallback provider; failures are silent. At minimum alert ops when a send fails.
6. **Backups** — document/verify Supabase PITR + retention policy. Nothing exists today.
7. **SEO basics** — add `robots.ts`, `sitemap.ts`, and metadata for public pages (`/landing`, public storefront).
8. **Deployment checklist** — write `docs/DEPLOYMENT.md` covering env vars, cron setup, Sentry source maps, backup verification.

---

## Phase 4 — Testing & CI Gates (week 2–3, parallel with above)

1. **Add lint to CI** — `npm run lint` (biome + capture-check) is not in `.github/workflows/e2e.yml`. The two "ENFORCED" AGENTS.md rules currently don't block anything.
2. **Fix the 21 skipped e2e tests** — mostly test-data setup fragility (`seed.spec.ts` alone has 7). Make seeding deterministic.
3. **Action-level unit tests** — 43 server actions, 1 tested. Prioritize: sales creation, stock decrement (concurrency test), accounting posting, payroll.
4. **RLS tests** — 31 migrations define policies, zero SQL-level tests. Add pgTAP or supabase test harness for cross-org isolation on the core tables.
5. **Update AGENTS.md** — it claims full test coverage and full optimistic-mutation migration; both are false and will mislead future agents.

---

## Phase 5 — Feature Completion & Polish (week 3+)

1. **Payroll** — list view only; no "create payroll run" UI or calculation flow (`hr/payroll/payroll-content.tsx`). Either finish it or hide the feature gate until done.
2. **Optimistic mutation stragglers** — Sales create (highest-traffic!), Expenses create/edit, Discounts edit, Warehouses edit, Employees create/edit, Restock edit.
3. **Landing page** — placeholder metrics in `hero.tsx:47-49` ("500+ organizations"); footer links to `#` for /about, /blog, /contact, /privacy, /terms (`footer.tsx:18-27`). Privacy + terms pages are effectively required for production.
4. **Shop oversell UX** — cart warns but allows proceeding; align with sales register's disable-on-oversell behavior (Phase 0.1 makes the server safe regardless).
5. **Preset brand image FIXMEs** — `settings/actions.ts:126`.
6. **PWA manifest** — hardcoded name/theme, no per-org branding.

## Deferred / Explicit Non-Goals for v1
- i18n framework (app is intentionally Mongolian-only; revisit if expanding)
- Product analytics (recommended soon after launch, not a blocker)
- Permission RPC caching (perf, not correctness)
- ISR/`use cache` adoption (perf optimization once traffic exists)
- DRY refactors from `DRY-PLAN.md`

---

## Suggested Order of Attack

| Order | Work | Effort | Risk it removes |
|---|---|---|---|
| 1 | Phase 0 (atomic sales + stock RPC, auth rate limiting) | ~2–3 days | Data corruption, negative stock, brute force |
| 2 | Phase 1 items 1–4 (audit gaps, headers, Sentry PII, org scoping) | ~2 days | Compliance/security |
| 3 | Phase 4 item 1 (lint in CI) + Phase 3 items 1–2 (env docs, health) | ~half day | Silent misconfig, quality drift |
| 4 | Phase 2 (withDbCapture sweep, pagination, indexes) | ~3–4 days | Silent failures, scale problems |
| 5 | Phase 3 remainder + Phase 4 remainder | ~1 week | Ops blindness, regressions |
| 6 | Phase 5 (payroll, optimistic stragglers, landing) | ~1 week | UX/feature gaps |
