# Error Handling Gaps — Investigation Findings

> Generated: 2026-06-16
> Source: Codebase audit of `/Users/themuuln/coding/tamga`

---

## ⚠️ Important: Report vs Current State

The existing `error_handling_report.md` was written **before** several fixes were applied.
Several gaps it identified have already been addressed. This report reflects the **current** state.

---

## 1. Global Error Boundary

**Status: ✅ ALREADY IMPLEMENTED**

The following are present and wired up:

| Component | File | Lines | Status |
|---|---|---|---|
| `configureErrorHandling()` | `lib/src/core/error/error_boundary.dart` | 23-67 | ✅ Sets `FlutterError.onError` + `ErrorWidget.builder` |
| `FirebaseCrashReporter` | `lib/src/core/error/crash_reporter.dart` | 42-102 | ✅ Full Crashlytics integration |
| `CrashReporter` abstract class | `lib/src/core/error/crash_reporter.dart` | 9-29 | ✅ Interface for testability |
| `runZonedGuarded` | `lib/main.dart` | 67-82 | ✅ Catches unhandled async errors |
| `TamgaErrorWidget` | `lib/src/core/widgets/` (referenced) | — | ✅ Custom error widget for `ErrorWidget.builder` |

**Files:**
- `/Users/themuuln/coding/tamga/lib/main.dart` — lines 67-82: `runZonedGuarded` + `configureErrorHandling` call
- `/Users/themuuln/coding/tamga/lib/src/core/error/error_boundary.dart` — full implementation
- `/Users/themuuln/coding/tamga/lib/src/core/error/crash_reporter.dart` — full implementation

**No changes needed.**

---

## 2. EventsRepository (plural) — Result Type

**Status: ✅ ALREADY USING RESULT TYPE**

| File | Methods | Return Type |
|---|---|---|
| `lib/src/features/events/data/events_repository.dart` | `fetchEvents()`, `fetchEventsPaginated()`, `syncEvents()`, `saveEvent()` | `Future<Result<...>>` |

All methods return `Future<Result<...>>`. The report was incorrect about this gap.

**Implementation:**
- `lib/src/features/events/data/local_events_repository.dart` — all methods wrapped in try/catch, returning `Result.fail(...)` on error
- `lib/src/features/events/data/supabase_events_repository.dart` — all methods wrapped in try/catch, returning `Result.fail(...)` on error

**No changes needed.**

---

## 3. BreedingRepository — Result Type

**Status: ✅ ALREADY USING RESULT TYPE**

| File | Methods | Return Type |
|---|---|---|
| `lib/src/features/breeding/data/breeding_repository.dart` | `fetchBreedingRecords()`, `saveBreedingRecord()` | `Future<Result<...>>` |
| `lib/src/features/breeding/data/local_breeding_repository.dart` | Full implementations | `Future<Result<...>>` |

All methods return `Future<Result<...>>`. The report was incorrect about this gap.

**No changes needed.**

---

## 4. MarketRepository Secondary Methods

**Status: ✅ ALREADY USING RESULT TYPE (in the active implementation)**

The `MarketRepository` abstract interface (`lib/src/features/market/data/market_repository.dart`) uses `Result<T>` for ALL methods, including secondary ones (favorites, seller, certificates, boost/VIP/badge, price history).

The active implementation (`LocalMarketRepositoryV2` at `lib/src/features/market/data/local_market_repository_v2.dart`) implements ALL methods with proper `Result<T>` wrapping.

**However:** The legacy `LocalMarketRepository` (non-V2, at `lib/src/features/market/data/local_market_repository.dart`) has several methods WITHOUT `Result`:

| Method | Return Type | Result? |
|---|---|---|
| `fetchListings()` | `Future<List<MarketListing>>` | ❌ |
| `fetchFavoriteListingIds()` | `Future<List<String>>` | ❌ |
| `fetchSellerProfile()` | `Future<SellerProfile?>` | ❌ |
| `fetchInquiries()` | `Future<List<MarketInquiry>>` | ❌ |
| `createInquiry()` | `Future<MarketInquiry>` | ❌ |
| `createReport()` | `Future<ListingReport>` | ❌ |
| `fetchReports()` | `Future<ListingReport>` | ❌ |
| `saveListing()` | `Future<List<MarketListing>>` | ❌ |
| `updateListingStatus()` | `Future<List<MarketListing>>` | ❌ |
| `toggleFavorite()` | `Future<List<String>>` | ❌ |
| `fetchCertificateForHorse()` | `Future<DigitalCertificate?>` | ❌ |
| `fetchPriceHistory()` | `Future<List<PriceHistoryRecord>>` | ❌ |
| `submitSellerRating()` | `Future<void>` | ❌ |

