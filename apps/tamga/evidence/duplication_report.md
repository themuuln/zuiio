# Tamga Duplication & Overlap Report

Generated: 2026-06-19

---

## 1. Domain Model Overlap

### 1.1 `HorseGender` Enum Duplicated Across Features

**Files:**

- `lib/src/shared/domain/horse.dart` — defines `HorseGender` enum (stallion, mare, gelding, foal)
- `lib/src/features/map/domain/animal_enums.dart` — imports `HorseGender` from `../../../shared/domain/horse.dart`
- `lib/src/features/onboarding/domain/onboarding_data.dart` — uses `String horseGender` (plain string, not enum)

**Issue:** The `HorseGender` is defined in `shared/domain/horse.dart` and correctly imported by map feature, but `onboarding_data.dart` uses raw strings instead of the enum. This creates a type-safety gap and potential for invalid values.

**Lines affected:** ~5 (the enum itself) + usage inconsistency across features.

**Recommendation:** Update `OnboardingData.horseGender` to use `HorseGender?` instead of `String?`, and update serialization accordingly.

---

### 1.2 `HorseMarkerType` Enum Duplicated — Defined Twice

**Files:**

- `lib/src/features/map/domain/map_enums.dart:4` — `enum HorseMarkerType { normal, lost, located }`
- `lib/src/features/map/presentation/widgets/horse_marker.dart:75` — `enum HorseMarkerType { normal, lost, located }`

**Issue:** The exact same enum is defined in two places. The domain-level one in `map_enums.dart` is the canonical version, but the widget file has its own identical copy.

**Lines affected:** 3 lines × 2 = 6 lines duplicated.

**Recommendation:** Remove the duplicate from `horse_marker.dart` and import from `map_enums.dart`.

---

### 1.3 `MedicalLogType` vs `LogType` — Duplicate Health Log Enums

**File:** `lib/src/features/horses/domain/health_record.dart` — `enum MedicalLogType`

```dart
enum MedicalLogType {
  vaccination, deworming, treatment, vetVisit;
  // (no shoeing, no trimming)
}
```

**File:** `lib/src/shared/domain/health_log.dart` — `enum LogType`

```dart
enum LogType {
  vaccination, deworming, treatment, vetVisit, shoeing, trimming;
  // (has shoeing and trimming)
}
```

**Issue:** Two different enums for essentially the same concept. `MedicalLogType` is used by the old `MedicalLog` model in `horses/domain/health_record.dart`, while `LogType` is used by the newer `HealthLog` in `shared/domain/health_log.dart`. The `HealthLog` model is the intended replacement (it lives in `shared/`).

**Lines affected:** ~10 lines in the `MedicalLogType` definition + the entire `MedicalLog` class (~80 lines in `health_record.dart`).

**Recommendation:** Delete the `MedicalLog` model and `MedicalLogType` enum from `horses/domain/health_record.dart`. All code should use `HealthLog` and `LogType` from `shared/domain/health_log.dart`. This was likely an incomplete migration.

---

### 1.4 Redundant Model Wrappers / Type Aliases

**File:** `lib/src/features/horses/domain/horse_record.dart`

```dart
export '../../../shared/domain/horse.dart';
typedef HorseRecord = Horse;
```

**Issue:** `HorseRecord` is just a type alias for `Horse`. The export/typedef file exists purely for backward compatibility. All interfaces and providers still reference `HorseRecord` throughout the codebase.

**Lines affected:** 3 lines in the file, but the type alias pollutes ~20+ files that import `HorseRecord` instead of `Horse`.

**Recommendation:** Gradually migrate imports from `HorseRecord` to `Horse` across the codebase, then remove this redirect file.

---

### 1.5 Status Enums — Proliferation Across Features

There are **17+ status enums** across the codebase, many with overlapping semantics:

