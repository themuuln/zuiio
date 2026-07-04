---
date: 2026-06-06T17:39:27+0800
author: Temuulen Undrakhbayar
commit: f63e09b
branch: main
repository: tamga
topic: "Launch Gap Closure — Marketplace Revenue + Map Features"
tags: [intent, frd, marketplace, map, geofence, offline, boost, launch]
status: complete
last_updated: 2026-06-06T17:39:27+0800
last_updated_by: Temuulan Undrakhbayar
---

# FRD: Launch Gap Closure — Marketplace Revenue + Map Features

## Summary

Close the remaining implementation gaps in two nearly-complete features before launch: (1) marketplace revenue — boost sort integration, purchase CTA with Khan Bank payment flow, and tests; (2) map & lost horse finder — geofence monitoring loop wiring, offline sync queue for map data, Protomaps tile bundle, and tests. Both features are 70-85% implemented; this FRD covers the final 15-30% needed for launch readiness.

## Problem & Intent

Both marketplace revenue and map/lost horse features are critical for launch. The core problem is launch readiness — Mongolian horse owners need marketplace monetization (boosted listings, seller badges) and safety features (lost horse recovery, geofencing) before the app can ship. The features are substantially built but have gaps that prevent them from being production-ready.

## Goals
- Marketplace: boosted/VIP listings sort to top of catalog automatically
- Marketplace: users can purchase boosts and seller badges via Khan Bank payment flow
- Map: geofence monitoring runs in real-time on GPS location updates
- Map: lost horse reports, search areas, and horse locations sync offline and queue for later
- Map: offline vector tiles (Protomaps Mongolia) bundled for rural use without internet
- Both: comprehensive test coverage for gap-closed code
- Both: all existing tests continue passing

## Non-Goals
- Push notifications for geofence alerts and lost horse reports (separate feature)
- Analytics tracking for boost purchases and map interactions
- QPay integration (manual bank transfer only)
- Satellite imagery (too large for offline)
- Real-time GPS tracking (requires hardware)
- Commission on sales
- Achievement-based badges

## Functional Requirements
1. The system SHALL sort boosted/VIP listings above non-boosted listings in the marketplace catalog, with VIP outranking boost, using the existing `sortPriority` getter
2. The system SHALL provide a boost purchase CTA (button/sheet) on listing cards and my listings screen
3. The system SHALL present boost tier options (Standard/Premium for both VIP and Promoted) with pricing in MNT
4. The system SHALL create a `PaymentRequest` with `paymentType` when user selects a boost tier
5. The system SHALL display Khan Bank transfer instructions and payment code after payment request creation
6. The system SHALL gate boost purchases behind `boostGateProvider` (free tier denied, pro+ allowed)
7. The system SHALL wire the geofence monitoring loop: `getPositionStream` → `GeofenceService.findContainingAreas`/`findExcludedAreas` → alert creation
8. The system SHALL add map-related sync operations to `SyncQueueItem` for offline writes
9. The system SHALL bundle Protomaps Mongolia vector tiles (~200-500MB) for offline map rendering
10. The system SHALL provide repository and widget tests for marketplace boost methods and badge widgets
11. The system SHALL provide tests for `GeofenceService` containment logic
12. The system SHALL provide widget tests for map presentation screens

## Non-Functional Requirements
- **Performance**: Geofence checks on every GPS update must not cause jank; use distance calculation batching if needed
- **Battery**: Real-time location monitoring should use appropriate accuracy settings (not high-accuracy continuous)
- **Security**: RLS policies on map tables must prevent unauthorized writes; boost purchases must verify payment before applying badges
- **UX / Accessibility**: All new UI must be bilingual (Mongolian + English); boost CTA must be discoverable but not intrusive
- **Reliability**: Offline sync queue must handle connectivity loss gracefully; geofence alerts must persist across app restarts

## Constraints & Assumptions
- Must work with existing Riverpod ^2.6.1 + Isar ^3.1.0 + Supabase architecture
- Must pass all existing `flutter test` and `dart analyze` checks
- Protomaps tiles require `mbtiles` package for offline reading
- Khan Bank payment flow is manual verification (admin verifies payment code)
- Geofence monitoring requires `geolocator` background permission on Android
- App target: iOS and Android (Flutter)

