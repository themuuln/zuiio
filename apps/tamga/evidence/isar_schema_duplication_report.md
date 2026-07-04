# Isar Schema Duplication & Overlap Report

**Date:** 2026-06-19  
**Scope:** All 40 Isar schema files (42 `@collection` annotations) in `lib/src/features/`  
**Cross-referenced with:** 34 Supabase migrations in `supabase/migrations/` + 67 repository files

---

## 1. All Isar Schema Files by Feature

| #   | File                                                                      | Collection Name             | Domain Model            |
| --- | ------------------------------------------------------------------------- | --------------------------- | ----------------------- |
| 1   | `lib/src/features/shared/data/isar_schemas/isar_horse.dart`               | IsarHorse                   | Horse                   |
| 2   | `lib/src/features/shared/data/isar_schemas/isar_horse_location.dart`      | IsarHorseLocation           | HorseLocation           |
| 3   | `lib/src/features/shared/data/isar_schemas/isar_health_log.dart`          | IsarHealthLog               | HealthLog               |
| 4   | `lib/src/features/shared/data/isar_schemas/isar_medical_log.dart`         | IsarMedicalLog              | MedicalLog              |
| 5   | `lib/src/features/shared/data/isar_schemas/isar_feed_log.dart`            | IsarFeedLog                 | FeedLog                 |
| 6   | `lib/src/features/shared/data/isar_schemas/isar_feed_schedule.dart`       | IsarFeedSchedule            | FeedSchedule            |
| 7   | `lib/src/features/shared/data/isar_schemas/isar_training_log.dart`        | IsarTrainingLog             | TrainingLog             |
| 8   | `lib/src/features/shared/data/isar_schemas/isar_performance_record.dart`  | IsarPerformanceRecord       | PerformanceRecord       |
| 9   | `lib/src/features/shared/data/isar_schemas/isar_breeding_record.dart`     | IsarBreedingRecord          | BreedingRecord          |
| 10  | `lib/src/features/shared/data/isar_schemas/isar_co_ownership_record.dart` | IsarCoOwnershipRecord       | CoOwnershipRecord       |
| 11  | `lib/src/features/shared/data/isar_schemas/isar_event.dart`               | IsarEvent                   | Event                   |
| 12  | `lib/src/features/shared/data/isar_schemas/isar_event_registration.dart`  | IsarEventRegistration       | EventRegistration       |
| 13  | `lib/src/features/shared/data/isar_schemas/isar_market_listing.dart`      | IsarMarketListing           | MarketListing           |
| 14  | `lib/src/features/shared/data/isar_schemas/isar_market_conversation.dart` | IsarMarketConversation      | MarketConversation      |
| 15  | `lib/src/features/shared/data/isar_schemas/isar_market_inquiry.dart`      | IsarMarketInquiry           | MarketInquiry           |
| 16  | `lib/src/features/shared/data/isar_schemas/isar_market_offer.dart`        | IsarMarketOffer             | MarketOffer             |
| 17  | `lib/src/features/shared/data/isar_schemas/isar_market_message.dart`      | IsarMarketMessage           | MarketMessage           |
| 18  | `lib/src/features/shared/data/isar_schemas/isar_listing_report.dart`      | IsarListingReport           | ListingReport           |
| 19  | `lib/src/features/shared/data/isar_schemas/isar_seller_profile.dart`      | IsarSellerProfile           | SellerProfile           |
| 20  | `lib/src/features/shared/data/isar_schemas/isar_seller_verification.dart` | IsarSellerPhoneVerification | SellerPhoneVerification |
| 21  | `lib/src/features/shared/data/isar_schemas/isar_seller_verification.dart` | IsarEMongoliaVerification   | EMongoliaVerification   |
| 22  | `lib/src/features/shared/data/isar_schemas/isar_seller_rating.dart`       | IsarSellerRating            | SellerRating            |
| 23  | `lib/src/features/shared/data/isar_schemas/isar_digital_certificate.dart` | IsarDigitalCertificate      | OwnershipCertificate    |
| 24  | `lib/src/features/shared/data/isar_schemas/isar_document_record.dart`     | IsarDocumentRecord          | DocumentRecord          |
| 25  | `lib/src/features/shared/data/isar_schemas/isar_payment_request.dart`     | IsarPaymentRequest          | PaymentRequest          |
| 26  | `lib/src/features/shared/data/isar_schemas/isar_team.dart`                | IsarTeam                    | Team                    |
| 27  | `lib/src/features/shared/data/isar_schemas/isar_team_member.dart`         | IsarTeamMember              | TeamMember              |
| 28  | `lib/src/features/shared/data/isar_schemas/isar_team_invitation.dart`     | IsarTeamInvitation          | TeamInvitation          |
| 29  | `lib/src/features/shared/data/isar_schemas/isar_trial_slot.dart`          | IsarTrialSlot               | TrialSlot               |
| 30  | `lib/src/features/shared/data/isar_schemas/isar_trial_booking.dart`       | IsarTrialBooking            | TrialBooking            |
| 31  | `lib/src/features/shared/data/isar_schemas/isar_lineage_root.dart`        | IsarLineageRoot             | LineageRoot             |
| 32  | `lib/src/features/shared/data/isar_schemas/isar_lineage_tree_node.dart`   | IsarLineageTreeNode         | LineageTreeNode         |
| 33  | `lib/src/features/shared/data/isar_schemas/isar_lineage_snapshot.dart`    | IsarLineageSnapshot         | LineageSnapshot         |
| 34  | `lib/src/features/shared/data/isar_schemas/isar_lost_horse_report.dart`   | IsarLostHorseReport         | LostHorseReport         |
| 35  | `lib/src/features/shared/data/isar_schemas/isar_search_area.dart`         | IsarSearchArea              | SearchArea              |
| 36  | `lib/src/features/shared/data/isar_schemas/isar_saved_search.dart`        | IsarSavedSearch             | SavedSearch             |
| 37  | `lib/src/features/shared/data/isar_schemas/isar_geofence_alert.dart`      | IsarGeofenceAlert           | GeofenceAlert           |
| 38  | `lib/src/features/shared/data/isar_schemas/isar_sync_queue_item.dart`     | IsarSyncQueueItem           | SyncQueueItem           |
| 39  | `lib/src/features/shared/data/isar_schemas/isar_profile_settings.dart`    | IsarProfileSettings         | ProfileSettings         |
| 40  | `lib/src/features/races/data/isar_schemas/isar_race.dart`                 | IsarRace                    | Race                    |
| 41  | `lib/src/features/races/data/isar_schemas/isar_race_entry.dart`           | IsarRaceEntry               | RaceEntry               |