| Enum                       | File                                             | Values                                               |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| `MarketListingStatus`      | `market/domain/market_listing.dart`              | active, pendingVerification, sold, expired, rejected |
| `LostHorseStatus`          | `map/domain/map_enums.dart`                      | active, found, cancelled, expired                    |
| `CertificateStatus`        | `certificates/domain/ownership_certificate.dart` | active, transferred, revoked                         |
| `InvoiceStatus`            | `stable/domain/stable_invoice.dart`              | unpaid, partial, paid, cancelled                     |
| `PaymentStatus`            | `payments/domain/payment_request.dart`           | pending, verified, rejected, expired                 |
| `RaceStatus`               | `races/domain/race.dart`                         | upcoming, ongoing, completed, cancelled              |
| `RaceEntryStatus`          | `races/domain/race_entry.dart`                   | registered, confirmed, competed, scratched           |
| `RegistrationStatus`       | `shared/domain/event_registration.dart`          | registered, confirmed, cancelled                     |
| `TrialSlotStatus`          | `market/domain/trial_slot.dart`                  | available, booked, completed, cancelled              |
| `TrialBookingStatus`       | `market/domain/trial_booking.dart`               | requested, confirmed, cancelled, noShow              |
| `MarketOfferStatus`        | `market/domain/market_offer.dart`                | pending, accepted, declined, countered               |
| `BoardingStatus`           | `stable/domain/boarding_assignment.dart`         | active, pending, completed, cancelled                |
| `InvitationStatus`         | `teams/domain/team_invitation.dart`              | pending, accepted, declined, expired                 |
| `SyncItemStatus`           | `core/sync/sync_queue.dart`                      | pending, synced, failed                              |
| `SellerVerificationStatus` | `market/domain/market_safety.dart`               | unverified, verified, trustedStable                  |
| `ListingReportStatus`      | `market/domain/market_safety.dart`               | submitted, reviewing, resolved                       |
| `MarketInquiryStatus`      | `market/domain/market_safety.dart`               | (has values)                                         |

**Issue:** Many share common concepts (pending/active/cancelled/expired) but are defined independently with their own string serialization, `fromString()` methods, and display labels. This is acceptable for domain-specific statuses, but generic ones (active/inactive, pending, cancelled) could share a base enum.

**Recommendation:** Not all need consolidation — many are domain-specific. However, consider a shared `ReportStatus` enum for any "active/found/cancelled/expired" patterns, and shared `FlowStatus` for "pending/accepted/declined" patterns.

---

### 1.6 Location/Address Models — Scattered Strings

**Files:**

- `LostHorseReport` (map) — has `locationAimag`, `locationSum`, `locationBag`, `locationName`
- `MarketListing` (market) — has `locationLabel` (single string)
- `Event` (shared) — has `location` (single string) + `latitude`/`longitude` + `address`
- `BreederProfile` (social) — has `locationLabel` (single string)
- `OnboardingData` (onboarding) — has `region` (single string)

**Issue:** Location is modeled inconsistently across features. The map feature has a proper hierarchy (aimag → sum → bag), while others use flat strings. There's no shared `Location` value object.

**Lines affected:** ~20+ scattered fields across 5+ models.

**Recommendation:** Create a shared `MongolianLocation` value object in `shared/domain/` with aimag/sum/bag fields and use it consistently across features that deal with Mongolian locations.

---

## 2. Repository Pattern Duplication

### 2.1 Supabase Repository Boilerplate — Extremely High Duplication

Every Supabase repository follows this exact pattern (8+ files):

```dart
class SupabaseXxxRepository implements XxxRepository {
  SupabaseXxxRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  SupabaseClient? get _safe => _client;
  Future<String?> get _userId async => ensureSupabaseUserId();

  AppException _wrap(Object e) {
    if (e is PostgrestException) {
      return AppException(
        message: e.message,
        code: e.code ?? 'SUPABASE_ERROR',
        details: {'hint': e.hint, 'details': e.details},
      );
    }
    return AppException(message: e.toString(), code: 'UNKNOWN_ERROR');
  }

  AppException _noClient() {
    return const AppException(
      message: 'Supabase тохиргоо байхгүй байна',
      code: 'SUPABASE_NOT_CONFIGURED',
    );
  }
  // ...CRUD methods follow the same pattern...
}
```

