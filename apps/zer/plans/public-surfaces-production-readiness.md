# Public Surfaces Production Readiness

## Context

Zer's public catalog, product detail, invoice, receipt, and shared-report surfaces are not ready for production. Anonymous callers can currently enumerate tokenized invoice/report data, catalog publication is implicit and exposes internal inventory fields, receipt sharing is not a distinct public workflow, and the production build is blocked by an unrelated onboarding type error.

This plan uses a security-first cutover: close direct anonymous table access before adding discoverability or document polish. Public access will be available only through narrowly projected RPCs, and all catalog/document sharing will be opt-in.

## Scope and decisions

### In scope

- Stop anonymous enumeration of invoices, invoice items, and shared reports.
- Replace raw public table reads with token-validating RPCs.
- Hash share tokens at rest and add expiry, rotation, and revocation.
- Add an explicit, default-private public catalog/profile model.
- Make product detail URLs discoverable and complete.
- Add a distinct tokenized public receipt route.
- Complete public invoice/receipt legal, payment, print, and PDF behavior.
- Add public organization profile data, metadata, structured data, accessibility, pagination, and responsive images.
- Fix blocking-prerender and expected-404 capture behavior on public routes.
- Fix the current onboarding TypeScript build blocker.
- Add database, unit, and browser contracts for every public-access boundary.

### Explicit decisions

1. Direct `anon` reads on `invoices`, `invoice_items`, and `shared_reports` are removed; knowing a token is proven only inside an RPC.
2. Tokens remain 32 random bytes, but only a SHA-256 hash is stored. The raw token is returned once when a link is created or rotated.
3. Existing raw tokens are hashed during migration so existing URLs remain valid; raw token columns are removed in the final cutover.
4. Recommended default expiries are 7 days for reports, 90 days for invoices, and 30 days for receipts. Revocation and rotation are always available.
5. Catalog publication is default-private at both organization and product level. Exact stock, minimum stock, SKU, and barcode remain private unless an explicit organization visibility setting permits a safe field.
6. Public documents render immutable seller/buyer/line/totals snapshots so later profile edits do not rewrite historical documents.
7. Tokenized document routes are `noindex, nofollow`, receive `Referrer-Policy: no-referrer`, and are not placed in shared caches.
8. The existing product drawer becomes an optional quick preview; the canonical interaction is a real product detail link.
9. A sale receipt is not modeled as an invoice. `/r/receipt/[token]` receives a receipt-specific projection and presentation.

### Non-goals

- Building checkout or online payment processing.
- Publishing customer account history.
- Replacing the authenticated products, invoices, reports, or POS modules.
- Adding a general-purpose CMS.
- Exposing exact inventory quantities by default.

## Release strategy

Use a controlled security cutover rather than a long compatibility period:

1. Deploy the database migration that adds token hashes and safe RPCs, removes vulnerable anonymous policies, and migrates existing token hashes.
2. Immediately deploy the application code that calls the new RPCs and writes only hashes.
3. Accept a short maintenance window in which public links fail closed rather than leaving enumeration open.
4. Run remote anonymous-denial checks before re-enabling link creation in the UI.

Do not begin the public UX phases until the P0 security gate passes.

## Files to change

Migration filenames below must be generated with `supabase migration new <name>`; do not invent timestamps manually.

