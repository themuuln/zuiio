# Error Handling Architecture Report

## 1. Error Handling Architecture Overview

### Result Type Pattern

Tamga uses a **sealed class `Result<T>`** (`lib/src/core/error/result.dart`) as the primary error handling pattern. It provides:
- `Ok<T>` / `Fail<T>` variants with pattern matching via `when()`
- `getOrThrow()` — unwraps or throws
- `map()` / `mapError()` — functional transformation
- `trySync()` / `tryFuture()` — static wrappers to convert exceptions to `Result`
- `AsyncResult` helper class for Future-based operations

### AppException

Defined in `lib/src/core/error/app_exception.dart`:
- Fields: `code`, `message`, `details` (optional)
- Static factory constants: `horseNotFound`, `syncFailed`, `networkError`, `storageFull`, `authRequired`, `unknown`
- `withDetail()` — factory for custom exceptions

### Error Widgets

Located in `lib/src/app/theme/app_widgets.dart`:
- **`AppErrorWidget`** — displays error icon + message + optional retry button ("Дахин оролдох")
- **`AppEmptyState`** — icon + title + optional subtitle + action button
- **`AppLoadingWidget`** — centered spinner

Also in `lib/src/core/widgets/`:
- **`EmptyState`** / **`InlineEmptyState`** / **`EmptyStateIllustration`** — reusable empty state widgets
- **`LoadingOverlay`** / **`LoadingIndicator`** / **`LoadingButton`** / **`SkeletonLoader`** — loading state widgets
- **`TamgaToast`** — toast notifications

---

## 2. Repository Result Type Coverage

### ✅ Properly Using Result Type

| Repository | Abstract Interface | Local Impl | Supabase Impl |
|---|---|---|---|
| `HorsesRepository` | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `HealthRepository` | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `DocumentRepository` | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `MapRepository` | ✅ `Future<Result<...>>` | N/A | ✅ |
| `CertificateRepository` | ✅ `Future<Result<...>>` | N/A | ✅ |
| `AuthRepository` | ✅ `Future<Result<...>>` | N/A | ✅ |
| `ProfileSettingsRepository` | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `CoOwnershipRepository` | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `HorseTransferRepository` | ✅ `Future<Result<...>>` | N/A | ✅ |
| `PaymentRepository` | ✅ `Future<Result<...>>` | N/A | ✅ (NoOp for fallback) |
| `StableRepository` | ✅ `Future<Result<...>>` | ✅ | N/A |
| `LineageRepository` | ✅ `Future<Result<...>>` | ✅ | N/A |
| `RaceVideosRepository` | ✅ Uses `Result.tryFuture()` | N/A | ✅ (single class) |
| `MediaStorageService` | ✅ `Future<Result<...>>` | N/A | ✅ |
| `LocalNotificationService` | ✅ `Future<Result<...>>` | N/A | N/A |
| `EventRepository` (singular) | ✅ `Future<Result<...>>` | ✅ | ✅ |
| `SupabaseBreedingRepository` | ✅ Uses `Result` internally | N/A | ✅ |

### ❌ NOT Using Result Type (raw throw/catch)

| Repository | Type | Issue |
|---|---|---|
| **`EventsRepository` (plural)** | `Future<List<EventRecord>>` | Returns raw lists, throws exceptions. This is a **different interface** from `EventRepository` — used by `events_providers.dart`. |
| **`BreedingRepository` (abstract)** | `Future<List<BreedingRecord>>` | Returns raw lists, can throw. `LocalBreedingRepository` implements this interface and doesn't catch Isar errors. |
| **`OnboardingRepository`** | No Result | All methods use raw return types (`OnboardingData`, `Future<void>`). Errors are caught at the provider level in try/catch blocks. |

### Mixed Interface Cases

| Repository | Methods Without Result |
|---|---|
| `MarketRepository` | `fetchFavoriteListingIds()`, `toggleFavorite()`, `fetchSellerProfile()`, `fetchInquiries()`, `createInquiry()`, `fetchReports()`, `createReport()`, `submitSellerRating()`, `fetchCertificateForHorse()`, `issueCertificate()`, `transferCertificate()`, `boostListing()`, `setVipLevel()`, `setSellerBadge()`, `fetchPriceHistory()` |

The `MarketRepository` abstract interface has **Result-based methods for core CRUD** (fetchListings, saveListing, deleteListing, etc.) but **non-Result methods for secondary operations** (favorites, seller, safety, certificates, boost/VIP/badge, price history). These secondary methods can throw exceptions.

