# Validation Contract — DRY/CLEAN Refactoring

> Generated for Milestone 5 (Local Repository Base Class) and Milestone 6 (Provider Pattern Consolidation).

---

## Area 1: Local Repository Base Class (`VAL-LOCAL-*`)

**Target:** A generic `LocalRepository<T, TIsar>` abstract base class in `lib/src/core/data/` that extracts the common Isar + SyncQueue CRUD pattern shared across 8 local repository implementations.

### Current duplicates (pre-refactoring)

Each of the 8 repos repeats ~50-80 lines of boilerplate: constructor injection (`IsarStorage storage`, `SyncQueue syncQueue`), `filter().domainIdEqualTo()` lookups, Isar write transactions, and `_syncQueue.enqueue()` calls. The base class eliminates this.

### Assertions

| ID              | Assertion                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Verification method                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `VAL-LOCAL-001` | **A file `lib/src/core/data/local_repository.dart` exists** defining `abstract class LocalRepository<T, TIsar>` with type parameters `T` (domain model) and `TIsar` (Isar schema). The file lives under `lib/src/core/data/`.                                                                                                                                                                                                                                         | `[ -f lib/src/core/data/local_repository.dart ]`                                                    |
| `VAL-LOCAL-002` | **Constructor accepts `IsarStorage` + `SyncQueue`.** The base class has a constructor with `required IsarStorage storage` and `required SyncQueue syncQueue` parameters, stored as protected `_storage` and `_syncQueue` fields.                                                                                                                                                                                                                                      | Grep for `LocalRepository(` in the file and verify the constructor signature.                       |
| `VAL-LOCAL-003` | **Base class exposes at least four protected/callable methods:** `Future<Result<List<T>>> findAll()`, `Future<Result<T?>> findById(String id)`, `Future<Result<T>> save(T item)`, `Future<Result<void>> delete(String id)`. Each returns `Result<…>` from `lib/src/core/error/result.dart`.                                                                                                                                                                           | Check method signatures in the base class.                                                          |
| `VAL-LOCAL-004` | **`save()` enqueues a `SyncQueueItem`.** After the Isar write transaction, `save()` calls `_syncQueue.enqueue(SyncQueueItem(…))` with `action` = `SyncAction.create` for new items or `SyncAction.update` for existing items (determined by a `domainIdEqualTo(item.id)` check).                                                                                                                                                                                      | Inspect the `save()` body for `_syncQueue.enqueue(`.                                                |
| `VAL-LOCAL-005` | **`delete()` enqueues a `SyncQueueItem`.** After the Isar delete transaction, `delete()` calls `_syncQueue.enqueue(SyncQueueItem(…))` with `action = SyncAction.delete`. It guards against deleting non-existent items (no-op if not found).                                                                                                                                                                                                                          | Inspect the `delete()` body for `_syncQueue.enqueue(`.                                              |
| `VAL-LOCAL-006` | **All 8 target local repos extend `LocalRepository<T, TIsar>` instead of `implements` their respective interface directly.** The 8 repos are: `LocalHorsesRepository`, `LocalHealthRepository`, `LocalEventRepository`, `LocalBreedingRepository`, `LocalTrainingRepository`, `LocalNutritionRepository`, `LocalDocumentRepository`, `LocalMarketRepositoryV2`. Each still `implements` its feature's abstract repository interface but `extends LocalRepository<…>`. | Grep for `extends LocalRepository<` in each of the 8 files. Expect exactly 8 matches, one per file. |
| `VAL-LOCAL-007` | **All tests in `test/features/*/data/local_*_test.dart` continue to pass.** Existing unit tests for each local repository validate CRUD behavior, sync queue enqueue semantics, and edge cases (unknown horse IDs, duplicate ID handling).                                                                                                                                                                                                                            | Run `flutter test test/features/ --reporter expanded` — zero failures.                              |

> Total: **7 assertions** (VAL-LOCAL-001 through VAL-LOCAL-007)

---

## Area 2: Provider Pattern Consolidation (`VAL-PROV-*`)

**Target:** A shared `createListProvider` helper function that eliminates ~10 lines of `FutureProvider<List<T>>` boilerplate repeated across 9 feature provider files.

### Current duplicates (pre-refactoring)

Each of 9 provider files repeats:

```dart
final xxxProvider = FutureProvider<List<XxxModel>>((ref) async {
  final repo = await ref.watch(xxxRepositoryProvider.future);
  return (await repo.fetchAll()).getOrThrow();
});
```

### Assertions

| ID             | Assertion                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Verification method                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VAL-PROV-001` | **A helper function `createListProvider` exists** in `lib/src/core/providers/list_provider_helper.dart` (or similar path under `lib/src/core/providers/`). The function signature is: `FutureProvider<List<T>> createListProvider<T>(FutureProvider<…> Function(Ref) repositoryProvider, Future<List<T>> Function(dynamic) fetchAll)` or an equivalent concise signature.                                                                                          | `[ -f lib/src/core/providers/list_provider_helper.dart ]` or Grep for `createListProvider` definition.                                              |
| `VAL-PROV-002` | **`createListProvider` always unwraps via `getOrThrow()`.** The returned `FutureProvider` calls `result.getOrThrow()` on the `fetchAll()` result, propagating `AppException` as an unhandled error (consistent with existing behavior).                                                                                                                                                                                                                            | Inspect the `createListProvider` body for `getOrThrow()`.                                                                                           |
| `VAL-PROV-003` | **The 9 feature provider files each use `createListProvider` to define their primary list provider.** Files: `horses_providers.dart`, `health_providers.dart`, `events_providers.dart`, `breeding_providers.dart`, `training_providers.dart`, `nutrition_providers.dart`, `document_providers.dart`, `team_providers.dart`, `certificate_providers.dart`. Each file's main `FutureProvider<List<…>>` is now expressed via `createListProvider` rather than inline. | Grep for `createListProvider` across the 9 files. Expect exactly 9 call sites (some files may have multiple if they have family-provider variants). |
| `VAL-PROV-004` | **Repository provider pattern is preserved.** Each feature still defines its own `*RepositoryProvider` (e.g., `healthRepositoryProvider`) — the base class does not eliminate that, only the list-provider boilerplate. The `createListProvider` call references the feature's repository provider.                                                                                                                                                                | For each of the 9 files, the `*RepositoryProvider` declaration still exists.                                                                        |
| `VAL-PROV-005` | **All provider-level tests continue to pass.** Tests in `test/features/*/application/*_test.dart` and related provider tests run without failure.                                                                                                                                                                                                                                                                                                                  | Run `flutter test test/features/ --reporter expanded` — zero failures.                                                                              |

> Total: **5 assertions** (VAL-PROV-001 through VAL-PROV-005)

---

## Summary

| Area                           | ID prefix    | Assertions |
| ------------------------------ | ------------ | ---------- |
| Local Repository Base Class    | `VAL-LOCAL-` | 7          |
| Provider Pattern Consolidation | `VAL-PROV-`  | 5          |
| **Total**                      |              | **12**     |