| File | Action | What changes |
|---|---|---|
| `supabase/migrations/<generated>_harden_public_share_access.sql` | Create | Drop token-based anonymous table policies; add token-hash/lifecycle columns; migrate existing tokens; define safe invoice/report RPCs; revoke default function execution and grant only intended roles. |
| `supabase/migrations/<generated>_add_public_catalog_controls.sql` | Create | Add the one-to-one public organization profile, product publication flag, visibility defaults, and publication-aware catalog/detail RPCs. |
| `supabase/migrations/<generated>_add_public_receipt_and_document_snapshots.sql` | Create | Add receipt sharing fields and immutable seller, buyer, branch, line, totals, tax, payment, and terms snapshots required by public documents. |
| `supabase/tests/public-sharing-rls.test.sql` | Create | pgTAP contracts proving anonymous table enumeration fails while valid, active token RPCs return only their intended projection. |
| `supabase/tests/public-catalog-visibility.test.sql` | Create | Contracts for default-private org/product publication and suppression of internal inventory fields. |
| `src/lib/database.types.ts` | Regenerate | Include all new columns, tables, and RPC signatures after remote migrations are applied. |
| `src/lib/public-share-token.ts` | Create | Generate 32-byte raw tokens, hash them consistently, validate token shape, and calculate default expiries without exposing raw tokens to logs. |
| `src/lib/public-catalog.ts` | Create | Typed cached catalog/profile/detail readers with safe DTO parsing and catalog/product cache tags. |
| `src/app/(onboarding)/onboarding/actions.ts` | Modify | Narrow or guard nullable `organization_id` before the non-null insert so the production typecheck succeeds. |
| `src/app/(dashboard)/invoices/actions.ts` | Modify | Store token hashes, set expiry, add rotate/revoke actions, return the raw token once, and audit lifecycle events. |
| `src/lib/invoicing.ts` | Modify | Stop storing an automatically public raw invoice token when creating an invoice from a sale; create document snapshots and leave sharing opt-in. |
| `src/app/(dashboard)/invoices/[id]/invoice-detail-client.tsx` | Modify | Display link state, expiry, copy-on-create, rotate, and revoke controls without expecting the raw token to be recoverable later. |
| `src/app/(dashboard)/invoices/[id]/invoice-detail-content.tsx` | Modify | Pass safe share lifecycle state and complete document snapshot data to the client presentation. |
| `src/app/(dashboard)/reports/actions.ts` | Modify | Use `withDbCapture`, store token hashes/expiry, rotate existing links, revoke links, and audit lifecycle changes. |
| `src/app/r/[token]/page.tsx` | Modify | Replace direct `shared_reports` reads and broad report queries with `get_public_report_data`; separate expected 404 control flow from captured failures. |
| `src/app/r/invoice/[token]/page.tsx` | Modify | Read only `get_public_invoice`, render the complete immutable document, and move dynamic access behind Suspense without catching `notFound()`. |
| `src/app/r/invoice/[token]/pdf/route.ts` | Create | Validate the token through the same public RPC and stream a localized invoice PDF with safe response headers. |
| `src/app/r/receipt/[token]/page.tsx` | Create | Render the tokenized public receipt projection, including seller/branch, lines, totals, payment splits, tax/eBarimt fields, and revoked/expired handling. |
| `src/app/r/receipt/[token]/pdf/route.ts` | Create | Validate the receipt token and stream the same receipt contract as a PDF. |
| `src/app/r/loading.tsx` | Create | Provide a document-shaped fallback for dynamic token lookups so page chrome can prerender and navigation streams correctly. |
| `src/app/r/layout.tsx` | Modify | Add document-wide `noindex, nofollow` metadata and a minimal public document shell. |
| `next.config.ts` | Modify | Add `X-Robots-Tag` and `Referrer-Policy` headers for `/r/:path*` using the current Next.js 16 API. |
| `src/components/public/public-document-shell.tsx` | Create | Shared print-safe document structure, seller/buyer blocks, status, totals, and action placement for invoice and receipt. |
| `src/components/public/public-document-actions.tsx` | Create | Accessible print, PDF download, and copy-link actions with Mongolian labels and print-hidden styling. |
| `src/components/shop/receipt-content.tsx` | Modify | Capture all three Supabase query failures, distinguish not-found from query failure, and expose a share action for authorized users. |
| `src/app/(dashboard)/shop/receipt/[id]/actions.ts` | Create | Create, rotate, and revoke receipt share links with organization/branch authorization and lifecycle audit events. |
| `src/components/shop/receipt-print-button.tsx` | Modify | Reuse the shared print action styling and accessible labeling rather than maintaining a separate print treatment. |
| `src/app/(dashboard)/settings/organization/actions.ts` | Modify | Read/write the public organization profile with explicit organization scoping and cache invalidation. |
| `src/app/(dashboard)/settings/organization/org-settings-content.tsx` | Modify | Add a public-profile/catalog section with opt-in publishing, preview, and visibility controls. |
| `src/app/(dashboard)/products/actions.ts` | Modify | Support product publication updates, enforce organization/branch scope, and invalidate catalog/detail tags. |
| `src/app/(dashboard)/products/new/actions.ts` | Modify | Create products as private by default and accept an explicit publication choice. |
| `src/components/products/product-create-drawer.tsx` | Modify | Add Mongolian publication controls and explain which fields become public. |
| `src/components/products/product-edit-drawer.tsx` | Modify | Add publish/unpublish controls and a link to preview the public detail page. |
| `src/app/[slug]/products/page.tsx` | Modify | Read the safe cached public catalog/profile DTO, add dynamic metadata, and keep the page shell outside Suspense. |
| `src/app/[slug]/products/products-page-client.tsx` | Modify | Use URL-backed search/category/page state, render bounded pages, and preserve loading/empty/error structure. |
| `src/app/[slug]/products/product-detail-drawer.tsx` | Modify | Use an accessible Drawer/Dialog, add a canonical detail link, use 44px controls, and localize all labels. |
| `src/app/[slug]/products/[id]/page.tsx` | Modify | Render the complete publishable detail contract, compact missing-image state, variants, organization summary, canonical metadata, and Product/Offer JSON-LD. |
| `src/app/[slug]/page.tsx` | Create | Dedicated public organization profile with branding, contact details, hours, policies, and a link to the catalog. |
| `src/components/ui/optimized-image.tsx` | Reuse/modify | Ensure public catalog/detail images use the existing responsive optimized-image path instead of raw `<img>`. |
| `tests/public-share-token.test.ts` | Create | Token generation, hash determinism, malformed token rejection, and expiry calculations. |
| `e2e/fixture.ts` | Modify | Add typed helpers for public organizations/products and active, expired, and revoked document-share fixtures. |
| `e2e/seed.spec.ts` | Modify | Seed deterministic same-organization public-surface records without leaking fixture tokens to logs. |
| `e2e/security-fixes.spec.ts` | Modify | Add direct anonymous enumeration-denial, valid-token, invalid-token, expired-token, and revoked-token assertions. |
| `e2e/public-surfaces.spec.ts` | Create | Cover catalog publication, real detail links, metadata, product variants, org profile, invoice, receipt, report, print/PDF, keyboard, and mobile behavior. |
| `e2e/midscene-remaining.spec.ts` | Modify | Select an organization slug and product from the same organization or remove the unsafe cross-org public-product fixture logic. |