---

## 3. Error Boundaries / Global Error Handling

### ❌ No Global Error Boundaries Found

- **No `runZonedGuarded`** wrapping — no top-level error handler
- **No `FlutterError.onError`** override
- **No `ErrorWidget.builder`** customization
- **No Sentry / Crashlytics integration** — only a TODO in sprint plan (`docs/tech/sprint-plan.md` line 763)
- **No global `catchError` patterns** in provider chains

The `main()` function (`lib/main.dart`) has try/catch around Firebase initialization failures (gracefully skips with `debugPrint`) but no global error boundary for the app.

This means **any unhandled exception crashes the app** silently (Flutter default error screen).

---

## 4. Loading / Error / Empty State Coverage per Feature

### Horses Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Horses List** (`horses_screen.dart`) | ✅ `_PaginationFooter` shows spinner on `state.isLoading` | ❌ No error state shown for `PaginationState.error` — error is silently stored but never rendered (the `PaginationState.hasError` is not checked in this screen) | ✅ `EmptyHorsesState` widget |
| **Horse Detail** (`horse_detail_screen.dart`) | N/A (receives horse directly) | ✅ SnackBar on photo upload error | N/A |
| **Add Horse** (`add_horse_screen.dart`) | ❌ No loading state shown during save | ❌ No error display if save fails | N/A |
| **Horse Card** | N/A | ✅ `errorWidget` on `CachedNetworkImage` (shows `Container`) | N/A |

### Health Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Health Tab** (`horse_health_tab.dart`) | Uses `AsyncValue` from `medicalLogsProvider` — but pattern is unclear | ❌ Not checked — providers use `result.getOrThrow()` which throws on failure | ❌ Not checked |
| **Health Logs** — uses `PaginationNotifier` | ✅ Pagination footer spinner | ❌ `PaginationState.error` not rendered | ❌ Not checked |

### Events Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Events List** (`events_screen.dart`) | ✅ Pagination footer shows spinner | ❌ **Major gap** — events uses non-Result `EventsRepository`. Providers can throw, but the screen only checks `state.isEmpty`, not `state.hasError`. If the API fails, errors are silently swallowed. | ✅ `_EmptyState` widget |
| **Add Event** (`add_event_screen.dart`) | ❌ No loading state during save | ✅ SnackBar on photo upload error; raw `catch` on save (line ~97, 135, 183) with only basic handling | N/A |

### Breeding Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Breeding Screen** (`breeding_screen.dart`) | ✅ `AppLoadingWidget` via `breedingRecords.when(loading:)` | ✅ `AppErrorWidget` via `breedingRecords.when(error:)` — BUT the provider returns raw `List<BreedingRecord>` from `LocalBreedingRepository`, so errors come via `AsyncValue.error` from Riverpod's own try/catch | ✅ `AppEmptyState` |

### Marketplace Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Market Screen** (`market_screen.dart`) | ✅ Pagination loading footer | ✅ `AppErrorWidget` shown when `catalogState.hasError` | ✅ `AppEmptyState` |
| **My Listings** | ✅ AsyncValue pattern | ❌ Not checked — uses `.valueOrNull` which silently swallows errors | ✅ Empty state |
| **Create Listing** (`create_listing_screen.dart`) | ❌ No loading state during save | ✅ SnackBar on errors | N/A |
| **Listing Detail** (`listing_detail_screen.dart`) | ✅ SnapBars for actions | ✅ SnackBar on inquiry/report errors | N/A |

### Documents Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Horse Documents** (`horse_documents_screen.dart`) | ✅ `documentsAsync.when(loading:)` with centered spinner | ✅ `documentsAsync.when(error:)` with inline error display | ✅ Empty state with add button |
| **Upload Document** (`upload_document_sheet.dart`) | ✅ `_isUploading` state used | ✅ SnackBar on upload error (from `Result.when(onFailure:)` + raw catch fallback) | N/A |

### Map Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Map Screen** (`map_screen.dart`) | ❌ No loading state shown | ❌ Uses `.valueOrNull` extensively (current position, lost horse reports, geofences, nearby horses) — errors are silently swallowed | ❌ Not checked |

### Profile Feature
| Screen | Loading | Error | Empty |
|---|---|---|---|
| **Profile Screen** (`profile_screen.dart`) | ❌ No loading state | ❌ Uses `.valueOrNull` for auth state, horses, events, lineage roots — errors silently swallowed | ❌ Not checked |