**But:** `LocalMarketRepository` (non-V2) is **NOT used by any providers**. The providers (`lib/src/features/market/application/market_providers.dart` lines 149-150, 443) use `LocalMarketRepositoryV2` which properly implements `MarketRepository` with `Result`.

**Mitigation:** The legacy class is only referenced in tests (`test/local_repositories_test.dart` lines 81-115). It could be deprecated/removed but isn't a production gap.

**No changes needed for production code.**

---

## 5. `.valueOrNull` Silent Error Swallowing in Profile and Map Screens

### Profile Screen

**File:** `/Users/themuuln/coding/tamga/lib/src/features/profile/presentation/profile_screen.dart`

| Line | Code | Issue |
|---|---|---|
| 51 | `final authState = authAsync.valueOrNull;` | Errors silently become `null` |
| 53 | `final horses = horsesAsync.valueOrNull ?? [];` | Errors silently become `[]` |
| 55 | `final events = eventsAsync.valueOrNull ?? [];` | Errors silently become `[]` |
| 363 | `final roots = rootsAsync.valueOrNull ?? [];` | Errors silently become `[]` |

**Mitigation already present:** The profile screen has error listeners (lines 70-105) using `ref.listen()` that show `TamgaToast.showError()` on each provider error. So errors ARE surfaced to users via toast, but the **initial render** silently falls back to empty/nil data.

### Map Screen

**File:** `/Users/themuuln/coding/tamga/lib/src/features/map/presentation/map_screen.dart`

| Line | Code | Issue |
|---|---|---|
| 111 | `styleAsync.valueOrNull ?? 'https://...'` | Errors silently use fallback URL |
| 202 | `ref.read(activeLostHorsesStreamProvider).valueOrNull ??` | Errors silently become `[]` |
| 203 | `ref.read(activeLostHorsesProvider).valueOrNull ??` | Errors silently become `[]` |
| 225 | `ref.read(activeGeofencesProvider).valueOrNull ?? []` | Errors silently become `[]` |
| 249 | `ref.read(nearbyHorsesStreamProvider).valueOrNull ??` | Errors silently become `[]` |
| 250 | `ref.read(nearbyHorsesProvider(20.0)).valueOrNull ??` | Errors silently become `[]` |

**Mitigation already present:** The map screen has error listeners (lines 54-97) using `ref.listen()` that show `TamgaToast.showError()` on errors for lost horse reports, geofences, and nearby horses. However, the **initial render** silently falls back to empty data.

### Other `.valueOrNull` Usages (not in Profile/Map but still silent)

| File | Line | Provider |
|---|---|---|
| `lib/src/features/onboarding/presentation/widgets/onboarding_completion_checklist.dart` | 214 | `onboardingProvider` |
| `lib/src/features/horses/presentation/public_horse_profile_screen.dart` | 24 | horse profile |
| `lib/src/features/horses/presentation/csv_import_screen.dart` | 55, 81 | `horsesProvider` |
| `lib/src/features/horses/presentation/add_horse_screen.dart` | 322 | `horsesProvider` |
| `lib/src/features/map/presentation/active_reports_screen.dart` | 21 | `currentPositionProvider` |
| `lib/src/features/breeding/presentation/breeding_screen.dart` | 107 | `horsesProvider` |
| `lib/src/features/shared/application/sync_providers.dart` | 61, 84, 96 | `cloudSyncCoordinatorProvider` |
| `lib/src/features/market/presentation/market_screen.dart` | 66, 68, 299, 300 | Various providers |
| `lib/src/features/shell/presentation/app_shell.dart` | 95 | `authStateProvider` |
| `lib/src/features/auth/presentation/register_screen.dart` | 56, 74 | `authStateProvider` |
| `lib/src/features/auth/presentation/login_screen.dart` | 49, 86 | `authStateProvider` |
| `lib/src/features/stable/application/stable_providers.dart` | 65, 71, 77, 85 | Various stable providers |
| `lib/src/app/router/app_router.dart` | 101 | `authStateProvider` |
| `lib/src/app/app.dart` | 25 | `authStateProvider` |
| `lib/src/core/features/feature_flags_providers.dart` | 23 | Service provider |
| `lib/src/core/features/feature_gate.dart` | 140, 146 | `subscriptionTierProvider` |
| `lib/src/features/lineage/application/lineage_roots_provider.dart` | 61, 84 | Lineage providers |

**Suggested approach:**
1. Replace `.valueOrNull` in Profile screen with `.when(data:loading:error:)` or keep current pattern (error listeners + fallback values) — the latter is acceptable since errors ARE surfaced
2. Same for Map screen — errors are already surfaced via listeners
3. For other screens, consider whether silent fallback is acceptable or if errors should be surfaced
4. Most `.valueOrNull` usages are for **non-critical** display features where showing `null`/`[]` is acceptable UX

---

## 6. `PaginationState.error` Not Rendered

### Horses Screen

