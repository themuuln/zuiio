---
date: 2026-06-05T20:43:26+0800
author: Temuulen Undrakhbayar
commit: 42436c0
branch: main
repository: tamga
topic: "Marketplace Revenue Features"
tags: [marketplace, revenue, vip, boost, seller-badge]
status: ready
parent: ".rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md"
last_updated: 2026-06-05T20:43:26+0800
last_updated_by: Temuulen Undrakhbayar
---

# Design: Marketplace Revenue Features

## Summary

Add three revenue streams to the Tamga marketplace: VIP Listings (featured badge + pinned at top), Promoted Listings (temporary search boost), and Seller Badges (one-time purchase for verified seller profile). Extends existing `MarketListing` model with boost fields, `PaymentRequest` with `paymentType` enum, and reuses the manual bank-transfer verification flow.

## Requirements

- VIP Listings: Standard (₮5,000/7 days) and Premium (₮15,000/30 days)
- Promoted Listings: Standard (₮2,000/24 hours) and Premium (₮5,000/72 hours)
- Seller Badges: One-time purchase (₮10,000), "Дэлгүүр" badge, expires after 1 year
- Boosted listings always appear first in search results, then normal sort
- Payment via existing Khan Bank manual transfer flow
- Admin verification via existing RPC pattern

## Current State Analysis

### Key Discoveries

- `isFeatured` boolean exists on `MarketListing` (market_listing.dart:69) but is a dead feature — only renders a star icon, no sort logic, no payment link, no expiry
- `FeatureGate` pattern (feature_gate.dart:53-195) is clean — add fields to `TierLimits`, create new `Provider<GateCheck>` factories
- `PaymentRequest` (payment_request.dart:57-89) can be extended with `paymentType` enum
- Manual field copying in `local_market_repository_v2.dart` (lines 133-155, 168-193) means new fields require updating 2+ locations
- Supabase `market_listings` has partial index `idx_market_featured WHERE is_featured = true` — can be repurposed
- `MarketSort` enum (market_providers.dart:8) has no `boosted` option — needs adding

## Scope

### Building

- Domain model extensions (BoostLevel, SellerBadgeType, PaymentType enums, MarketListing boost fields)
- Isar schema update for boost fields
- Supabase migration for boost columns + market_boosts table
- Supabase repository boost CRUD
- Feature gate extensions for marketplace boosts
- PaymentService extension for boost/badge products
- Provider updates (sort logic, boost providers)
- UI: badge widgets, boost purchase flow, seller badge display
- Tests

### Not Building

- QPay integration (manual bank transfer only)
- Commission on sales
- View-based expiry (time-based only)
- Achievement-based badges
- Subscription-based badges (one-time purchase only)

## Decisions

### Decision 1: Extend PaymentRequest vs. separate models

**Ambiguity**: How to handle boost/badge payments alongside subscription payments.

**Explored**:
- Option A: Extend `PaymentRequest` with `paymentType` enum — reuses admin verification flow, single table
- Option B: Separate `ListingBoostRequest` and `SellerBadgeRequest` models — more isolated but more code

**Decision**: Option A — extend `PaymentRequest`. The manual verification flow is identical for all payment types. A single `paymentType` field (`subscription`, `listingBoost`, `sellerBadge`) keeps the admin workflow unified.

### Decision 2: Boost product tiers

**Ambiguity**: Single product or tiered products for VIP/Promoted.

**Explored**:
- Option A: Single tier (one VIP, one Promoted) — simpler
- Option B: Two tiers each — more revenue options

**Decision**: Option B — VIP Standard (₮5,000/7d), VIP Premium (₮15,000/30d), Promoted Standard (₮2,000/24h), Promoted Premium (₮5,000/72h). Clear value differentiation.

### Decision 3: Sort priority model

**Ambiguity**: How boosted listings appear in search results.

**Explored**:
- Option A: Always on top — simple, clear value proposition
- Option B: Weighted boost — more natural but less obvious value
- Option C: Separate section — clear separation

**Decision**: Option A — always on top. Boosted listings sort first (by boostPriority DESC), then normal sort (newest/price/trusted). Simple and clear.

### Decision 4: Seller badge model

**Ambiguity**: One-time purchase, subscription, or achievement-based.

**Decision**: One-time purchase (₮10,000), expires after 1 year. Simple, no recurring billing complexity.

## Architecture

### `lib/src/features/market/domain/market_listing.dart` — MODIFY

Added `BoostLevel`, `VipLevel`, `SellerBadgeType` enums with labels/prices/durations/priorities. Extended `MarketListing` with `boostLevel`, `boostExpiresAt`, `vipLevel`, `vipExpiresAt`, `sellerBadge`, `sellerBadgeExpiresAt`. Added `isBoosted`, `isVip`, `hasSellerBadge`, `sortPriority` getters. Updated `copyWith`, `fromJson`, `toJson`. Deprecated `isFeatured`.

