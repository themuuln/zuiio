# Migration Analysis — Tamga Flutter Codebase

> Generated: 2026-06-20
> Scope: Full investigation of current patterns across domain models, providers, UI, storage, and cloud layers.

---

## 1. Domain Models

### Files Examined

| File | Path |
|------|------|
| Horse | `lib/src/shared/domain/horse.dart` |
| MarketListing | `lib/src/features/market/domain/market_listing.dart` |
| CoOwnershipRecord | `lib/src/features/horses/domain/co_ownership.dart` |

### Current Patterns

- **Hand-written classes** — all models are plain Dart classes with manual constructors, `copyWith()`, `==`/`hashCode`, and serialization methods
- **No code generation** — no `freezed`, no `json_serializable`, no `equatable` annotations
- **Manual serialization** — each model has hand-rolled `fromJson()`/`toJson()` (camelCase) AND `fromSupabaseJson()`/`toSupabaseJson()` (snake_case)
- **Pure Dart** — domain layer imports nothing from Flutter, Supabase, or Riverpod (clean architecture compliant)
- **Enums with extensions** — enums use `extension` methods for labels, conversions (e.g. `MarketSaleTypeLabel`, `BoostLevelLabel`)
- **Sentinel pattern** — for nullable copyWith fields, use a `_sentinel` constant to distinguish "not provided" from `null`
- **Bilingual comments** — Mongolian description + English code

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Replace with `freezed` | **High** (~40 models) | Every model's constructor, copyWith, ==/hashCode, and JSON serialization would be replaced with `@freezed` + `@JsonSerializable`. Requires build_runner regeneration. |
| Split Supabase serialization | **Medium** | Currently mixed into domain models. Could be extracted to `data` layer mappers if desired. |
| Enums → freezed unions | **Low/Med** | Enums with `BoostLevel`, `VipLevel`, etc. could stay as plain enums or become freezed unions. Low priority. |

---

## 2. Providers (Riverpod)

### Files Examined

| File | Path |
|------|------|
| Horses providers | `lib/src/features/horses/application/horses_providers.dart` |
| Market providers | `lib/src/features/market/application/market_providers.dart` |
| Co-ownership providers | `lib/src/features/horses/application/co_ownership_providers.dart` |
| createListProvider helper | `lib/src/core/providers/create_list_provider.dart` |

### Current Patterns

- **Provider types used**:
  - `FutureProvider` — for async data fetching (most common)
  - `FutureProvider.family` — for parameterized fetches (e.g. `coOwnersProvider(horseId)`)
  - `StreamProvider.family` — for real-time streams (e.g. `coOwnersStreamProvider`)
  - `StateNotifierProvider` — for pagination (`PaginationNotifier`)
  - `StateProvider` — for simple mutable state filters
  - `Provider` — for synchronous dependency injection (repository wiring)
- **Custom helper** — `createListProvider<T, R>()` / `createListFamilyProvider()` wraps the common pattern of watching a repository FutureProvider, calling a fetch, and unwrapping `Result<T>` via `.getOrThrow()`
- **Repository instantiation** — repositories are created as `FutureProvider` singletons, e.g.:
  ```dart
  final horsesRepositoryProvider = FutureProvider<HorsesRepository>((ref) async {
    return LocalHorsesRepository(storage: IsarStorage.instance, syncQueue: SyncQueue());
  });
  ```
- **Pagination** — uses `PaginationNotifier` + `PaginationState` pattern with `loadInitial()`/`loadMore()` API
- **Feature-gated cloud** — `co_ownership_providers.dart` conditionally switches between local and Supabase repos based on `AppConfig.isSupabaseConfigured`
- **Manual invalidation** — `ref.invalidate(horsesProvider)` on save/delete to trigger refetch

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Notifier → AsyncNotifier | **Medium** | `StateNotifierProvider` is deprecated; migrate to `NotifierProvider`/`AsyncNotifierProvider` |
| FutureProvider → FutureProvider | **Low** | Still valid. `createListProvider` helper works fine. |
| autoDispose audit | **Low** | Some providers are missing `.autoDispose`; audit for memory leaks |
| Code gen (Riverpod generator) | **Optional** | Could adopt `@riverpod` annotations (`riverpod_generator`) for type safety, but not required |
| Result unwrapping boilerplate | **Low** | `createListProvider` already reduces it; could be further abstracted |

