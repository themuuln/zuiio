# E-Commerce Gap Implementation Plan

## Goal
Close the feature gap between Zer and shop.mn for Mongolian SMB e-commerce.

## Research Summary
Based on web research and codebase audit, shop.mn offers: coupon codes, gift cards, smart promotions (1+1, 2+1, buy X get Y), Google Analytics, Meta Pixel, SEO settings, per-shop subdomains + custom domains, review management, blog/articles, webhooks, AI poster generator, AI product descriptions.

Zer currently has: admin-only discounts, gift packaging (not gift cards), loyalty program, accounting, manufacturing, employee RBAC, email notifications, reports/statistics.

## Priority Strategy
**Principle:** Build features that (a) drive customer acquisition (convince shop.mn users to switch) and (b) are uniquely defensible when combined with Zer's ERP strengths (accounting, inventory, manufacturing).

**Tier 1 — Highest Impact (Build Now)**
✅ **All Tier 1 items shipped (2026-08-03):** coupon codes, gift cards, promotions engine, GA4 + Meta Pixel settings with per-org storefront injection, and SEO settings (meta_title/meta_description/og_image + dynamic sitemap).

**Tier 2 — Important (Build Soon)**
✅ **All Tier 2 items shipped (2026-08-03):** product reviews (public submit → moderation → approved display) and per-org blog/articles CMS with public list + detail pages.

**Tier 3 — Strategic (Build Later / Buy)**
✅ **Items 8–9 shipped (2026-08-03):** generic webhooks (admin CRUD + HMAC-signed delivery on sale/expense/invoice/product/stock/review/blog events) and custom domains (verified custom_domain per org + middleware host→slug rewriting + canonical URLs/sitemap). Items 10–11: AI features were already covered by Zer's existing `ai/poster`, `ai/enhance`, `ai/logo`, `ai/naming` tools; shop.mn-style subdomains are superseded by custom-domain routing (Zer keeps /[slug] paths).

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 1 | Coupon codes | S | Customers expect to enter codes at checkout. Quick win, high visibility. |
| 2 | Gift cards | S | Prepaid cards drive cash flow. Common in Mongolian retail. |
| 3 | Promotions engine | M | "1+1", "2+1", "X авбал Y үнэгүй" — the #1 marketing tactic for Mongolian SMBs. |
| 4 | GA4 + Meta Pixel | S | Every store owner wants to track ads. Settings-only, no backend. |
| 5 | SEO settings | S | Per-org meta_title/description, dynamic sitemap. Quick infrastructure. |

Subtotal: ~2 weeks for a single developer.

**Tier 2 — Important (Build Soon)**

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 6 | Product reviews | M | Social proof drives conversion. Requires moderation UI. |
| 7 | Blog/articles | M | Content marketing for SEO. Basic CMS per org. |

Subtotal: ~1 week.

**Tier 3 — Strategic (Build Later / Buy)**

| # | Feature | Effort | Decision |
|---|---------|--------|----------|
| 8 | Generic webhooks | L | ✅ Shipped (2026-08-03). Admin CRUD UI, HMAC-SHA256 signatures, delivery retries, delivered on sale/expense/invoice/product/stock/review/blog events. |
| 9 | Custom domains | XL | ✅ Shipped (2026-08-03). `custom_domain` + `domain_verified` on org public profile; middleware rewrites custom host → /[slug]; canonical URLs + sitemap use the custom domain. DNS/SSL provisioning is config-only (org owner points CNAME/A). |
| 10 | AI features | XL | Covered — Zer already ships AI poster/enhance/logo/naming (3rd-party model backends). No gap. |
| 11 | *shop.mn subdomain | XL | Superseded — custom-domain routing covers per-shop hosts; Zer keeps /[slug] URL paths. |

## Architecture Decisions

### Coupon System
- Coupons ARE discounts with a `code` field and usage tracking
- Reuse the existing `discounts` table approach but with a separate `coupons` table
- Coupons can reference discount definitions or be standalone
- Validation: code → is_active → valid_from/until → usage_limit → min_purchase → apply

### Gift Cards
- Simple: `gift_cards` table with `code`, `balance`, `currency`, `expires_at`
- Issue (sell), top up, redeem at checkout
- Partial redemption support
- Track in accounting as liability

### Promotions Engine
- `promotions` table: conditions JSON, rewards JSON, validity period
- Conditions: min_quantity (1+1), min_amount, specific_products, specific_categories
- Rewards: free_product, percentage_discount, fixed_discount, free_shipping
- Evaluation: evaluated at checkout against cart contents

### Analytics
- Store GA_MEASUREMENT_ID and META_PIXEL_ID in `organization_public_profiles`
- Inject <script> tags in the public storefront layout dynamically
- **Do not** inject in dashboard/admin pages

### SEO
- Add `meta_title`, `meta_description` columns to `organization_public_profiles`
- Pass to generateMetadata() in `[slug]` pages
- Generate dynamic sitemap from all organizations with catalog_enabled=true
- Add `og_image` field for social sharing

## Database Migrations

All migrations follow the `YYYYMMDDHHMMSS_description.sql` naming convention.

1. `20260730000001_create_coupons.sql` — coupons table + app_permission enum values
2. `20260730000002_create_gift_cards.sql` — gift_cards table + transactions table
3. `20260730000003_create_promotions.sql` — promotions + promotion_conditions + promotion_rewards
4. `20260730000004_add_analytics_seo_fields.sql` — GA/Meta/SEO columns on org_public_profiles
5. `20260730000005_create_reviews.sql` — product reviews
6. `20260730000006_create_blog_posts.sql` — per-org blog/articles

## UI Pattern (consistent with existing Zer)

All CRUD uses:
- **DetailDrawer** for create/edit/detail
- **SlideInDrawer** for list filters
- **react-hook-form + zod** for form validation
- **Server Actions + FormData** for all mutations
- **useOptimisticCreate/Update/Delete** from @zuiio/query
- **DataTable** for list views (from shadcn)

## Testing Strategy
- Every Server Action: unit test with mocks
- Every RLS policy: integration test via direct Postgres
- Coupon validation: edge cases (expired, max_uses, min_purchase)
- Gift card redemption: partial balance, concurrent redemption
- Promotion evaluation: combinatorial conditions

---

## Effort Summary (Single Developer)

| Phase | Items | Effort |
|-------|-------|--------|
| Phase 1: Coupons | Migration, actions, drawer, checkout integration, tests | ~3 days |
| Phase 2: Gift Cards | Migration, actions, drawer, checkout integration | ~3 days |
| Phase 3: Promotions | Migration, engine, actions, drawer, checkout eval | ~5 days |
| Phase 4: Analytics & SEO | Settings fields, script injection, sitemap | ~2 days |
| Phase 5: Reviews | Migration, moderation, display | ~4 days |
| Phase 6: Blog | Migration, CMS, public display | ~4 days |
| **Total** | | **~3 weeks** |