## Implementation order

### Phase 0 — release gate and fixtures

1. Fix `src/app/(onboarding)/onboarding/actions.ts` so `pnpm typecheck` can reach the public-surface changes without an unrelated failure.
2. Add deterministic local fixtures for one organization with private/public products and active/expired/revoked invoice, receipt, and report links.
3. Add failing database/E2E security tests before changing policies.

**Gate:** the tests reproduce current enumeration, and the application typecheck passes beyond the existing onboarding error.

### Phase 1 — close anonymous data exposure

1. Generate `harden_public_share_access` with the Supabase CLI.
2. Add `token_hash`, `expires_at`, `revoked_at`, and `rotated_at` to invoices/shared reports; backfill hashes from existing raw tokens.
3. Recreate authenticated invoice/item/report policies using organization, permission, and branch predicates only. Remove every `OR token IS NOT NULL` and `USING (true)` anonymous policy.
4. Revoke table `SELECT` from `anon` where public table access is no longer required.
5. Define `get_public_invoice(p_token)` and harden `get_public_report_data(p_token)`:
   - reject malformed tokens before hashing;
   - compare only indexed token hashes;
   - reject expired/revoked rows;
   - project only approved fields;
   - fully qualify identifiers and fix `search_path`;
   - revoke `EXECUTE` from `PUBLIC`, then grant only `anon` and `authenticated`.
6. Update report/invoice actions and routes to use the new contract.
7. Remove raw token columns after all callers are migrated.
8. Apply remotely, regenerate `src/lib/database.types.ts`, and run database advisors.