---

## 5. Network Error Handling

### Connection Monitor
- **`ConnectionMonitor`** (`lib/src/core/sync/connection_status.dart`) is a singleton that tracks online/offline via `connectivity_plus`
- Started in `main()` after `runApp()` via `ConnectionMonitor.instance.start()`
- Used in:
  - **Horses screen**: `_OfflineBanner` widget shows an "Offline — Local data" banner
  - **Sync Engine**: `CloudSyncCoordinator` checks connection before syncing

### What Happens When Supabase Is Unavailable
- `getConfiguredSupabaseClient()` gracefully returns `null` if Supabase is not configured
- Supabase repositories check for null client and return early with empty results (`const Result.ok([])`) or specific errors (`Result.fail(_noClient())`)
- **However**: `LocalEventsRepository.syncEvents()` and `LocalEventsRepository.saveEvent()` **do NOT handle Supabase failures gracefully** — they call `getConfiguredSupabaseClient()` and `ensureSupabaseUserId()` but if Supabase calls fail, the exception propagates uncaught

### What Happens on Network Timeout
- No explicit timeout handling anywhere
- `connectivity_plus` reports offline, but timeouts during "online" operation are not caught by any specific timeout mechanism
- `SupabaseEventsRepository` wraps calls in try/catch but the Supabase client's own timeout behavior applies
- The `Result.tryFuture()` wrapper would catch timeouts as generic `AppException` with code `ASYNC_ERROR`

### Sync Queue Retry
- `SyncEngine` (`lib/src/core/sync/sync_engine.dart`) has a max of 5 retries
- After 5 failures, items are **silently dropped** (commented: "log-т үлдээнэ" — but no actual logging found)
- No user-facing notification when sync fails

---

## 6. Provider-Level Error Handling Pattern

### Mixed Pattern Usage

The codebase uses **two conflicting patterns** in Riverpod providers:

**Pattern 1: `Result` → `.getOrThrow()`** (most common)
```dart
final horsesProvider = FutureProvider<List<HorseRecord>>((ref) async {
  final repository = await ref.watch(horsesRepositoryProvider.future);
  return (await repository.fetchHorses()).getOrThrow();
});
```
- If `Result` is `Fail`, `.getOrThrow()` throws `AppException`
- Riverpod catches it and surfaces as `AsyncValue.error`
- Screens can use `.when(data:loading:error:)` to handle it
- **Problem**: Many screens don't use the error handler

**Pattern 2: Non-Result repositories** (events, breeding)
```dart
final eventsProvider = FutureProvider<List<EventRecord>>((ref) async {
  final repository = await ref.watch(eventsRepositoryProvider.future);
  return repository.fetchEvents(); // Can throw raw
});
```
- Riverpod catches the exception and surfaces as `AsyncValue.error`
- Same issue: screens may not handle errors

**Pattern 3: `.valueOrNull`** (silent swallowing)
```dart
final authState = authAsync.valueOrNull;
final horses = horsesAsync.valueOrNull ?? [];
final events = eventsAsync.valueOrNull ?? [];
```
- Used extensively in Profile, Map screens
- **Errors are silently swallowed** with no logging or user feedback

**Pattern 4: Raw try/catch in providers** (Onboarding)
```dart
try {
  // ...
  state = AsyncData(data);
} catch (error, stack) {
  state = AsyncError(error, stack);
}
```

---

## 7. Other Error Handling Observations

### Image Loading Errors
- `CachedNetworkImage.errorWidget` is used in most places (horse card, horse detail, event photos, market listings, market gallery)
- Falls back to a gray `Container()` or `_ErrorPlaceholder`/`_ImageError` — no user message

### Try/Catch Patterns in Screens
- `add_event_screen.dart`: Raw `try {} catch (e) {}` around Supabase photo uploads (lines 97, 135, 183)
- `create_listing_screen.dart`: Same pattern for marketplace (lines 90, 136)
- `upload_document_sheet.dart`: Has raw `catch (e)` fallback (line 264) showing SnackBar with error
- `csv_import_screen.dart`: Raw try/catch around file operations
- `horse_editor_sheet.dart`: Raw try/catch (line 428)
- `horse_transfer_screen.dart`: Raw try/catch (line 51)
- `listing_detail_screen.dart`: Raw try/catch (lines 314, 353)