**Files with this exact pattern:**

- `horses/data/supabase_horses_repository.dart` (~120 lines)
- `health/data/supabase_health_repository.dart` (~140 lines)
- `events/data/supabase_event_repository.dart` (~160 lines)
- `nutrition/data/supabase_nutrition_repository.dart` (~150 lines)
- `training/data/supabase_training_repository.dart` (~150 lines)
- `market/data/supabase_market_repository.dart` (~450 lines — the worst case)
- `teams/data/supabase_team_repository.dart` (~120 lines)
- `documents/data/supabase_document_repository.dart` (~100 lines)
- `breeding/data/supabase_breeding_repository.dart` (~100 lines)
- `certificates/data/supabase_certificate_repository.dart` (~80 lines)
- `lineage/data/supabase_lineage_repository.dart` (~80 lines)
- `payments/data/supabase_payment_repository.dart` (~100 lines)
- `races/data/supabase_race_repository.dart` (~120 lines)
- `race_videos/data/race_videos_repository.dart` (~80 lines)
- `ai/data/supabase_ai_repository.dart` (~60 lines)

**Lines of duplicated boilerplate:** ~30 lines per file × 15 files ≈ **450 lines of duplicated code.**

**Recommendation:** Extract into a reusable mixin or base class:

```dart
mixin SupabaseRepositoryMixin {
  SupabaseClient? get client;

  AppException _wrap(Object e) { /* shared */ }
  AppException _noClient() { /* shared */ }

  Future<Result<List<T>>> fetchAll<T>({
    required String table,
    required T Function(Map<String, dynamic>) fromRow,
    String? ownerId,
    String? orderColumn,
    bool ascending = false,
  }) async { /* shared */ }

  Future<Result<T>> save<T>({
    required String table,
    required T item,
    required Map<String, dynamic> Function(T) toRow,
    required String ownerId,
  }) async { /* shared */ }

  Future<Result<void>> delete({
    required String table,
    required String id,
    String? ownerColumn,
    String? ownerId,
  }) async { /* shared */ }
}
```

---

### 2.2 Local Repository Patterns — Duplicated Isar Logic

**Files:**

- `health/data/local_health_repository.dart` (use `IsarStorage`)
- `events/data/local_event_repository.dart`
- `horses/data/local_horses_repository.dart`
- `documents/data/local_document_repository.dart`
- `market/data/local_market_repository.dart` + `local_market_repository_v2.dart`
- `training/data/local_training_repository.dart` (partial)
- `nutrition/data/local_nutrition_repository.dart`

Each local repository:

1. Accepts `IsarStorage storage` + `SyncQueue syncQueue` in constructor
2. Maps Isar objects to domain models with `.toDomain()`
3. Enqueues sync items after every write operation
4. Handles ID generation and write transactions

**Lines affected:** ~50-80 lines per file, across ~8 files ≈ **500+ lines of duplicated Isar CRUD pattern.**

**Recommendation:** Create a generic `LocalRepository<T, TIsar>` base class that handles:

- Constructor injection (`IsarStorage`, `SyncQueue`)
- Standard CRUD methods (findAll, findById, save, delete)
- Sync queue enqueue
- Unify the `LocalHorsesRepository` strategy (which currently uses a hand-rolled approach vs the IsarStorage approach used by health).

---

### 2.3 Abstract Repository Definitions — 22+ Separate Interfaces

**Files:** 22 abstract `Repository` interfaces exist across features (see grep results).

**Recommendation:** While many of these are legitimately different, several share the same method signatures:

- `fetchAll()`, `fetchByHorse()`, `save()`, `delete()` pattern repeated across Health, Training, Nutrition, Breeding, Events, Documents
- Could extract a `CrudRepository<T>` generic interface:
  ```dart
  abstract class CrudRepository<T> {
    Future<Result<List<T>>> fetchAll();
    Future<Result<T>> save(T item);
    Future<Result<void>> delete(String id);
  }
  ```

---

## 3. Widget Duplication

### 3.1 Loading/Spinner Widgets — Overlapping Implementations