**Gate:** unfiltered anonymous table queries return permission denied or zero rows; a valid token returns exactly one projected document; invalid, expired, and revoked tokens return no data.

### Phase 2 — make publication explicit

1. Generate `add_public_catalog_controls`.
2. Add `organization_public_profiles` keyed by `organization_id`, with `catalog_enabled = false` and explicit nullable public contact/brand fields.
3. Add `products.is_public = false` and publication timestamps/actor fields.
4. Keep exact stock, minimum stock, and internal identifiers out of public RPCs by default. Return an availability state instead of a quantity.
5. Update `get_public_products`, `get_public_product`, and `get_public_categories` to require both organization catalog opt-in and product publication.
6. Add settings and product-form controls with clear Mongolian disclosure copy and preview links.
7. Invalidate catalog/profile/product cache tags after publication changes.

**Gate:** a new organization and new product expose nothing anonymously until both levels are explicitly enabled; unpublishing either level removes it immediately.

### Phase 3 — complete catalog, product detail, and organization profile

1. Move public data reads into typed cached helpers and keep the static page shell outside Suspense.
2. Replace button-only product cards with semantic links to `/${slug}/products/${id}`. Retain quick preview only as a secondary action.
3. Make search, category, and pagination state URL-addressable.
4. Fetch/render variants, images, attributes, description, price/availability, and the public organization summary from the detail RPC.
5. Add a compact missing-image layout and use the existing optimized image component.
6. Add `/${slug}` as the organization profile and connect it bidirectionally with the catalog.
7. Add dynamic localized metadata, canonical URLs, Open Graph data, and Product/Offer/Organization JSON-LD.

**Gate:** every visible product has a copyable canonical URL; direct navigation renders the same product; unpublished or cross-org IDs return 404; 100+ products remain bounded by server pagination.

### Phase 4 — production invoice, receipt, and report documents

1. Generate the snapshot/receipt migration and populate immutable snapshots at invoice/receipt creation.
2. Make invoice sharing opt-in; update `createInvoiceFromSale` so completing a sale does not silently publish a document.
3. Add receipt link create/rotate/revoke actions for authorized users.
4. Define `get_public_receipt(p_token)` with the same security properties as invoice/report RPCs.
5. Build shared print-safe document primitives, but keep invoice and receipt terminology/totals distinct.
6. Invoice content must include issue/due date, outstanding balance, seller/buyer legal details, branch, subtotal, discounts, tax, payment instructions, terms, status, and notes.
7. Receipt content must include seller/branch, receipt number/time, cashier, lines, discounts/tax, payment method/splits, change, notes, and eBarimt fields when present.
8. Add print and token-validated PDF endpoints. PDF and HTML must consume the same DTO so totals cannot drift.
9. Move token lookups under Suspense, keep `notFound()` outside broad catches, and capture only real failures.
10. Add expiry, rotate, and revoke controls to invoice/report/receipt management UI and audit those lifecycle operations.

**Gate:** valid anonymous links render and download matching documents; expired/revoked/invalid links are indistinguishable 404s; no token is logged, cached publicly, or leaked through referrers.

### Phase 5 — accessibility, responsive behavior, and performance

1. Replace the custom mobile filter overlay with the existing accessible Drawer/Dialog primitive.
2. Enforce 44px touch targets, focus transfer/trap/restoration, Escape close, body-scroll lock, semantic dialog labeling, and Mongolian accessible names.
3. Test 320px, 375px, 768px, 1024px, and 1440px layouts plus print CSS.
4. Add responsive image `sizes`, explicit aspect handling, and lazy loading below the fold.
5. Confirm token documents are excluded from indexing and shared caches while public catalog/profile pages use controlled cache tags.
6. Remove blocking-prerender warnings from all public routes.

**Gate:** keyboard-only and mobile workflows complete without focus loss or overflow; no accessibility, console, React, or blocking-prerender warnings remain.

### Phase 6 — release verification