### Onboarding Providers
- All operations in `OnboardingNotifier` are wrapped in try/catch, properly setting `AsyncError` state
- Good pattern, but `OnboardingRepository` itself doesn't use `Result`

### No `.catchError()`
- Zero uses of `.catchError()` on Futures anywhere in the codebase.

---

## 8. Analytics / Error Reporting

- **No crash reporting tool installed** (no Sentry, Crashlytics, or similar)
- Only mention is a TODO in `docs/tech/sprint-plan.md`: "Q8 — Set up Crashlytics"
- `debugPrint()` is used sparingly (Firebase init skip, notification tap)
- No structured logging system

---

## 9. Summary of Gaps

### Critical Gaps

1. **No global error boundary** — `runZonedGuarded`, `FlutterError.onError`, `ErrorWidget.builder` are all absent. Any uncaught exception shows the Flutter default error screen or crashes silently.

2. **`EventsRepository` (plural) does NOT use `Result`** — while a parallel `EventRepository` (singular) does, the providers use the non-Result version. This means event operations can throw raw exceptions through the provider layer.

3. **`BreedingRepository` abstract does NOT use `Result`** — `LocalBreedingRepository` returns raw lists, no error handling. The `SupabaseBreedingRepository` has proper error handling but isn't wired through the abstract interface.

4. **`MarketRepository` secondary methods lack `Result`** — favorites, seller profile, inquiries, reports, certificates, boost/VIP/badge, and price history methods all throw raw exceptions.

5. **Silent error swallowing via `.valueOrNull`** — Profile screen and Map screen use `.valueOrNull` extensively, which silently drops errors without logging or user notification.

### Medium Gaps

6. **`PaginationState.error` not rendered** in horses screen and events screen — errors are stored in state but never shown to users.

7. **No network timeout handling** — no explicit timeouts on any Supabase calls. Users may experience indefinite loading.

8. **Sync failures silently dropped** — `SyncEngine` drops items after 5 retries with no user-facing notification or logging.

9. **No crash/error reporting** — Sentry/Crashlytics not yet integrated.

10. **Breeding screen uses `BreedingRepository` abstract** (non-Result) but the provider wraps in `FutureProvider` which catches errors as `AsyncValue.error`. However, the `BreedingCreatorSheet` calls `repo.saveBreedingRecord()` directly via `await` with no error handling.

### Minor Gaps

11. **Several screens lack loading states** during save operations (Add Horse, Add Event, Create Listing).

12. **Error messages are hardcoded** in Mongolian with no localization abstraction — consistent but not internationalized.

13. **`LocalEventsRepository.syncEvents()` and `saveEvent()`** can throw uncaught exceptions if Supabase operations fail.

---

## 10. Suggested Approach to Complete Error Handling

### Phase 1: Critical Safety Net (1-2 days)
1. Add global error boundary in `main()`:
   ```dart
   runZonedGuarded(() {
     FlutterError.onError = (details) {
       // Log and show user-friendly error
     };
     runApp(...);
   }, (error, stack) {
     // Log unhandled errors
   });
   ```
2. Add `ErrorWidget.builder` to show branded fallback
3. Install and configure crash reporting (Sentry)

### Phase 2: Repository Consistency (2-3 days)
1. Migrate `EventsRepository` (plural) to `Result`-based, or switch providers to use `EventRepository` (singular) which already has Result
2. Migrate `BreedingRepository` abstract interface to `Result`-based
3. Add `Result` wrappers to all `MarketRepository` secondary methods
4. Migrate `OnboardingRepository` to `Result` pattern

### Phase 3: Screen Error States (2-3 days)
1. Display `PaginationState.error` in Horses and Events list screens
2. Add loading/error states to Add Horse, Add Event, Create Listing save operations
3. Replace `.valueOrNull` patterns with `.when(data:loading:error:)` in Profile and Map screens
4. Add retry buttons on all error states

### Phase 4: Network Resilience (1-2 days)
1. Add explicit timeouts to Supabase calls (e.g., 15s timeout)
2. Add user-friendly "No internet" dialogs/toasts for failed operations
3. Wire sync failure notifications to the UI
4. Add retry mechanism for failed sync items visible to user

### Phase 5: Testing (1-2 days)
1. Write unit tests for Result pattern usage in providers
2. Write widget tests for loading/error/empty states in each feature
3. Test offline behavior end-to-end
4. Test network timeout scenarios