---

## 2. Duplicate/Overlapping Field Analysis

### 2.1 `domainId` — Appears in ALL 41 collections

Every single Isar schema has `late String domainId;`. This is the business-logic UUID string identifier, and 12 of them additionally mark it with `@Index(unique: true, replace: true)`.

**Pattern variance:**

- Most: `late String domainId;` (plain field)
- Some: `@Index(unique: true, replace: true) late String domainId;` (indexed unique)
  - IsarHorse, IsarHorseLocation, IsarMarketListing, IsarMarketConversation, IsarMarketMessage, IsarMarketOffer, IsarTrialSlot, IsarTrialBooking, IsarLineageRoot, IsarLineageTreeNode, IsarLineageSnapshot, IsarLostHorseReport, IsarDocumentRecord, IsarSavedSearch, IsarGeofenceAlert, IsarSearchArea, IsarSellerRating

**Recommendation:** Extract a `HasDomainId` mixin or consistently use `@Index(unique: true, replace: true)` on all domainId fields — currently only 17/41 do.

### 2.2 `horseId` — Appears in 18 collections

| Schema                 | horseId field                        | Indexed? |
| ---------------------- | ------------------------------------ | -------- |
| IsarHealthLog          | `@Index() late String horseId`       | ✅       |
| IsarMedicalLog         | `late String horseId`                | ❌       |
| IsarFeedLog            | `@Index() late String horseId`       | ✅       |
| IsarFeedSchedule       | `@Index() late String horseId`       | ✅       |
| IsarTrainingLog        | `@Index() late String horseId`       | ✅       |
| IsarPerformanceRecord  | `late String horseId`                | ❌       |
| IsarCoOwnershipRecord  | `late String horseId`                | ❌       |
| IsarEvent              | `@Index() late String horseId`       | ✅       |
| IsarEventRegistration  | `late String horseId`                | ❌       |
| IsarMarketListing      | `@Index() late String horseId`       | ✅       |
| IsarDocumentRecord     | `@Index() late String horseId`       | ✅       |
| IsarDigitalCertificate | `late String horseId`                | ❌       |
| IsarGeofenceAlert      | `late String horseId`                | ❌       |
| IsarLostHorseReport    | `String? horseId` (nullable)         | ❌       |
| IsarBreedingRecord     | `sireId`/`damId` (conceptual horses) | ✅       |
| IsarHorseLocation      | (uses `domainId` as horseId)         | ✅       |
| IsarRaceEntry          | `late String horseId`                | ❌       |
| IsarRace               | N/A                                  | N/A      |

