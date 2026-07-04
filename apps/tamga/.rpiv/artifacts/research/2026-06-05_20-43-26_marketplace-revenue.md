# Research: Marketplace Revenue Features

**Date**: 2026-06-05T20:43:26+0800
**Author**: Temuulen Undrakhbayar
**Branch**: main
**Commit**: 42436c0
**Repository**: tamga

---

## Summary

Research into the Tamga marketplace architecture to design revenue features (VIP listings, promoted listings, seller badges). The marketplace is a local-first (Isar) + cloud-synced (Supabase) horse listing platform with manual bank-transfer payments (Khan Bank). An `isFeatured` boolean already exists on `MarketListing` but is underutilized — only renders a star icon. The `FeatureGate` system and `PaymentRequest` model provide clear extension points for monetization.

---

## Code References

| File | Key Lines | Purpose |
|------|-----------|---------|
| `lib/src/features/market/domain/market_listing.dart` | 39-75, 130-175 | MarketListing model with isFeatured, viewsCount, trustScore |
| `lib/src/features/market/data/local_market_repository_v2.dart` | 133-155, 168-193 | Local CRUD with manual field copying pattern |
| `lib/src/features/market/data/supabase_market_repository.dart` | 44-91, 97+ | Supabase CRUD with _fromRow/_toRow mapping |
| `lib/src/features/market/application/market_providers.dart` | 8, 120, 138-147, 167 | MarketSort enum, catalog provider, filter logic |
| `lib/src/features/market/presentation/market_screen.dart` | 434, 478 | Browse cards — isFeatured star, grid overlay |
| `lib/src/features/market/presentation/listing_detail_screen.dart` | 85+ | Listing detail header |
| `lib/src/features/market/presentation/create_listing_screen.dart` | 170+ | Create listing flow |
| `lib/src/features/market/presentation/my_listings_screen.dart` | 148+ | My listings actions |
| `lib/src/core/features/feature_gate.dart` | 53-92, 100-116, 146-195 | TierLimits, GateCheck sealed class, gate providers |
| `lib/src/features/payments/domain/payment_request.dart` | 3-18, 57-89 | SubscriptionTier enum, PaymentRequest model |
| `lib/src/features/payments/data/payment_service.dart` | 18-26, 35-56 | Payment code generation, create payment flow |
| `lib/src/features/payments/presentation/widgets/paywall_widget.dart` | 14-108 | Paywall bottom sheet UI |
| `lib/src/features/shared/data/isar_schemas/isar_market_listing.dart` | 37, 45, 72 | Isar schema with fromDomain/toDomain |
| `supabase/migrations/004_marketplace_enhancement.sql` | 27-63 | market_listings columns, indexes, RLS |
| `supabase/migrations/005_payment_system.sql` | 58-110 | verify_payment RPC |

---

## Architecture Insights

### MarketListing Current Fields
```
id, horseId, sellerId, title, description, priceAmount, currency,
saleType, status, locationLabel, disciplineTags, documentTags,
mediaUrls, isSellerVerified, createdAt, updatedAt, viewsCount, isFeatured
```

### FeatureGate Pattern
```
TierLimits (const map per tier)
  → tierLimitsProvider (reads subscriptionTierProvider)
    → GateCheck providers (GateAllowed | GateDenied)
      → PaywallWidget.show(context, denied: gateResult)
```

### Payment Flow
```
User selects tier → PaymentService.createPaymentRequest() → generates TG-XXXX-XXXX code
→ Shows Khan Bank details → User transfers → Admin verifies via RPC
→ payment_requests.status = 'verified' → profiles.subscription_tier updated
```

### Existing Boost-Like Feature
- `isFeatured` boolean on MarketListing — only renders star icon at market_screen.dart:434
- NOT used in sort logic (MarketSort has newest/priceLow/priceHigh/trusted/popular but no featured)
- Partial index exists: `idx_market_featured WHERE is_featured = true`

### Supabase market_listings Indexes
- `idx_market_views` — views_count DESC
- `idx_market_featured` — is_featured WHERE true
- `idx_market_active_price` — price_amount WHERE active
- `idx_market_active_location` — location_label WHERE active
- `idx_market_seller` — seller_id

---

## Key Discoveries

1. **`isFeatured` is a dead feature** — exists in model, has index, but no sort logic, no payment link, no expiry. Perfect extension point.

2. **Manual field copying is a maintenance risk** — `local_market_repository_v2.dart` copies every field manually in `incrementViewsCount()` and `_updateStatus()`. Adding fields means updating 2+ locations.

3. **PaymentRequest can be extended** — add `paymentType` enum (subscription, listingBoost, vipBadge) to reuse existing manual verification flow.

4. **FeatureGate is clean** — just add new fields to `TierLimits` and create new `Provider<GateCheck>` factories.

5. **SellerVerificationStatus already exists** — `unverified, verified, trustedStable` in market_safety.dart. A VIP badge can layer on top.

6. **SyncQueue handles coalescing** — create+delete cancels, update-after-create replaces. Boost/unboost operations will work offline.

---

## Precedents & Lessons

- `isFeatured` was added in migration 004 but never fully wired — avoid half-implementing features
- Manual field copying in local repo is a pattern that scales poorly — new fields = 2+ edit locations
- Payment code format `TG-XXXX-XXXX` excludes 0/O/I/1 for clarity — reuse for boost codes
- PaywallWidget uses loss-aversion framing — effective for conversion

---

## Open Questions

1. **Boost product structure**: Single "boost" product or tiered (standard/premium)?
2. **Expiry model**: Time-based (7/30 days) or view-based (1000 views)?
3. **Seller badge model**: One-time purchase or subscription add-on?
4. **Payment integration**: Extend PaymentRequest or create separate ListingBoostRequest?
5. **Sort priority**: Boosted listings always on top, or weighted alongside trust/views?