**Core widgets (in `lib/src/core/widgets/`):**

- `tamga_spinner.dart` — `TamgaSpinner` (CupertinoActivityIndicator wrapper), `TamgaLoadingView` (centered spinner + message)
- `loading_state.dart` — `SkeletonLoader`, `SkeletonCard`, `SkeletonListTile`, `SkeletonCardTile`, `ShimmerEffect`, `LoadingOverlay`, `LoadingIndicator`, `LoadingButton`

**Feature-level loading widgets:**

- None found — features correctly use core widgets. ✅

**Recommendation:** No duplication found here. Clean separation.

---

### 3.2 Error Display Widgets

**Core:** `tamga_error_widget.dart` — `TamgaErrorWidget` (full-screen error with retry)
**Feature-level:** None found that duplicate this. ✅

---

### 3.3 Empty State Widgets

**Core:** `empty_state.dart` — `EmptyState`, `EmptyStateIllustration`, `InlineEmptyState`
**Feature-level:** None found that duplicate this. ✅

---

### 3.4 Status/Badge/Chip Widgets

**Core:**

- `tamga_status_chip.dart` — `TamgaStatusChip` (with `TamgaStatus` enum), `TamgaColorChip`
- `tamga_badge.dart` — `TamgaBadge` (with `TamgaBadgeVariant`)

**Feature-level:**

- `market/presentation/widgets/listing_badge.dart` — custom listing badges
- `market/presentation/widgets/boost_purchase_sheet.dart` — custom boost badges

**Issue:** `listing_badge.dart` contains badge logic that partially overlaps with `tamga_badge.dart` and `tamga_status_chip.dart`. It renders boost, VIP, and seller badge indicators.

**Lines affected:** ~80 lines in `listing_badge.dart`.

**Recommendation:** Refactor `listing_badge.dart` to compose with `TamgaBadge` and `TamgaColorChip` from core rather than building badges from scratch with raw `Container` + `Text`.

---

### 3.5 Card Widgets

**Core:**

- `tamga_card.dart` — `TamgaCard`, `TamgaIconCard`
- `tamga_summary_card.dart` — `TamgaSummaryCard`, `TamgaSummaryRow`

**Feature-level:**

- `events/presentation/widgets/event_card.dart` — custom event card
- `map/presentation/widgets/lost_horse_card.dart` — custom lost horse card
- `horses/presentation/widgets/health_log_card.dart` — custom health log card

**Issue:** Each card is built from scratch with `Container` + `BoxDecoration` rather than composing with `TamgaCard`. This is about 20-40 lines of repeated layout code per file.

**Lines affected:** ~30 lines × 3 files ≈ **90 lines of duplicated card styling.**

**Recommendation:** Feature-level cards should wrap `TamgaCard` as their base container, only customizing the content.

---

### 3.6 Analytics Widgets — Chart Duplication

**Files:**

- `analytics/presentation/widgets/stat_card.dart` — similar to `TamgaSummaryCard`
- `setting/report/widgets/details_card.dart` (if it exists)

**Issue:** `stat_card.dart` contains a metric display widget (~40 lines) that mirrors `TamgaSummaryCard` in core/widgets.

**Lines affected:** ~40 lines.

**Recommendation:** Replace `stat_card.dart` with `TamgaSummaryCard` from core, or make `stat_card.dart` compose with it.

---

## 4. Provider Duplication

### 4.1 Pagination Provider Pattern — Already Reused ✅

The `PaginationNotifier<T>` in `shared/data/pagination/pagination_state.dart` is a well-designed reusable component used by:

- `horses_providers.dart` — `paginatedHorsesProvider`
- (likely) market providers

**Recommendation:** This is a good example of DRY done right. No changes needed.

---

### 4.2 Async CRUD Provider Pattern — High Duplication

Many features follow this exact Riverpod provider pattern:

```dart
final xxxRepositoryProvider = FutureProvider<XxxRepository>((ref) async {
  return LocalXxxRepository(storage: IsarStorage.instance, syncQueue: SyncQueue());
});

final xxxListProvider = FutureProvider<List<XxxModel>>((ref) async {
  final repo = await ref.watch(xxxRepositoryProvider.future);
  return (await repo.fetchAll()).getOrThrow();
});
```