1. Run database tests and advisors against local Supabase.
2. Apply migrations to the linked remote project, regenerate types, and verify migration history.
3. Repeat anonymous REST/RPC checks against the remote project without printing data or tokens.
4. Run changed-file diagnostics, targeted unit/E2E suites, design checks, and the filtered production build.
5. Manually exercise valid/invalid/expired/revoked links and publication changes in a real browser.
6. Release only after the P0/P1 gates and the build pass; document any lower-priority UI deferral explicitly rather than treating it as production-ready.

## Edge cases

- Existing raw invoice/report URLs must continue to resolve after their stored values are converted to hashes.
- The management UI cannot redisplay a raw token after creation; it must offer rotation when the user loses the URL.
- Malformed, unknown, expired, and revoked tokens must produce the same external 404 response.
- Token values must never appear in capture context, analytics, audit descriptions, server logs, or PDF filenames.
- Token rotation must invalidate the previous URL atomically.
- Concurrent rotations must leave exactly one active token hash.
- An organization can publish its profile while keeping the catalog disabled.
- Enabling a catalog with zero published products must show a useful public empty state, not internal product controls.
- A published product becomes unavailable immediately when deleted, archived, moved to another organization, or explicitly unpublished.
- Cross-organization product IDs must never resolve under another organization slug.
- Products without images, variants, price, or description must retain a compact, valid layout.
- Public availability must not reveal exact stock or minimum-stock thresholds.
- Historical invoice/receipt seller and buyer details must not change after profile/contact edits.
- Deleted contacts/products must not erase document snapshot text.
- Documents with zero tax, multiple discounts, partial payment, overpayment/change, multiple payment splits, or cancelled status must calculate and label totals correctly.
- PDF output and HTML output must use the same money rounding and currency formatting.
- Public document failures must not be mislabeled as 404 when the database is unavailable.
- Catalog cache invalidation must cover organization disable, product publish/unpublish, price/image/variant edits, and slug changes.

## Verification matrix

| Check | Command/scenario | Expected result |
|---|---|---|
| Database security | `pnpm exec supabase test db` | Enumeration tests fail before the migration and pass after it; valid-token RPC projections pass. |
| Database advisors | `pnpm exec supabase db advisors --local` | No new security or performance findings for functions, RLS, or token-hash indexes. |
| Migration state | `pnpm exec supabase migration list --local` and remote migration listing | Local and remote migrations contain the same three public-surface migrations. |
| Generated types | `pnpm exec supabase gen types typescript --linked > src/lib/database.types.ts` | Generated types include the new profile, lifecycle fields, and public RPC signatures without manual casts. |
| Token unit contract | `pnpm exec tsx --test tests/public-share-token.test.ts` | Generation, hashing, validation, rotation, and expiry cases pass. |
| Security E2E | `pnpm exec playwright test e2e/security-fixes.spec.ts` | Direct anonymous enumeration is denied; valid/invalid/expired/revoked link behavior matches the contract. |
| Public UX E2E | `pnpm exec playwright test e2e/public-surfaces.spec.ts` | Catalog, detail, org, invoice, receipt, report, PDF, keyboard, and responsive scenarios pass. |
| Static validation | `pnpm typecheck && pnpm lint && pnpm design:check` | Zero type, lint, capture-rule, and design-rule failures. |
| Runtime smoke test | Start `pnpm dev`, then exercise the routes in a real browser | No console, React, Supabase, accessibility, or blocking-prerender warnings. |
| Production release gate | `pnpm build` | Build completes successfully, including TypeScript validation. |
| Remote security smoke | Anonymous unfiltered REST queries plus valid/invalid RPC calls | Tables cannot be enumerated; only a matching active token returns a narrow DTO. |

## Suggested commit sequence

1. `fix: close anonymous public document access`
2. `feat: add private-by-default catalog publishing`
3. `feat: make public products and organization addressable`
4. `feat: add secure public invoice and receipt documents`
5. `fix: harden public page accessibility and performance`
6. `test: enforce public surface release contracts`

Each commit must include the tests for the observable contract it introduces. Do not merge a UI phase if its underlying database security gate is still failing.