**File:** `/Users/themuuln/coding/tamga/lib/src/features/horses/presentation/horses_screen.dart`
**Class:** `_PaginationFooter` (lines 338-363)

```dart
class _PaginationFooter extends StatelessWidget {
  final PaginationState<HorseRecord> state;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading) {
      return spinner;                          // ✅ Handled
    }
    if (!state.hasMore && state.items.isNotEmpty) {
      return end-of-list message;              // ✅ Handled
    }
    return const SizedBox.shrink();
    // ❌ state.hasError / state.error NEVER checked
  }
}
```

**Gap:** `PaginationState.error` is stored by `PaginationNotifier` (pagination_state.dart lines 97-99) when `fetchPage` throws, but `_PaginationFooter` never reads `state.hasError` or `state.error`.

### Events Screen

**File:** `/Users/themuuln/coding/tamga/lib/src/features/events/presentation/events_screen.dart`
**Class:** `_EventList` (lines 237-270)

```dart
// Pagination footer section (lines 254-269):
if (state != null && state!.isLoading)
  return spinner;                              // ✅ Handled
else if (state != null && !state!.hasMore && state!.items.isNotEmpty)
  return end-of-list message;                  // ✅ Handled
// ❌ state!.hasError / state!.error NEVER checked
```

**Gap:** Same as horses — `PaginationState.error` is never rendered.

**Health Log screen** likely has the same issue (referenced in the report).

**Suggested approach:**
1. Add `state.hasError` check to `_PaginationFooter` in `horses_screen.dart`
2. Add `state!.hasError` check to `_EventList` in `events_screen.dart`
3. Display error message with retry button
4. Apply same fix to any other screen using `PaginationNotifier` (health logs)

---

## 7. Additional Findings Beyond Original Report

### 7a. `LocalEventsRepository.syncEvents()` and `saveEvent()` — Supabase Failure Risk

**File:** `/Users/themuuln/coding/tamga/lib/src/features/events/data/local_events_repository.dart`

- Line 95: `final client = getConfiguredSupabaseClient();` — returns nullable, handled
- Line 96: `final userId = await ensureSupabaseUserId();` — returns nullable, handled
- Lines 101-102: Supabase `.upsert()` and `.select()` calls are **inside try/catch** — will return `Result.fail(...)` on error

So this is actually handled correctly now. The try/catch at lines 91-110 wraps the entire sync operation.

**Status: ✅ Already handled.**

### 7b. Screen-Level Error Handling For `.valueOrNull` Screens

Both Profile and Map screens use `ref.listen()` to show toast errors. However, there's a subtle issue: `ref.listen()` fires **after** the initial render. The initial frame shows empty/nil data briefly before the toast appears. This is a minor UX gap.

### 7c. No `.catchError()` on Futures

Confirmed: zero uses of `.catchError()` in the entire codebase. While `Result` type is the preferred pattern, some async operations outside repositories use raw Futures without `.catchError()`.

---

## Summary of Remaining Gaps

| # | Gap | Priority | Files to Change | Lines |
|---|---|---|---|---|
| G1 | `PaginationState.error` not rendered in horses screen | **HIGH** | `lib/src/features/horses/presentation/horses_screen.dart` — `_PaginationFooter` | 338-363 |
| G2 | `PaginationState.error` not rendered in events screen | **HIGH** | `lib/src/features/events/presentation/events_screen.dart` — `_EventList` | 254-269 |
| G3 | `.valueOrNull` silent fallback in Profile screen (initial render) | **MEDIUM** | `lib/src/features/profile/presentation/profile_screen.dart` | 51, 53, 55, 363 |
| G4 | `.valueOrNull` silent fallback in Map screen (initial render) | **MEDIUM** | `lib/src/features/map/presentation/map_screen.dart` | 111, 202, 203, 225, 249, 250 |
| G5 | Legacy `LocalMarketRepository` non-Result methods (not used in prod) | **LOW** | `lib/src/features/market/data/local_market_repository.dart` | Multiple |
| G6 | Zero `.catchError()` usage on raw Futures | **LOW** | Various files | Multiple |

## Closed/Already Fixed Gaps (from original report)

| Original Gap | Current Status | Evidence |
|---|---|---|
| 1. No global error boundary | ✅ IMPLEMENTED | `main.dart` lines 67-82, `error_boundary.dart` |
| 2. EventsRepository not using Result | ✅ USING RESULT | `events_repository.dart` all methods |
| 3. BreedingRepository not using Result | ✅ USING RESULT | `breeding_repository.dart` all methods |
| 4. MarketRepository secondary methods lack Result | ✅ USING RESULT (active implementation) | `LocalMarketRepositoryV2` + `MarketRepository` |
| 7. No crash/error reporting | ✅ IMPLEMENTED | `FirebaseCrashReporter` in `crash_reporter.dart` |