**Files using this pattern:**

- `horses/application/horses_providers.dart`
- `health/application/health_providers.dart`
- `events/application/events_providers.dart`
- `breeding/application/breeding_providers.dart`
- `training/application/training_providers.dart`
- `nutrition/application/nutrition_providers.dart`
- `documents/application/document_providers.dart`
- `teams/application/team_providers.dart`
- `certificates/application/certificate_providers.dart`

**Lines affected:** ~10 lines per file × 9 files = **90 lines.**

**Recommendation:** Create a helper function:

```dart
typedef RepositoryProvider<T> = FutureProvider<Repository<T>>;

FutureProvider<List<T>> createListProvider<T>(
  FutureProvider<Repository<T>> repositoryProvider,
) {
  return FutureProvider<List<T>>((ref) async {
    final repo = await ref.watch(repositoryProvider.future);
    return (await repo.fetchAll()).getOrThrow();
  });
}
```

---

## 5. Gateway/Service Duplication

### 5.1 Notification Services — Good Separation ✅

**Files:**

- `core/services/notification_service.dart` — FCM initialization, token management, permissions
- `core/services/notification_types.dart` — `NotificationType` enum, `NotificationPayload`
- `core/services/notification_trigger_service.dart` — trigger logic
- `core/services/local_notification_service.dart` — local notification scheduling
- `core/services/notification_scheduler.dart` — scheduling

**Issue:** 5 separate notification files. While they're well-organized, there's potential overlap between `notification_scheduler.dart`, `notification_trigger_service.dart`, and `local_notification_service.dart`. A brief review of their public APIs would confirm.

**Lines affected:** Potentially ~50-80 lines of scheduling overlap.

**Recommendation:** Audit the notification files and consider merging `notification_scheduler` and `notification_trigger_service` if they duplicate scheduling logic.

---

### 5.2 Sync Services — Well-Organized ✅

**Files:**

- `core/sync/sync_engine.dart` — processes queue items with backoff
- `core/sync/sync_queue.dart` — FIFO queue with coalescing + dead letter
- `core/sync/sync_config.dart` — configuration
- `core/sync/connection_status.dart` — online/offline detection
- `core/sync/sync_conflict.dart` — conflict resolution

**Issue:** No obvious duplication within the sync layer itself.

**Recommendation:** None needed.

---

### 5.3 Media Storage Overlap (Potential)

**Files:**

- `core/storage/cloud/media_storage_router.dart` (modified, in git status)
- `map/data/offline_tile_manager.dart` — tile caching
- `map/data/tile_cache_manager.dart` — tile caching

**Issue:** `offline_tile_manager.dart` and `tile_cache_manager.dart` both deal with tile storage. They may overlap in cache management logic.

**Lines affected:** Unknown without deeper analysis.

**Recommendation:** Audit the two map tile cache files for overlap.

---

## 6. Constants Duplication

### 6.1 Horse Coat Colors — Single Source ✅

**File:** `lib/src/core/constants/horse_coat_colors.dart` — single list of 43 Mongolian coat color names.

**Issue:** Well-contained. No other feature duplicates this list. ✅

---

### 6.2 Race Categories — Inline Constant

**File:** `lib/src/features/race_videos/domain/race_video.dart`

```dart
const kRaceCategories = [
  'Бүгд', 'Шодон', 'Даага', 'Соёолон', 'Хязаалан', 'Их нас', 'Азарга',
];
```

**Issue:** This constant is defined inline in the domain model file rather than in a shared constants file. If the races feature also uses categories, this could be duplicated.

**Lines affected:** 7 values.

**Recommendation:** Move to `lib/src/core/constants/` like `horseCoatColors` is.

---

### 6.3 Pricing Constants — Scattered Across Features

Pricing is defined in multiple places:

- `market/domain/market_listing.dart` — `BoostLevel.priceMnt`, `VipLevel.priceMnt`, `SellerBadgeType.priceMnt`
- `map/domain/animal_enums.dart` — `LostHorsePricingTier.priceMnt`
- `payments/domain/payment_request.dart` — `SubscriptionTier.priceMnt`
- `race_videos/domain/race_video.dart` — `price3day`, `price1year`, `priceLifetime`

**Issue:** Pricing is scattered across domain models. While each is domain-specific, there's no central pricing configuration that could be updated easily.

**Lines affected:** ~20 price values across 4 files.

**Recommendation:** Consider a `PricingConfig` in `core/constants/` if prices need centralized management. Current setup is acceptable if each feature owns its pricing independently.

---

## 7. Error Handling Duplication

### 7.1 Core Error Layer — Well-Structured ✅

**Files:**

- `core/error/result.dart` — `Result<T>`, `Ok<T>`, `Fail<T>`, `AsyncResult`
- `core/error/app_exception.dart` — `AppException` with factory constants
- `core/error/error_helpers.dart` — `friendlyErrorMessage()`, `contextualErrorMessage()`
- `core/error/error_boundary.dart` — global error configuration
- `core/error/crash_reporter.dart` — crash reporting interface

**Issue:** The error handling layer is well-designed. All features correctly use `Result<T>` and `AppException`. ✅

---

### 7.2 Feature-Level Custom Error Messages — Minor Duplication

**Files:**

- `map/application/expiry_service.dart` (modified in git status)
- Various repository files define their own `AppException` instances inline

**Issue:** While `error_helpers.dart` has `friendlyErrorMessage()`, some features still create custom `AppException` instances with inline messages rather than using the centralized error mapping.

**Lines affected:** ~10 inline `AppException` creations across various repository files.

**Recommendation:** Extend `friendlyErrorMessage()` with additional error codes rather than creating inline `AppException` messages in each repository.

---

## Summary of Recommendations (Prioritized)

| Priority  | Finding                                                                         | Impact                                     | Effort                    |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------- |
| 🔴 High   | **Supabase repository boilerplate** — ~450 lines duplicated across 15 files     | High (maintenance burden, bug propagation) | Medium                    |
| 🔴 High   | **MedicalLogType vs LogType** — duplicate health log enum and model             | Medium (incomplete migration)              | Small                     |
| 🟡 Medium | **Local repository Isar CRUD** — ~500 lines duplicated across 8 repos           | High (maintenance)                         | Medium                    |
| 🟡 Medium | **HorseMarkerType duplicated** — 2 identical enum definitions                   | Low (easy fix)                             | Small                     |
| 🟡 Medium | **HorseGender string usage** — `OnboardingData` uses raw string instead of enum | Low (type safety)                          | Small                     |
| 🟡 Medium | **Card widgets not using TamgaCard** — ~90 lines of duplicated card styling     | Medium (visual inconsistency)              | Small                     |
| 🟡 Medium | **Async CRUD provider pattern** — ~90 lines repeated across 9 features          | Medium                                     | Small                     |
| 🟢 Low    | **RaceCategories inline** — should be in core/constants                         | Low                                        | Small                     |
| 🟢 Low    | **HorseRecord type alias** — pollutes imports                                   | Low                                        | Large (gradual migration) |
| 🟢 Low    | **Location/address modeling** — scattered strings vs shared value object        | Medium                                     | Medium                    |
| 🟢 Low    | **Analytics stat_card duplicates TamgaSummaryCard**                             | Low                                        | Small                     |
| 🟢 Low    | **Listing badge** should compose with core badge/chip widgets                   | Low                                        | Small                     |

---

## Quick Wins (Can be done in < 1 hour)

1. Delete duplicate `HorseMarkerType` from `horse_marker.dart` (import from `map_enums.dart`)
2. Delete `MedicalLog` and `MedicalLogType` from `horses/domain/health_record.dart` (migrate to `HealthLog`/`LogType`)
3. Move `kRaceCategories` to `core/constants/`
4. Make `StatCard` compose with `TamgaSummaryCard`
5. Make listing badges compose with core `TamgaBadge`