### `lib/src/features/payments/domain/payment_request.dart` — MODIFY

Added `PaymentType` enum (subscription, listingBoost, sellerBadge). Added `paymentType` field to `PaymentRequest` (defaults to subscription). Updated `copyWith`, `fromSupabaseJson`, `toSupabaseJson`.

## Desired End State

1. Seller creates listing → sees boost options in create flow → pays via Khan Bank → admin verifies → listing gets VIP/Promoted badge
2. Buyer browses marketplace → boosted listings appear at top with gold/blue badges
3. Seller with badge → "Дэлгүүр" badge shown on all listings
4. Boost expires → listing returns to normal sort position
5. My Listings screen shows boost status, expiry countdown, "Boost" CTA

## File Map

| File | Status | Purpose |
|------|--------|---------|
| `lib/src/features/market/domain/market_listing.dart` | MODIFY | Add BoostLevel enum, boost fields |
| `lib/src/features/payments/domain/payment_request.dart` | MODIFY | Add PaymentType enum |
| `lib/src/features/shared/data/isar_schemas/isar_market_listing.dart` | MODIFY | Add boost fields to Isar schema |
| `supabase/migrations/009_boost_system.sql` | NEW | Migration for boost columns + table |
| `lib/src/features/market/data/supabase_market_repository.dart` | MODIFY | Boost CRUD methods |
| `lib/src/features/payments/data/supabase_payment_repository.dart` | MODIFY | PaymentType support |
| `lib/src/core/features/feature_gate.dart` | MODIFY | Boost gate providers |
| `lib/src/features/payments/data/payment_service.dart` | MODIFY | Boost payment flow |
| `lib/src/features/market/application/market_providers.dart` | MODIFY | Sort logic, boost providers |
| `lib/src/features/market/presentation/widgets/listing_badge.dart` | NEW | Badge widget |
| `lib/src/features/market/presentation/market_screen.dart` | MODIFY | Badge in listing cards |
| `lib/src/features/market/presentation/listing_detail_screen.dart` | MODIFY | Boost CTA in detail |
| `lib/src/features/market/presentation/create_listing_screen.dart` | MODIFY | Boost selection in create |
| `lib/src/features/market/presentation/my_listings_screen.dart` | MODIFY | Boost status in my listings |
| `test/features/market/domain/market_listing_test.dart` | NEW | Domain model tests |

## Ordering Constraints

- Slice 1 (domain) must come first — all other slices depend on the types
- Slice 2 (Isar) and Slice 3 (Supabase) can run in parallel after Slice 1
- Slice 4 (gate/payment) depends on Slice 1
- Slice 5 (providers) depends on Slices 1-4
- Slice 6 (UI) depends on Slice 5
- Slice 7 (tests) depends on Slices 1-6

## Verification Notes

- Boost fields must serialize correctly in both Isar (local) and Supabase (cloud)
- Sort order must place boosted listings first in all filter combinations
- Payment code generation must work for all payment types
- Boost expiry must be checked on app launch and sort recalculated
- RLS policies must allow sellers to update their own boost status

## Performance Considerations

- Partial index `idx_market_boosted` on `market_listings(boost_priority DESC) WHERE boost_level != 'none'` for fast boosted-first queries
- Cache boost status in provider to avoid re-checking expiry on every frame
- Lazy loading of boost payment UI (don't load payment flow until user clicks "Boost")

## Migration Notes

- New columns on `market_listings`: `boost_level`, `boost_expires_at`, `boost_priority`, `boost_started_at`
- New table `market_boosts`: tracks boost purchases with payment linkage
- Existing `is_featured` column can be deprecated (replaced by `boost_level`)
- No data migration needed — new columns have sensible defaults

## Pattern References

- `lib/src/core/features/feature_gate.dart:146-195` — gate provider pattern to follow
- `lib/src/features/payments/domain/payment_request.dart:57-89` — PaymentRequest model to extend
- `lib/src/features/market/domain/market_listing.dart:39-75` — MarketListing model to extend
- `lib/src/features/payments/data/payment_service.dart:18-26` — payment code generation pattern

## Developer Context

- All decisions recorded in Decisions section above
- Scope confirmed: VIP + Promoted + Seller Badges, two tiers each, one-time badge purchase
- Payment model: extend PaymentRequest with paymentType enum
- Sort: boosted always on top

## Design History

- Slice 1: Domain Model Extension — approved as generated
- Slice 2: Local Persistence — approved as generated
- Slice 3: Cloud Persistence — approved as generated
- Slice 4: Feature Gate & Payment Service — approved as generated
- Slice 5: Providers & Sort Logic — approved as generated
- Slice 6: UI — Badges & Boost CTA — approved as generated
- Slice 7: Tests — approved as generated

## References

- Research: `.rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md`
- Supabase migration 004: `supabase/migrations/004_marketplace_enhancement.sql`
- Supabase migration 005: `supabase/migrations/005_payment_system.sql`