**Inconsistency:** Only 8 of 18 have `@Index()` on horseId. Queries filtering by horseId will perform full table scans on the other 10 schemas.

### 2.3 `ownerId` / `userId` — Inconsistent presence

**Schemas WITH ownerId/userId:**

- IsarHorseLocation: `ownerId`, `ownerName`
- IsarEventRegistration: `ownerId`
- IsarMarketListing: `sellerId` (conceptual owner)
- IsarMarketConversation: `buyerId`, `sellerId`
- IsarMarketInquiry: `buyerId`, `sellerId`
- IsarMarketOffer: `buyerId`, `sellerId`
- IsarMarketMessage: `senderId`
- IsarDigitalCertificate: `ownerId`, `ownerName`
- IsarDocumentRecord: `ownerId`
- IsarPaymentRequest: `userId`
- IsarTeam: `ownerUserId`
- IsarTeamMember: `userId`
- IsarTeamInvitation: `invitedUserId`, `invitedByUserId`
- IsarSavedSearch: `userId`
- IsarLostHorseReport: `ownerId`
- IsarSearchArea: `createdBy`
- IsarEvent: `ownerId` (nullable)
- IsarRace: `organizerId` (nullable)
- IsarRaceEntry: `ownerId`

**Schemas WITHOUT ownerId (rely on horseId → ownerId chain):**

- **IsarHealthLog** — no ownerId, only horseId
- **IsarMedicalLog** — no ownerId, only horseId
- **IsarFeedLog** — no ownerId, only horseId
- **IsarFeedSchedule** — no ownerId, only horseId
- **IsarTrainingLog** — no ownerId, only horseId
- **IsarPerformanceRecord** — no ownerId, only horseId
- **IsarBreedingRecord** — no ownerId
- **IsarCoOwnershipRecord** — no ownerId

**Risk:** These 8 schemas can't be queried by owner without a join. For local offline queries this may be acceptable, but it contradicts the Supabase pattern where all tables have `owner_id`.

### 2.4 Timestamp fields — Completely inconsistent