---

## 3. UI Layer (Screens & Widgets)

### Files Examined

| File | Path |
|------|------|
| HorsesScreen | `lib/src/features/horses/presentation/horses_screen.dart` |
| HorseCard | `lib/src/features/horses/presentation/horse_card.dart` (60 lines) |
| HorseDetailScreen | `lib/src/features/horses/presentation/horse_detail_screen.dart` (80 lines) |

### Current Patterns

- **Widget type preference**: `ConsumerWidget` for stateless, `ConsumerStatefulWidget` for stateful (Riverpod's standard pattern)
- **Navigation**: Direct `Navigator.of(ctx).push(MaterialPageRoute(...))` — no GoRouter for feature navigation
- **Material widgets**: Standard Material Design (`Card`, `Scaffold`, `SliverAppBar`, `TabBar`, `InkWell`, `PopupMenuButton`, etc.)
- **Custom widget library**: `lib/src/core/widgets/` has 24 reusable widgets (`TamgaCard`, `TamgaAvatar`, `TamgaToast`, etc.)
- **Theme**: Accessed via `Theme.of(ctx)` and `colorScheme.onSurfaceVariant` etc.
- **State management**: Standard Riverpod `ref.watch()` / `ref.read()`
- **Photo handling**: `cached_network_image` + `image_picker` + manual `uploadHorsePhoto` flow
- **Error handling**: `TamgaToast.showError()` for user-facing messages
- **Bilingual UI**: Mongolian text in strings (e.g., `'Морьд'`, `'Морь нэмэх'`)
- **Haptic feedback**: `HapticFeedback.selectionClick()` on tab switches
- **Animated transitions**: `AnimatedSwitcher` with `FadeTransition`
- **No routing abstraction**: Direct navigation between screens, no deep linking or route guards

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| ConsumerWidget → keep | **None** | Still the current best practice |
| GoRouter adoption | **High** (~50 screens) | Currently all push/pop. GoRouter is listed as dependency but barely used. Full migration would be ~50+ screens. |
| Material -> custom design system | **High** | If migrating away from Material design. Currently deeply integrated. |
| Tamga widget replacement | **Medium** | If widgets change API or theme tokens change |
| Navigation state | **Medium** | If adding deep linking or auth guards |

---

## 4. Core Layer (`lib/src/core/`)

### Directory Structure

```
lib/src/core/
├── constants/        (2 files)  — HorseCoatColors, RaceCategories
├── data/             (2 files)  — LocalRepository (abstract base), SupabaseRepositoryMixin
├── domain/           (1 file)   — NotificationPreferences
├── error/            (4 files)  — Result<T>, AppException, ErrorHelpers, CrashReporter, ErrorBoundary
├── features/         (3 files)  — FeatureFlags, FeatureGate, FeatureFlagProviders
├── layout/           (1 file)   — ResponsiveLayout
├── providers/        (1 file)   — create_list_provider.dart
├── services/         (5 files)  — Notification services (local, scheduler, trigger, types)
├── storage/          (2 files)  — IsarDatabase (singleton), LocalStorage interface + cloud/
├── sync/             (5 files)  — SyncQueue, SyncEngine, SyncConfig, SyncConflict, ConnectionStatus
├── theme/            (?)        — Custom theme
└── widgets/          (24 files) — TamgaXxx reusable widgets
```

### Key Observations

- **`Result<T>` pattern** — sealed class (`Ok` / `Fail`) used throughout. This is a core architectural choice that would need preserving or standardizing.
- **`LocalRepository<T, TIsar>`** — abstract base class providing `findAll()`, `findById()`, `save()`, `delete()` with auto SyncQueue enqueue. All local repositories extend this.
- **`SupabaseRepositoryMixin`** — shared mixin providing `safeClient`, `currentUserId`, `wrapError()`, `noClientError()`. Used by Supabase repository implementations.
- **`SyncQueue`** — offline-first queue with `SyncAction` (create/update/delete), `SyncItemStatus` (pending/synced/failed), dead letter queue, and exponential backoff retry.
- **`SyncEngine`** — background processor for SyncQueue with configurable `maxRetries`, `batchSize`, and dead letter callback.
- **`IsarDatabase`** — singleton with 39 registered schemas, initialized once in `main()`.
- **Feature flags** — runtime feature gating system.

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Result<T> to exceptions | **Very High** | Changes all repository return types. Not recommended — Result pattern is sound. |
| LocalRepository to base repo | **Low** | Abstract base is well-designed; could be enhanced with generics generics |
| Sync infrastructure | **Preserve** | SyncQueue/SyncEngine is a significant asset; keep as-is |
| Error handling | **Preserve** | Result + AppException is a solid pattern |

---

## 5. Shared Feature Layer (`lib/src/features/shared/`)

### Structure

```
lib/src/features/shared/
├── application/   (2 files) — SyncExtensions, SyncProviders
├── data/          (5+38 files)
│   ├── isar_schemas/ (38 schema files + 38 .g.dart generated = 76 files)
│   ├── isar_storage.dart
│   ├── isar_sync_storage.dart
│   ├── local_json_store.dart
│   ├── local_sync_preferences.dart
│   └── pagination/ (2 files)
└── presentation/  (7 files) — ConflictResolutionScreen, OfflineBanner, OfflineSaveFeedback,
                               PlaceholderScreen, SyncIndicator, SyncQueueScreen, SyncSettingsScreen
```

### Key Observations

- **89 files total** — largest single subdirectory
- **Isar schemas** — 38 hand-written `@collection` classes each with `fromDomain()`/`toDomain()` and auto-generated `.g.dart` files from Isar code generator
- **`IsarStorage`** — typed accessor class with 39+ getters, one per collection, delegating to `IsarDatabase.instance`
- **Pagination** — `PaginatedResult` wrapper with `items` + `totalCount`; `PaginationState` for `StateNotifier`
- **Sync UI** — full suite of sync status/conflict/resolution screens
- **Offline support** — offline banner, save feedback, sync queue management UI

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Isar → other DB | **Extreme** | 38 schemas × 2 files each = 76 files. All `@collection` classes, generated code, storage layer, and all repository implementations would need rewriting. |
| Isar schema rename | **Medium** | If just renaming/moving, grep-replace across 38 files |
| Sync UI redesign | **Medium** | If UX paradigm changes |
| Pagination helper | **Low** | Simple utility classes |

---

## 6. Local Storage — Isar Repository

### File Examined

| File | Path |
|------|------|
| LocalHorsesRepository | `lib/src/features/horses/data/local_horses_repository.dart` |
| LocalRepository (base) | `lib/src/core/data/local_repository.dart` |

### Current Pattern

- **Inheritance chain**: `LocalHorsesRepository extends LocalRepository<HorseRecord, IsarHorse> implements HorsesRepository`
- **Base class** `LocalRepository<T, TIsar>` provides:
  - `findAll()` → reads all from Isar collection, maps to domain
  - `findById(domainId)` → scans all records for matching `domainId` (Dart-level filter due to generic type erasure)
  - `save(item)` → checks existence, preserves Isar auto-increment ID, writes via `writeTxn`, enqueues SyncQueueItem
  - `delete(domainId)` → finds by domainId, deletes, enqueues SyncQueueItem
- **Subclass override** for custom logic:
  - `fetchHorses()` — reads local, checks if auto-sync is enabled, optionally syncs with Supabase
  - `fetchHorsesPaginated()` — handles seeding if empty, paginated read
  - `syncHorses()` — upserts local to Supabase, replaces entire local collection with remote
  - `saveHorse()` — custom save that also triggers sync
- **Seed data** — hardcoded initial seed in the repository file itself
- **Sync pattern** — `syncQueue.enqueue(...)` followed by async sync call; the SyncQueue captures the offline item while sync happens live
- **Write transactions** — all writes wrapped in `collection.isar.writeTxn(() async { ... })`
- **`toSupabaseJson`** — domain model has its own `toSupabaseJson()` method

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Isar DB engine | **Extreme** | Replacing Isar affects every repository, every schema, the IsarDatabase singleton, IsarStorage typed accessor, and all generated code. |
| LocalRepository base | **Medium** | Could be made more type-safe with actual `domainIdEqualTo` filter (not currently possible due to generic type erasure) |
| Seed data extraction | **Low** | Move to dedicated seed files |
| Sync logic extraction | **Medium** | Sync logic (syncHorses, saveHorse with sync) is mixed with CRUD; could be separated into a sync service |

---

## 7. Supabase — Remote Repository

### Files Examined

| File | Path |
|------|------|
| SupabaseMessageRepository | `lib/src/features/market/data/supabase_message_repository.dart` |
| SupabaseRepositoryMixin | `lib/src/core/data/supabase_repository_mixin.dart` |

### Current Pattern

- **Wraps local repository** — `SupabaseMessageRepository` contains a `LocalMessageRepository` and delegates all reads to it
- **Write-through to Supabase** — writes go to local first, then asynchronously pushed to Supabase via `_sendToSupabase()`
- **Realtime subscriptions** — uses `Supabase.instance.client.channel()` + `onPostgresChanges()` for live message updates
- **Fallback on failure** — Supabase errors are caught and silently ignored; local storage remains the source of truth
- **Mixin for helpers** — `SupabaseRepositoryMixin` provides `safeClient`, `currentUserId`, `wrapError()`, `noClientError()`
- **Direct SQL/REST calls** — `client.from(table).upsert()` and `client.from(table).select()`
- **Manual JSON serialization** — all `toJson()`/`fromJson()` for Supabase are hand-written
- **No typed client** — no `supabase` generated client; raw map access with type casts

### Migration Impact

| Area | Effort | Notes |
|------|--------|-------|
| Supabase typed client | **High** | 20+ tables. Could auto-generate from schema but requires rework of all serialization |
| Repository pattern redesign | **High** | Currently local-first with Supabase as optional sync target. If switching to cloud-first, entire pattern inverts. |
| Realtime subscriptions | **Medium** | Currently ad-hoc per repository. Could centralize with a subscription manager. |
| Error handling | **Low** | Currently silences errors; could improve with retry/reporting |
| Auth integration | **Medium** | `ensureSupabaseUserId()` pattern needs review if auth changes |

---

## Summary: Migration Scope by Category

| Category | Current Pattern | Target | Effort | Key Files |
|----------|---------------|--------|--------|-----------|
| **Domain Models** | Hand-written, manual JSON + Supabase serialization | Freezed + json_serializable | **High** | ~40 models across `lib/src/features/*/domain/` and `lib/src/shared/domain/` |
| **Isar Schemas** | 38 `@collection` classes with fromDomain/toDomain | Keep or replace DB | **Extreme** | `lib/src/features/shared/data/isar_schemas/` (76 files) |
| **Isar Storage** | Singleton + typed accessor | Keep or replace | **Extreme** | `isar_database.dart`, `isar_storage.dart` |
| **Providers** | FutureProvider, StateNotifierProvider, etc. | AsyncNotifier, autoDispose | **Medium** | ~30 provider files across features |
| **Repository Pattern** | Abstract interface + Local + Supabase impls | Consolidate? | **High** | Each feature has 2-4 repository files |
| **Sync Infrastructure** | SyncQueue + SyncEngine + dead letter | Keep | **Low** | `lib/src/core/sync/` |
| **Result Type** | Sealed class `Result<T>` | Keep or standardize | **Low** | `lib/src/core/error/result.dart` |
| **UI** | ConsumerWidget, Material, direct Navigator | Keep or GoRouter | **Medium** | ~100 screen/widget files |
| **Core Widgets** | 24 custom Tamga widgets | Keep or redesign | **Medium** | `lib/src/core/widgets/` |
| **Shared Feature** | Isar schemas, sync UI, pagination | Keep | **None** | `lib/src/features/shared/` (89 files) |
| **Supabase** | Direct client, manual JSON, mixin | Typed client? | **High** | Repository files + serialization |

## Recommended Migration Priority

1. **Low-hanging fruit**: Add `autoDispose` to providers, extract seed data, consolidate pagination
2. **Domain models** (freezed): ~40 models, automated via build_runner — high value for maintenance
3. **Provider modernization** (StateNotifierProvider → NotifierProvider): ~5-10 provider files
4. **GoRouter migration**: ~50 screens, significant but mechanical
5. **Isar/DB change**: Only if absolutely needed — 76 schema files + all repositories
6. **Supabase typed client**: After domain models are freezed, can use `@JsonSerializable` for both JSON formats