## Acceptance Criteria
- [ ] `dart analyze lib/src/features/market/` passes with no errors
- [ ] `dart analyze lib/src/features/map/` passes with no errors
- [ ] `flutter test test/features/market/domain/market_listing_test.dart` passes (existing 26 tests)
- [ ] `flutter test test/features/map/domain/map_models_test.dart` passes (existing tests)
- [ ] New marketplace tests pass for boost sort, CTA, and payment flow
- [ ] New map tests pass for geofence service and widget rendering
- [ ] Boosted listing appears above non-boosted in marketplace catalog (manual)
- [ ] Boost purchase flow: tap CTA → select tier → see Khan Bank instructions (manual)
- [ ] Geofence alert triggers when horse crosses boundary (manual)
- [ ] Offline: report lost horse with no internet → syncs when connected (manual)
- [ ] Map loads with bundled tiles on first launch with no internet (manual)

## Recommended Approach

Use two parallel worktrees: one for marketplace gaps (sort integration + boost CTA + Khan Bank payment flow + tests) and one for map gaps (geofence monitoring loop + offline sync queue + Protomaps tile bundle + tests). The marketplace worktree extends existing `market_providers.dart` sort logic and creates a new `BoostPurchaseSheet` widget. The map worktree creates a `GeofenceMonitor` service, extends `SyncQueueItem` with map operations, and bundles Protomaps MBTiles assets.

## Decisions

### Boost sort integration
**Question**: How should boosted listings be sorted in the marketplace catalog?
**Recommended**: Add `boosted` to `MarketSort` enum and use `sortPriority` as primary sort key in catalog provider
**Chosen**: Add `boosted` sort option that uses `sortPriority` (VIP > Boost > normal) as primary key
**Rationale**: `sortPriority` getter already exists on `MarketListing` — just needs to be wired into catalog sort logic at `market_providers.dart:231`

### Boost CTA placement
**Question**: Where should the boost purchase CTA appear?
**Recommended**: Bottom sheet on listing cards in My Listings + detail screen, triggered by a "Boost" button
**Chosen**: Bottom sheet with tier selection, accessible from My Listings screen and listing detail
**Rationale**: My Listings is where sellers manage their listings — natural place for monetization CTA

### Payment flow integration
**Question**: How should the boost payment flow work?
**Recommended**: Full flow: tier selection → PaymentRequest creation → Khan Bank instructions → admin verification → badge applied
**Chosen**: Full payment flow using existing `PaymentRequest` model with `paymentType: listingBoost/sellerBadge`
**Rationale**: Payment infrastructure already exists (Phase 4 complete) — just needs UI orchestration

### Geofence monitoring approach
**Question**: How should geofence monitoring work?
**Recommended**: Real-time monitoring on every GPS location update via `getPositionStream`
**Chosen**: Real-time monitoring with `getPositionStream` → `GeofenceService` checks → alert creation
**Rationale**: Lost horse recovery requires timely alerts; battery impact acceptable for this use case

### Offline tile source
**Question**: What map tile source for offline functionality?
**Recommended**: Protomaps Mongolia vector tiles bundled in assets (~200-500MB)
**Chosen**: Protomaps Mongolia extract as MBTiles, bundled in app assets
**Rationale**: Free, offline-first, already referenced in the plan; best fit for rural Mongolia without internet

### Offline sync scope
**Question**: What map operations should be queued for offline sync?
**Recommended**: Lost horse report create/update, search area create, horse location update, geofence alert acknowledge
**Chosen**: All map mutation operations queued via existing `SyncQueueItem` system
**Rationale**: Core offline-first requirement — users in rural Mongolia need to report lost horses without internet

## Open Questions
- Protomaps tile size verification — need to confirm actual MBTiles file size for Mongolia extract before bundling
- Android background location permission handling — `geolocator` background mode requires user consent

## Suggested Follow-ups
- Push notifications for geofence alerts and lost horse reports (observed in plan but explicitly excluded)
- Analytics tracking for boost purchases (observed as potential revenue insight)
- Marker clustering for 100+ horses on map (observed in plan performance section but not yet implemented)
- Boost expiry background job (time-based expiry currently computed on read, not proactively cleared)

## References
- Plan: `.rpiv/artifacts/plans/2026-06-05_22-48-12_marketplace-revenue.md`
- Plan: `.rpiv/artifacts/plans/2026-06-06_00-15-00_map-lost-horse.md`
- Design: `.rpiv/artifacts/designs/2026-06-05_20-43-26_marketplace-revenue.md`
- Research: `.rpiv/artifacts/research/2026-06-05_20-43-26_marketplace-revenue.md`
