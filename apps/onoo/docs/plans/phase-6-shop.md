# Phase 6 — Shop V1 (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. This is one release, delivered in dependency order rather than separate releases. It adds a public Mongolian merchandise shop at `/shop` and authenticated product/order operations to the existing Onoo admin dashboard. It does not alter trusted-record data, game lifecycles, or any public stats views.

## Decision record

| Question | Decision |
| --- | --- |
| Route | `/shop` — the Mongolian “дэлгүүр” is a better fit and leaves room for tickets and other products. |
| Architecture | Implement in `apps/onoo`; keep the shop extractable behind its own database tables, route handlers, and payment module. |
| Payment | QPay V1 through the established `qpay-js` invoice pattern: create invoice, show QR, receive callback, server-verify payment, then mark the order paid. |
| Admin | Extend the existing authenticated `/admin` dashboard with Products and Orders. |
| Delivery | One V1 release: catalogue, checkout, QPay callback, and fulfilment ship together. |

> **Version gate:** the currently published QPay Merchant documentation describes Merchant V2 (`/v2/invoice`, callback followed by `/v2/payment/check`), while the selected `qpay-js` pattern is the legacy V1 client API. Before implementation, validate the merchant account’s V1 credentials and the `qpay-js` 1.0.0 sandbox flow. The callback must still verify the invoice server-to-server before changing an order; it must never trust the callback payload alone. If the merchant account is V2-only, stop and obtain an explicit decision to update this plan rather than silently mixing protocols.

## Scope

**Expected implementation:** 1 migration; 2 public routes; 2 public shop pages plus route-local components; 1 server-only QPay module; 2 admin pages; admin APIs/data clients; navigation additions; unit, database-integration, and Playwright coverage.

**Outcome:** A visitor can browse available products, select a variant, submit their name and phone number, scan a QPay QR code, and have a verified payment become a paid order. An authenticated admin can maintain the catalogue and advance a paid order to shipped without checking QPay manually.

## Data and security contract

### Tables

```text
products
  id uuid PK
  name text, name_en text nullable, slug text unique
  description text nullable, price_mnt bigint (> 0)
  images jsonb (ordered storage-object paths)
  category text nullable
  variants jsonb ([{ size: string, stock: non-negative integer }])
  is_available boolean
  created_at, updated_at

orders
  id uuid PK
  customer_name text, phone text
  items jsonb (immutable product/variant/price/quantity snapshots)
  total_mnt bigint (> 0)
  qpay_invoice_id text unique nullable
  qpay_qr_image text nullable
  status pending | paid | shipped | cancelled
  created_at, updated_at
```

- `price_mnt` and `total_mnt` are whole MNT integers; the browser never provides an authoritative price, total, availability, or stock value.
- `items` preserves the product name, selected size, quantity, unit price, and product ID as they were at checkout. Later catalogue edits therefore cannot change an order history.
- V1 checkout supports a quantity of one for one selected product/variant. Keep `items` an array so ticket and multi-line checkout can extend the contract later without a migration.
- `images` contains only paths in a dedicated product-image bucket, not arbitrary URLs. The catalogue exposes resolved public image URLs only through its curated view.
- The product variant selected for a pending order is reserved atomically at order creation. `cmd_cancel_shop_order` returns that reservation only while the order is pending. This prevents two unpaid QR sessions from selling the same final unit; admins cancel abandoned pending orders to release stock. Paid and shipped orders never release stock.
- Customer name, phone, payment identifiers, QR payloads, and orders have no anonymous read policy and no public view. Only product data appears in `v_public_shop_products`.

### Database commands and policies

The migration must:

1. create both tables, constraints, indexes (`products.slug`, `orders.status, created_at`, and unique `orders.qpay_invoice_id`), RLS, and the product-image storage bucket/policies;
2. create `v_public_shop_products`, selecting only available products with their public fields;
3. create security-definer commands with `SET search_path = ''`, revoked `PUBLIC` execution, narrow grants, authorization checks, audit entries, and row locking where stock changes:
   - `cmd_create_shop_order` — validates the selected available variant, calculates the price from `products`, reserves stock, and writes the pending order snapshot;
   - `cmd_attach_shop_invoice` — attaches only the server-created QPay invoice and QR to that pending order;
   - `cmd_confirm_shop_payment` — idempotently transitions the matching pending order to `paid` after server-side QPay verification proves the invoice and exact MNT total;
   - `cmd_update_shop_product` and `cmd_set_shop_product_availability` — admin catalogue changes;
   - `cmd_mark_shop_order_shipped` and `cmd_cancel_shop_order` — enforce `paid → shipped` and `pending → cancelled` only.
4. grant public product-view selection only; permit admin and webhook command execution only through server-side, authenticated routes/service credentials. No browser receives QPay or service-role credentials.

Follow the command hardening in `supabase/migrations/20260712000000_paid_pilot_commands.sql`; do not use `createRouteHandlers` direct table mutation helpers for this new surface.

## Implementation sequence