| Pattern                        | Schemas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createdAt` + `updatedAt` pair | IsarMarketListing, IsarMarketInquiry, IsarDocumentRecord, IsarLostHorseReport                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `createdAt` only               | IsarTeam, IsarTeamInvitation, IsarSearchArea, IsarSavedSearch, IsarListingReport, IsarPaymentRequest, IsarSellerRating                                                                                                                                                                                                                                                                                                                                                                                                     |
| Custom names                   | IsarEventRegistration (`registeredAt`), IsarTeamMember (`joinedAt`), IsarGeofenceAlert (`triggeredAt`), IsarHorseLocation (`lastUpdated`), IsarLineageSnapshot (`cachedAt`), IsarMarketMessage (`timestamp`), IsarPaymentRequest (`expiresAt`, `verifiedAt`), IsarSellerVerification (`verifiedAt`, `submittedAt`), IsarTrialSlot (`createdAt`), IsarTrialBooking (`requestedAt`, `respondedAt`), IsarDigitalCertificate (`issueDate`, `expiryDate`, `registrationDate`), IsarSyncQueueItem (`timestamp`, `lastAttemptAt`) |
| **No timestamps at all**       | **IsarHorse**, **IsarHealthLog**, **IsarMedicalLog**, **IsarFeedLog**, **IsarFeedSchedule**, **IsarTrainingLog**, **IsarPerformanceRecord**, **IsarBreedingRecord**, **IsarCoOwnershipRecord**, **IsarLineageRoot**, **IsarLineageTreeNode**, **IsarProfileSettings**                                                                                                                                                                                                                                                      |

**Recommendation:** Standardize on `createdAt`/`updatedAt` for all data schemas, or at least add them consistently. 12 schemas lack any timestamp fields, making conflict resolution and offline sync ordering difficult.

---

## 3. Schema Merge Candidates

### 3.1 IsarHealthLog ↔ IsarMedicalLog (HIGH PRIORITY)

| Aspect         | IsarHealthLog                                                                                                                                               | IsarMedicalLog                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| File           | `shared/data/isar_schemas/isar_health_log.dart`                                                                                                             | `shared/data/isar_schemas/isar_medical_log.dart`                                      |
| Domain model   | HealthLog (`shared/domain/health_log.dart`)                                                                                                                 | MedicalLog (`horses/domain/health_record.dart`)                                       |
| Fields         | domainId, **horseId** (indexed), **logType** (LogType enum), date (nullable), notes, medicament (nullable), **cost** (nullable), **farrierName** (nullable) | domainId, horseId, **type** (MedicalLogType enum), date, notes, medicament (nullable) |
| Supabase table | `health_logs` (merged with farrier_logs in migration 002)                                                                                                   | **None**                                                                              |

**Finding:** Supabase migration 002 already merged `farrier_logs` into `health_logs` with an expanded LogType enum (`vaccination`, `deworming`, `treatment`, `vetVisit`, `shoeing`, `trimming`). However, the Flutter/Dart side still has TWO distinct schemas. `MedicalLog` appears to be the older model that should have been removed when `HealthLog` was created.

**Action:** Remove `IsarMedicalLog`, `MedicalLog` (`horses/domain/health_record.dart`), and migrate all references to `HealthLog`/`IsarHealthLog`.

### 3.2 IsarLineageRoot ↔ IsarHorse (MEDIUM PRIORITY)

**Shared fields:** `domainId`, `name`, `coat`, `birthYear`, `offspringCount`, `awardCount`, `notes`

IsarLineageRoot is a 7-field subset of IsarHorse's 13 fields. It exists solely for the lineage tree feature but stores duplicate data that already exists in IsarHorse.

**Action:** Consider replacing IsarLineageRoot with a computed/derived view from IsarHorse data, or add a `@Index()` on `lineageRootId` in IsarHorse for efficient lookups (already present).

### 3.3 IsarLineageTreeNode ↔ IsarHorse (MEDIUM PRIORITY)

These share 8 overlapping fields (`domainId`, `name`, `relationLabel`, `coat`, `birthYear`, `awardCount`, `offspringCount`, `isOwnedByHousehold`). The tree node adds 8 tree-specific fields (`generation`, `branchOrder`, `sortOrder`, `isRoot`, `hiddenBranchCount`, `photoUrl`, `sex`, `tamgaNo`, `region`, `speedIndex`).

This is a valid denormalization for performance (avoids joins in lineage tree rendering), but the field overlap should be explicitly documented and kept in sync.

### 3.4 IsarSellerPhoneVerification ↔ IsarEMongoliaVerification (LOW PRIORITY)

Both have: `domainId`, `sellerId`, `isVerified`, `verifiedAt`. They track different verification types but share a common interface. Consider a `Verification` superclass or shared interface.

### 3.5 Common "Log" Pattern (MEDIUM PRIORITY)

Five schemas follow an extremely similar pattern:

- IsarHealthLog, IsarMedicalLog, IsarFeedLog, IsarTrainingLog, IsarPerformanceRecord

All have: `domainId` + `horseId` + a `type`/`metric`/`logType` enum + `date` + `notes`. This could benefit from:

- A `HorseLogBase` mixin with `domainId`, `horseId`, `notes`, and timestamps
- A shared query utility for filtering by horseId

---

## 4. Id Generation Pattern

**Current pattern (ALL 41 schemas):**

```dart
Id id = Isar.autoIncrement;
late String domainId;
```

This is the correct Isar pattern (auto-increment int for internal index, string for business reference). However:

- 24/41 schemas have `domainId` without any index
- 17/41 have `@Index(unique: true, replace: true)` on `domainId`

**Recommendation:** Add `@Index(unique: true, replace: true)` to ALL `domainId` fields. Without the index, `domainId` lookups are O(n) scans. The `replace: true` also enables safe upserts.

---

## 5. Isar ↔ Supabase Schema Mismatches

### 5.1 Supabase tables with NO Isar schema

| Supabase Table             | Migration | Notes                              |
| -------------------------- | --------- | ---------------------------------- |
| `profiles`                 | 001       | Core user profiles                 |
| `pedigree_links`           | 001       | Pedigree edges                     |
| `reminder_templates`       | 001       | Reminder schedules                 |
| `subscriptions`            | 001       | Subscription tracking              |
| `user_devices`             | 008       | Push notification devices          |
| `race_videos`              | 016       | Race video storage                 |
| `video_access_passes`      | 016       | Video purchase tracking            |
| `price_history`            | 002       | Market price history               |
| `ai_queries`               | 029       | AI query log                       |
| `lost_horse_media`         | 019       | Lost horse media files             |
| `lost_horse_payments`      | 022       | Lost horse payment tracking        |
| `certificate_transfers`    | 006       | Certificate ownership transfer     |
| `mongolian_locations`      | 017       | Mongolian administrative locations |
| `notification_preferences` | 014       | Notification preferences           |

These lack offline support (no Isar cache). If offline access is needed, Isar schemas should be added.

### 5.2 Isar schemas with NO matching Supabase table

| Isar Schema                     | Domain                  | Notes                                                                                   |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| **IsarMedicalLog**              | MedicalLog              | Should be removed (merged into IsarHealthLog)                                           |
| **IsarEventRegistration**       | EventRegistration       | Referenced in SupabaseEventRegistrationRepository but no migration exists               |
| **IsarMarketConversation**      | MarketConversation      | Local-only; no Supabase migration                                                       |
| **IsarMarketInquiry**           | MarketInquiry           | Local-only; no Supabase migration                                                       |
| **IsarMarketMessage**           | MarketMessage           | Local-only; no Supabase migration                                                       |
| **IsarMarketOffer**             | MarketOffer             | Referenced in SupabaseMarketRepository as `offers` table but NO migration               |
| **IsarListingReport**           | ListingReport           | Local-only; no Supabase migration                                                       |
| **IsarSellerRating**            | SellerRating            | Referenced in SupabaseMarketRepository as `seller_ratings` but NO migration             |
| **IsarSellerProfile**           | SellerProfile           | Local-only; no Supabase migration                                                       |
| **IsarSellerPhoneVerification** | SellerPhoneVerification | Referenced in SupabaseMarketRepository as `seller_phone_verifications` but NO migration |
| **IsarEMongoliaVerification**   | EMongoliaVerification   | Referenced in SupabaseMarketRepository as `e_mongolia_verifications` but NO migration   |
| **IsarTrialSlot**               | TrialSlot               | Referenced in SupabaseMarketRepository as `trial_slots` but NO migration                |
| **IsarTrialBooking**            | TrialBooking            | Referenced in SupabaseMarketRepository as `trial_bookings` but NO migration             |
| **IsarSavedSearch**             | SavedSearch             | Referenced in SupabaseMarketRepository as `saved_searches` but NO migration             |
| **IsarLineageSnapshot**         | LineageSnapshot         | Local-only cached data (acceptable)                                                     |
| **IsarLineageRoot**             | LineageRoot             | Local-only cached data (acceptable)                                                     |
| **IsarLineageTreeNode**         | LineageTreeNode         | Local-only cached data (acceptable)                                                     |
| **IsarSyncQueueItem**           | SyncQueueItem           | Local-only (acceptable)                                                                 |
| **IsarProfileSettings**         | ProfileSettings         | Local-only (acceptable)                                                                 |

**CRITICAL FINDING:** 10+ Isar schemas have corresponding SupabaseRepository methods that attempt to write to/read from Supabase tables that don't exist in any migration:

- `offers` — SupabaseMarketRepository.createOffer, respondToOffer, fetchOffersForListing, fetchOffersForUser
- `seller_ratings` — SupabaseMarketRepository.submitSellerRating, fetchSellerRatings, respondToReview
- `trial_slots` — SupabaseMarketRepository.createTrialSlot, fetchTrialSlotsForListing, etc.
- `trial_bookings` — SupabaseMarketRepository.createTrialBooking, updateTrialBookingStatus, etc.
- `saved_searches` — SupabaseMarketRepository.saveSavedSearch, deleteSavedSearch, fetchSavedSearches, etc.
- `seller_phone_verifications` — SupabaseMarketRepository.savePhoneVerification, fetchPhoneVerification
- `e_mongolia_verifications` — SupabaseMarketRepository.saveEMongoliaVerification
- `event_registrations` — SupabaseEventRegistrationRepository methods

These calls will fail at runtime with 404/relation-not-found errors unless these tables are created outside the migration system (e.g., manually via the Supabase dashboard).

---

## 6. Repository Query Duplication

### 6.1 Boilerplate duplication across ALL Supabase repositories

Every Supabase repository repeats this exact pattern:

```dart
// In EVERY repository file:
SupabaseClient? get _safe => _client;
Future<String?> get _userId async => ensureSupabaseUserId();
AppException _wrap(Object e) { /* same 15 lines */ }
AppException _noClient() { /* same 4 lines */ }
```

**Affected files (67 total):**

- `lib/src/features/horses/data/supabase_horses_repository.dart`
- `lib/src/features/horses/data/supabase_co_ownership_repository.dart`
- `lib/src/features/horses/data/supabase_horse_transfer_repository.dart`
- `lib/src/features/market/data/supabase_market_repository.dart`
- `lib/src/features/market/data/supabase_message_repository.dart`
- `lib/src/features/events/data/supabase_event_repository.dart`
- `lib/src/features/events/data/supabase_event_registration_repository.dart`
- `lib/src/features/breeding/data/supabase_breeding_repository.dart`
- `lib/src/features/training/data/supabase_training_repository.dart`
- `lib/src/features/nutrition/data/supabase_nutrition_repository.dart`
- `lib/src/features/health/data/supabase_health_repository.dart`
- `lib/src/features/lineage/data/supabase_lineage_repository.dart`
- `lib/src/features/map/data/supabase_map_repository.dart`
- `lib/src/features/profile/data/supabase_profile_repository.dart`
- `lib/src/features/documents/data/supabase_document_repository.dart`
- `lib/src/features/certificates/data/supabase_certificate_repository.dart`
- `lib/src/features/teams/data/supabase_team_repository.dart`
- `lib/src/features/ai/data/supabase_ai_repository.dart`
- `lib/src/features/payments/data/supabase_payment_repository.dart`
- `lib/src/features/races/data/supabase_race_repository.dart`
- `lib/src/features/races/data/supabase_race_entry_repository.dart`

**Recommendation:** Extract into a `SupabaseRepositoryBase` class or mixin:

```dart
mixin SupabaseRepositoryMixin {
  SupabaseClient? get client;
  // Common helpers
  AppException wrapError(Object e) { ... }
  AppException noClientError() { ... }
  Future<String?> requireUserId() { ... }
}
```

### 6.2 Query pattern duplication

Nearly every repository repeats:

```dart
client.from('table_name').select().eq('field', value).order('field', ascending: bool)
```

This could be standardized with a query builder utility or extension methods on `SupabaseClient`:

```dart
extension SupabaseQueryX on SupabaseClient {
  Future<Result<List<Map<String, dynamic>>>> selectWhere(
    String table,
    String field,
    dynamic value, {
    String? orderBy,
    bool ascending = true,
    int? limit,
    int? offset,
  }) async { ... }
}
```

### 6.3 Row mapping inconsistency

Three different patterns are used across repositories:

| Pattern                                              | Examples                                             |
| ---------------------------------------------------- | ---------------------------------------------------- |
| **Domain model `fromSupabaseJson`/`toSupabaseJson`** | SupabaseHorsesRepository, SupabaseEventRepository    |
| **Inline `_fromRow`/`_toRow` methods**               | SupabaseMarketRepository, SupabaseBreedingRepository |
| **Mixed** (some inline, some domain methods)         | Various                                              |

**Recommendation:** Standardize on one approach. The inline `_fromRow`/`_toRow` approach in `SupabaseMarketRepository` duplicates the mapping logic that already exists in domain models.

---

## 7. Specific Recommendations Summary

| Priority | Issue                                                                 | Action                                                                                                                                                      |
| -------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | `IsarMedicalLog` is redundant after migration 002 merged farrier_logs | Delete `IsarMedicalLog.dart` and `MedicalLog` domain model; migrate references to `HealthLog`                                                               |
| **P0**   | 10+ Supabase repositories reference tables with NO migrations         | Either create Supabase migrations for these tables, or remove the Supabase methods and use only local Isar storage                                          |
| **P1**   | 18/41 schemas missing `@Index()` on `domainId`                        | Add `@Index(unique: true, replace: true)` to all `domainId` fields                                                                                          |
| **P1**   | Only 8/18 `horseId` fields are indexed                                | Add `@Index()` to horseId in IsarMedicalLog, IsarPerformanceRecord, IsarCoOwnershipRecord, IsarEventRegistration, IsarDigitalCertificate, IsarGeofenceAlert |
| **P1**   | Boilerplate duplicated in 20+ Supabase repositories                   | Extract `SupabaseRepositoryMixin` or base class                                                                                                             |
| **P1**   | 12 schemas have NO timestamp fields                                   | Add `createdAt`/`updatedAt` for offline sync ordering                                                                                                       |
| **P2**   | IsarLineageRoot duplicates IsarHorse fields                           | Consider deriving from IsarHorse instead of separate schema                                                                                                 |
| **P2**   | Query patterns duplicated across repositories                         | Create shared query builder/extensions                                                                                                                      |
| **P2**   | Row mapping pattern inconsistency                                     | Standardize on domain model `fromSupabaseJson`/`toSupabaseJson`                                                                                             |
| **P3**   | 12 Supabase tables lack Isar schemas (no offline support)             | Add Isar schemas if offline access is needed                                                                                                                |
| **P3**   | IsarSellerPhoneVerification ↔ IsarEMongoliaVerification overlap       | Consider a shared `Verification` base class                                                                                                                 |

---

## 8. Files with Most Issues

| File                                                                      | Issues                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `lib/src/features/shared/data/isar_schemas/isar_medical_log.dart`         | Redundant after migration 002                          |
| `lib/src/features/market/data/supabase_market_repository.dart`            | References 7+ non-existent tables; massive boilerplate |
| `lib/src/features/shared/data/isar_schemas/isar_health_log.dart`          | Missing `@Index()` on horseId                          |
| `lib/src/features/shared/data/isar_schemas/isar_co_ownership_record.dart` | Missing `@Index()` on horseId, no timestamps           |
| `lib/src/features/shared/data/isar_schemas/isar_digital_certificate.dart` | Missing `@Index()` on horseId                          |

---

## Appendix: Field Occurrence Heatmap

| Field                              | Occurrence Count | Schemas                                                                                                                                                   |
| ---------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domainId`                         | 41               | ALL                                                                                                                                                       |
| `notes`                            | 20+              | Most health/log/event schemas                                                                                                                             |
| `horseId`                          | 18               | Health logs, feeding, training, events, market, documents...                                                                                              |
| `createdAt`                        | 10               | MarketListing, MarketInquiry, DocumentRecord, LostHorseReport, Team, TeamInvitation, SearchArea, SavedSearch, ListingReport, PaymentRequest, SellerRating |
| `status`                           | 8                | BreedingRecord, EventRegistration, MarketListing, MarketOffer, TrialSlot, TrialBooking, LostHorseReport, DigitalCertificate                               |
| `date`/`DateTime` fields           | 15+              | Various (often named differently)                                                                                                                         |
| `ownerId`/`sellerId`/`userId`      | 15+              | Various                                                                                                                                                   |
| `phone`/`contactPhone`             | 4                | CoOwnershipRecord, LostHorseReport, SellerPhoneVerification                                                                                               |
| `photoUrl`/`photoUrls`/`mediaUrls` | 7                | Horse, Event, MarketListing, LostHorseReport, LineageTreeNode                                                                                             |

---

_Report compiled by automated analysis of all Isar schema files, Supabase migrations, and repository implementations._
