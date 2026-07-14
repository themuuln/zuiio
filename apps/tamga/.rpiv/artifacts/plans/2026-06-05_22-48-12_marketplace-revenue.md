---
date: 2026-06-05T22:48:12+0800
author: Temuulen Undrakhbayar
commit: 42436c0
branch: main
repository: tamga
topic: "Marketplace Revenue Features"
tags: [plan, marketplace, revenue, vip, boost, seller-badge]
status: ready
parent: ".rpiv/artifacts/designs/2026-06-05_20-43-26_marketplace-revenue.md"
last_updated: 2026-06-05T22:48:12+0800
last_updated_by: Temuulen Undrakhbayar
---

# Marketplace Revenue Features Implementation Plan

## Overview

Add three revenue streams to the Tamga marketplace: VIP Listings (featured badge + pinned at top), Promoted Listings (temporary search boost), and Seller Badges (one-time purchase for verified seller profile). Extends existing `MarketListing` model with boost fields, `PaymentRequest` with `paymentType` enum, and reuses the manual bank-transfer verification flow.

## Desired End State

1. Seller creates listing → sees boost options in create flow → pays via Khan Bank → admin verifies → listing gets VIP/Promoted badge
2. Buyer browses marketplace → boosted listings appear at top with gold/blue badges
3. Seller with badge → "Дэлгүүр" badge shown on all listings
4. Boost expires → listing returns to normal sort position
5. My Listings screen shows boost status, expiry countdown, "Boost" CTA

## What We're NOT Doing

- QPay integration (manual bank transfer only)
- Commission on sales
- View-based expiry (time-based only)
- Achievement-based badges
- Subscription-based badges (one-time purchase only)

## Phase 1: Domain Model Extension

### Overview

Foundation slice — adds all new enums and extends MarketListing/PaymentRequest with boost/badge fields.

### Changes Required:

#### 1. MarketListing Domain Model
**File**: `lib/src/features/market/domain/market_listing.dart`
**Changes**: Add `BoostLevel`, `VipLevel`, `SellerBadgeType` enums with labels/prices/durations/priorities. Extend `MarketListing` with 6 boost/badge fields + 4 computed getters. Update `copyWith`, `fromJson`, `toJson`. Deprecated `isFeatured`.

#### 2. PaymentRequest Domain Model
**File**: `lib/src/features/payments/domain/payment_request.dart`
**Changes**: Add `PaymentType` enum (subscription, listingBoost, sellerBadge). Add `paymentType` field to `PaymentRequest`. Updated `copyWith`, `fromSupabaseJson`, `toSupabaseJson`.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/features/market/domain/market_listing.dart`
- [ ] Type checking passes: `dart analyze lib/src/features/payments/domain/payment_request.dart`
- [ ] All tests pass: `flutter test test/features/market/domain/market_listing_test.dart`

#### Manual Verification:
- [ ] New enums have correct labels, prices, durations
- [ ] MarketListing serialization round-trip preserves boost fields
- [ ] PaymentRequest serialization preserves paymentType

---

## Phase 2: Local Persistence

### Overview

Update Isar schema with new boost fields and regenerate.

### Changes Required:

#### 1. Isar Market Listing Schema
**File**: `lib/src/features/shared/data/isar_schemas/isar_market_listing.dart`
**Changes**: Add `boostLevel`, `boostExpiresAt`, `vipLevel`, `vipExpiresAt`, `sellerBadge`, `sellerBadgeExpiresAt` fields with `@enumerated` annotations. Updated `fromDomain()` and `toDomain()`.

### Success Criteria:

#### Automated Verification:
- [ ] Code generation succeeds: `dart run build_runner build --delete-conflicting-outputs`
- [ ] No compilation errors: `dart analyze lib/src/features/shared/data/isar_schemas/isar_market_listing.dart`

#### Manual Verification:
- [ ] Generated `.g.dart` file includes new fields
- [ ] `fromDomain()` and `toDomain()` handle all new fields

---

## Phase 3: Cloud Persistence

### Overview

Supabase migration for boost columns + repository updates.

### Changes Required:

#### 1. Supabase Migration
**File**: `supabase/migrations/009_boost_system.sql`
**Changes**: New migration adding boost/VIP/badge columns to `market_listings`, `payment_type` to `payment_requests`, partial index for boosted listings.

#### 2. Supabase Market Repository
**File**: `lib/src/features/market/data/supabase_market_repository.dart`
**Changes**: Updated `_fromRow()` and `_toRow()` for new fields. Added `boostListing()`, `setVipLevel()`, `setSellerBadge()` methods.

#### 3. Market Repository Interface
**File**: `lib/src/features/market/data/market_repository.dart`
**Changes**: Added boost method signatures to abstract class.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/features/market/data/supabase_market_repository.dart`
- [ ] Type checking passes: `dart analyze lib/src/features/market/data/market_repository.dart`
- [ ] Migration SQL is valid

#### Manual Verification:
- [ ] `_fromRow()` reads all boost fields correctly
- [ ] `_toRow()` writes all boost fields correctly
- [ ] Boost methods update Supabase correctly

---

## Phase 4: Feature Gate & Payment Service

### Overview

Extend TierLimits with boost limits and create gate providers.

### Changes Required:

#### 1. Feature Gate
**File**: `lib/src/core/features/feature_gate.dart`
**Changes**: Added `hasBoost`, `hasSellerBadge` to `TierLimits`. Added `boostGateProvider`, `sellerBadgeGateProvider`.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/core/features/feature_gate.dart`
- [ ] All tier limits include new fields

#### Manual Verification:
- [ ] Free tier denies boost/badge
- [ ] Pro+ tiers allow boost/badge
- [ ] Gate providers return correct GateAllowed/GateDenied

---

## Phase 5: Providers & Sort Logic

### Overview

Update sort logic to prioritize boosted listings and add boost CRUD providers.

### Changes Required:

#### 1. Market Providers
**File**: `lib/src/features/market/application/market_providers.dart`
**Changes**: Added `boosted` to `MarketSort` enum. Updated sort logic to prioritize `sortPriority`. Added `boostListing()`, `setVipLevel()`, `setSellerBadge()` provider functions.

#### 2. Local Market Repository
**File**: `lib/src/features/market/data/local_market_repository_v2.dart`
**Changes**: Implemented `boostListing()`, `setVipLevel()`, `setSellerBadge()` with Isar + SyncQueue.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/features/market/application/market_providers.dart`
- [ ] Type checking passes: `dart analyze lib/src/features/market/data/local_market_repository_v2.dart`

#### Manual Verification:
- [ ] Boosted listings sort first in catalog
- [ ] VIP listings outrank boosted listings
- [ ] Boost providers invalidate correct providers

---

## Phase 6: UI — Badges & Boost CTA

### Overview

Badge widgets and boost status display in listing cards and my listings.

### Changes Required:

#### 1. Listing Badge Widget
**File**: `lib/src/features/market/presentation/widgets/listing_badge.dart`
**Changes**: New `ListingBadge`, `SellerBadge`, `ListingBadgeOverlay` widgets.

#### 2. Market Screen
**File**: `lib/src/features/market/presentation/market_screen.dart`
**Changes**: Replaced `isFeatured` star with `ListingBadge` widget.

#### 3. My Listings Screen
**File**: `lib/src/features/market/presentation/my_listings_screen.dart`
**Changes**: Added boost status chips and expiry display.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `dart analyze lib/src/features/market/presentation/widgets/listing_badge.dart`
- [ ] Type checking passes: `dart analyze lib/src/features/market/presentation/market_screen.dart`
- [ ] Type checking passes: `dart analyze lib/src/features/market/presentation/my_listings_screen.dart`

#### Manual Verification:
- [ ] VIP badge shows gold with premium icon
- [ ] Boost badge shows blue with rocket icon
- [ ] Seller badge shows green with store icon
- [ ] My Listings shows boost status with expiry

---

## Phase 7: Tests

### Overview

Comprehensive tests for domain models, enums, and serialization.

### Changes Required:

#### 1. Market Listing Tests
**File**: `test/features/market/domain/market_listing_test.dart`
**Changes**: 26 tests covering BoostLevel, VipLevel, SellerBadgeType, MarketListing boost fields, serialization, PaymentType, PaymentRequest.

### Success Criteria:

#### Automated Verification:
- [ ] All tests pass: `flutter test test/features/market/domain/market_listing_test.dart`
- [ ] No test failures

#### Manual Verification:
- [ ] Tests cover all enum values
- [ ] Tests cover boost expiry logic
- [ ] Tests cover sort priority calculation
- [ ] Tests cover serialization round-trips

---

## Testing Strategy

### Automated:
- `dart analyze` on all modified files
- `flutter test test/features/market/domain/market_listing_test.dart` (26 tests)
- `dart run build_runner build --delete-conflicting-outputs` for Isar schema

### Manual Testing Steps:
1. Create a listing → verify boost options appear
2. Boost a listing → verify badge shows in browse screen
3. Verify boosted listing sorts first
4. Wait for boost expiry → verify listing returns to normal position
5. Purchase seller badge → verify badge shows on all listings

## Performance Considerations

- Partial index `idx_market_boosted` for fast boosted-first queries
- Cache boost status in provider to avoid re-checking expiry on every frame
- Lazy loading of boost payment UI

## Migration Notes

- New columns on `market_listings`: `boost_level`, `boost_expires_at`, `vip_level`, `vip_expires_at`, `seller_badge`, `seller_badge_expires_at`
- New column on `payment_requests`: `payment_type`
- Existing `is_featured` column deprecated (replaced by `boost_level`)
- Backfill: `is_featured = true` → `vip_level = 'standard'` with 1-year expiry

## Plan Review (Step 4)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 5._

| source   | plan-loc          | codebase-loc                | severity   | dimension             | finding   | recommendation   | resolution         |
| -------- | ----------------- | --------------------------- | ---------- | --------------------- | --------- | ---------------- | ------------------ |
| code     | Phase 5 §2        | local_market_repository_v2.dart:125-144 | concern | code-quality | `incrementViewsCount` manually copies fields but stops at `isFeatured`, silently resetting 6 boost fields to defaults on every view-count increment | Add the 6 missing field copies to `incrementViewsCount` and `_updateStatus` | applied: added boost field copies to both methods |
| code     | Phase 5 §2        | local_market_repository_v2.dart:173-190 | concern | code-quality | `_updateStatus` omits same 6 boost fields, propagating data loss to Supabase on status changes | Add the 6 missing field copies to `_updateStatus` | applied: added boost field copies to both methods |

## Developer Context

All decisions recorded in design artifact's Decisions section:
- Extend PaymentRequest with paymentType enum
- Two tiers each for VIP/Promoted
- Boosted always on top
- One-time purchase for seller badges

## References

- Design: `.rpiv/artifacts/designs/2026-06-05_20-43-26_marketplace-revenue.md`
- Research: `.rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md`