| Order | Files / symbols | Change | Dependency or rationale |
| --- | --- | --- | --- |
| 1 | `supabase/migrations/<UTC>_shop_v1.sql` | Add the tables, bucket, RLS, curated view, commands, grants, and audit events above. Add a minimal seeded product fixture in `supabase/seed.sql`. | Establishes the authoritative stock, order, and privacy boundary before any page or payment code. |
| 2 | `package.json`, lockfile | Add `qpay-js` only after the V1 sandbox gate and explicit dependency approval; pin the validated version. | Onoo does not currently depend on `qpay-js`; do not copy it from the archived app without approval. |
| 3 | `src/lib/shop/qpay.ts` (new) | Server-only QPay client factory, invoice creation, and payment-check adapter. Read `QPAY_BASE_URL`, `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET`, `QPAY_INVOICE_CODE`, and a callback base URL only on the server. Generate a unique merchant invoice reference per attempt. | Isolates the legacy API and makes a future V2/extracted-shop cutover local. |
| 4 | `src/app/lib/data.ts` | Add typed server-side `getShopProducts` and `getShopProductBySlug` helpers reading only `v_public_shop_products`. | Reuses the public-data convention; no base-table catalogue reads from public pages. |
| 5 | `src/app/shop/page.tsx`, `src/app/shop/[slug]/page.tsx`, route-local components | Build mobile-first catalogue and product detail views. Include image placeholder, no-products state, unavailable/zero-stock treatment, Mongolian prices and copy, variant selector, and an order dialog collecting name + phone. | `/shop` is publicly viewable and must work at 360px without an account. |
| 6 | `src/app/api/shop/orders/route.ts`, `src/app/api/shop/qpay/callback/route.ts` | Validate the public checkout payload with Zod; obtain canonical product price/variant server-side; create the pending/reserved order; create and attach the QPay invoice; return only the QR/short-lived checkout result. The callback maps invoice to order, calls QPay payment-check, validates paid amount/currency/invoice, then invokes the idempotent confirm command. Return a safe success response for duplicate valid callbacks. | Keeps secrets and payment verification server-side. Failed invoice creation must cancel/release the newly reserved pending order; callback retries cannot double-reserve or double-mark paid. |
| 7 | `src/app/admin/products/page.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/api/products/*`, `src/app/admin/api/orders/*`, `src/app/admin/_components/sidebar-nav.tsx` | Add Products CRUD (name, slug, description, price, images, category, size/stock variants, availability) and Orders list/detail. Orders show pending/paid/shipped/cancelled, item snapshot, customer contact, amount, and timestamps; only shipped/cancel pending actions allowed. Add both sidebar links. | Reuses existing authenticated admin shell, TanStack Query forms, `AdminPageLayout`, dialogs, toasts, and query invalidation while routing writes through the commands. |
| 8 | `src/app/components/site-nav.tsx` | Add the public Shop link without breaking the horizontal mobile navigation. | Makes the new public entry point discoverable. |
| 9 | shop tests | Add unit tests for payload/schema, item snapshots, price authority, payment-result mapping, and legal status transitions; database integration tests for RLS, stock reservation/release, and duplicate callbacks; Playwright coverage for browse → order → QR and admin paid → shipped (QPay API mocked at the server boundary). | Defends the financial and inventory contract end-to-end without calling QPay in tests. |

## QPay flow

```text
Visitor selects available product + size
  → POST /api/shop/orders with name, phone, product ID, variant
  → server validates input, canonical product, price, and stock
  → cmd_create_shop_order atomically reserves stock and creates pending order
  → server creates QPay invoice and cmd_attach_shop_invoice stores invoice ID + QR
  → browser displays QR
  → QPay callback reaches /api/shop/qpay/callback
  → server calls QPay payment-check for that invoice
  → exact paid invoice + MNT total verified
  → cmd_confirm_shop_payment moves pending → paid (idempotently)
  → admin sees paid order and cmd_mark_shop_order_shipped moves paid → shipped
```

## Edge cases

- Invalid, unavailable, or out-of-stock product/size: reject before invoice creation; never accept browser-provided totals.
- Duplicate checkout submission: use a server-generated order/invoice reference and disable the submit button client-side; database constraints/commands must make repeats safe rather than create duplicate reservations.
- QPay invoice creation failure: cancel the newly created pending order and return its reserved stock before responding with an actionable Mongolian error.
- Callback with unknown invoice, unpaid result, wrong total/currency, or mismatched invoice: log securely, leave the order pending, and return a non-success response for QPay retry. Never mark it paid.
- Duplicate valid callback: return success and leave the existing paid order unchanged.
- Callback after an admin-cancelled order: do not silently fulfil it; record the exception for manual QPay/refund handling. A paid order cannot be cancelled by the V1 admin flow because refunds are out of scope.
- Product modified or disabled after checkout: fulfil from the immutable order snapshot; the existing pending reservation remains valid.
- QR viewed on a shared device: do not expose an order lookup endpoint by phone or sequential order ID. The initial response is the only anonymous QR delivery path.

## Verification

1. `pnpm validate:types` — no TypeScript errors in routes, components, or QPay adapter.
2. `pnpm lint` — Biome passes for all changed code.
3. `pnpm test:unit` — shop domain tests pass.
4. `pnpm test:integration` against local Supabase — anonymous users can read only `v_public_shop_products`; cannot read orders; stock reservation and release are transactional; duplicate `cmd_confirm_shop_payment` calls yield one paid order.
5. `pnpm test:e2e` with QPay adapter mocked — product selection produces a QR state, callback verification produces paid, and an authenticated admin can mark it shipped.
6. Browser smoke test at 360px and desktop — `/shop` empty, in-stock, unavailable, and no-image states render intentionally; navigation reaches Shop; no console errors.
7. Run the repository FastGate from the monorepo root: `pnpm run verify` — record its exit code and any unrelated failures exactly.
8. Before production configuration, create a real sandbox invoice, scan it, observe callback delivery, and observe exactly one verified order transition. Production credentials, merchant configuration, and deployment remain explicit approval gates.

## Non-goals

- Cart, multi-product checkout, discounts, coupons, delivery pricing, address collection, shipment tracking, receipts/eBarimt, refunds, automated expiry cleanup, ticketing, and customer accounts.
- New app/project, native mobile shop, payment polling/cron reconciliation, manual QPay checking, or a public order-history endpoint.
- Changes to athlete statistics, trusted-record commands, game statuses, public sports views, or league subscription billing.
