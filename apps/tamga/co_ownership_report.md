# Sync Queue Gap Analysis Report

> Generated: 2026-06-16
> Scope: Cloud sync system in Tamga Flutter project

---

## 1. Architecture Overview

### Core Sync Components

| Component | File | Purpose |
|-----------|------|---------|
| `SyncQueue` | `lib/src/core/sync/sync_queue.dart` | FIFO queue with coalescing (create+delete cancels; update replaces) |
| `SyncEngine` | `lib/src/core/sync/sync_engine.dart` | Processes queue items with max 5 retries, batch size 50 |
| `SyncConfig` | `lib/src/core/sync/sync_config.dart` | Configuration: 15-min periodic interval, 5 retries, batch 50 |
| `ConnectionMonitor` | `lib/src/core/sync/connection_status.dart` | Tracks online/offline state via `connectivity_plus` |
| `CloudSyncCoordinator` | `lib/src/features/profile/application/cloud_sync_coordinator.dart` | Routes queue items to cloud repositories |
| `IsarSyncStorage` | `lib/src/features/shared/data/isar_sync_storage.dart` | Persists SyncQueue to Isar local DB |

### Sync Flow

1. Local repository saves data to Isar → enqueues `SyncQueueItem` to `SyncQueue`
2. `CloudSyncCoordinator.syncAll()` → loads queue from `IsarSyncStorage`
3. `SyncEngine.processAsync()` → dequeues items, calls `_pushItem()` for each
4. `_pushItem()` routes by `entityType` string to entity-specific push method
5. Success → item removed; Failure (≤5 retries) → re-enqueued as `failed`; >5 retries → dropped

---

## 2. Entity Types: Supported vs. Actual

### Entity Types in `CloudSyncCoordinator._pushItem()` (line 281)

```dart
switch (item.entityType) {
  case 'horse':              // ✓ handled
  case 'health':             // ⚠️ MISMATCH with actual usage
  case 'event':              // ✓ matches
  case 'market':             // ⚠️ MISMATCH with actual usage
  case 'breeding':           // ✓ but never enqueued
  case 'lost_horse_report':  // ✓ handled
  case 'search_area':        // ✓ handled
  case 'horse_location':     // ✓ handled
  case 'geofence_alert':     // ✓ handled
  default:                   // ⚠️ Silently returns Result.ok(true) — drops items
}
```

### Entity Types Actually Enqueued by Repositories

| Entity Type String | Enqueued By | Coordinator Handles? | Status |
|--------------------|-------------|---------------------|--------|
| `'event'` | `LocalEventRepository` | Yes (case 'event') | ✅ Matches |
| `'health_log'` | `LocalHealthRepository` (health/) | **NO** (case is 'health') | ❌ **MISMATCH** |
| `'market_listing'` | `LocalMarketRepositoryV2` | **NO** (case is 'market') | ❌ **MISMATCH** |
| `'lost_horse_report'` | `CloudSyncCoordinator.queueLostHorseReport()` | Yes | ✅ Match |
| `'search_area'` | `CloudSyncCoordinator.queueSearchArea()` | Yes | ✅ Match |
| `'horse_location'` | `CloudSyncCoordinator.queueHorseLocation()` | Yes | ✅ Match |
| `'geofence_alert'` | `CloudSyncCoordinator.queueGeofenceAlert()` | Yes | ✅ Match |

### Critical Bug: Entity Type Mismatches

1. **`health_log` vs `health`**: `LocalHealthRepository` enqueues `entityType: 'health_log'`, but coordinator checks for `'health'`. All health sync items silently pass through the `default` branch and are marked as success without being pushed to Supabase. **Result: Health data never syncs via queue.**

2. **`market_listing` vs `market`**: `LocalMarketRepositoryV2` enqueues `entityType: 'market_listing'`, but coordinator checks for `'market'`. All market sync items silently pass through the `default` branch and are marked as success without being pushed to Supabase. **Result: Market listings never sync via queue.**

---

## 3. Feature-by-Feature Sync Status

### Features Using SyncQueue Properly

| Feature | Repository | Enqueues? | Entity Type | Pushes to Supabase? | Status |
|---------|-----------|-----------|-------------|-------------------|--------|
| **Events** | `LocalEventRepository` | ✅ Yes | `'event'` | ✅ Yes (via _pushEvent) | ✅ **Supported** |
| **Map - Lost Horse Reports** | `CloudSyncCoordinator` | ✅ Yes | `'lost_horse_report'` | ✅ Yes (via _pushLostHorseReport) | ✅ **Supported** |
| **Map - Search Areas** | `CloudSyncCoordinator` | ✅ Yes | `'search_area'` | ✅ Yes (via _pushSearchArea) | ✅ **Supported** |
| **Map - Horse Locations** | `CloudSyncCoordinator` | ✅ Yes | `'horse_location'` | ✅ Yes (via _pushHorseLocation) | ✅ **Supported** |
| **Map - Geofence Alerts** | `CloudSyncCoordinator` | ✅ Yes | `'geofence_alert'` | ✅ Yes (via _pushGeofenceAlert) | ✅ **Supported** |

### Features With SyncQueue Enabled But Entity Type Mismatch

| Feature | Repository | Enqueues? | Entity Type | Coordinator Expects | Status |
|---------|-----------|-----------|-------------|-------------------|--------|
| **Health Logs** | `LocalHealthRepository` | ✅ Yes | `'health_log'` | `'health'` | ⚠️ **Partially Supported — BROKEN** |
| **Market Listings** | `LocalMarketRepositoryV2` | ✅ Yes | `'market_listing'` | `'market'` | ⚠️ **Partially Supported — BROKEN** |

### Features That Sync Directly (Bypassing Queue)

| Feature | Repository | Sync Method | Enqueues? | Status |
|---------|-----------|-------------|-----------|--------|
| **Horses** | `LocalHorsesRepository` | Direct `syncHorses()` → Supabase upsert | ❌ No | ⚠️ **Partially Supported** |
| **Events (legacy)** | `LocalEventsRepository` | Direct `syncEvents()` → Supabase upsert | ❌ No (legacy path) | ⚠️ **Partially Supported** |
| **Profile Settings** | `LocalProfileSettingsRepository` | Direct `syncSettings()` → Supabase upsert | ❌ No | ⚠️ **Partially Supported** |

### Features With NO Cloud Sync At All

| Feature | Repository | Enqueues? | Cloud Sync? | Status |
|---------|-----------|-----------|-------------|--------|
| **Breeding** | `LocalBreedingRepository` | ❌ No | ❌ No — No SupabaseRepository in providers | ❌ **Not Supported** |
| **Co-ownership** | `LocalCoOwnershipRepository` | ❌ No | Local-only (SupabaseCoOwnershipRepository exists but never used in providers) | ❌ **Not Supported** |
| **Documents** | `LocalDocumentRepository` | ❌ No (has `pendingSync` flag but unused) | `SupabaseDocumentRepository` exists but not wired | ❌ **Not Supported** |
| **Certificates** | `SupabaseCertificateRepository` | ❌ No (cloud-only) | Directly to Supabase, no offline queue | ❌ **Not Supported** |
| **Lineage** | `LocalLineageRepository` | ❌ No (static seed data) | N/A — read-only seed data | ➖ **Not Applicable** |
| **Payments** | `SupabasePaymentRepository` | ❌ No | Directly to Supabase, no offline | ❌ **Not Supported** |
| **Race Videos** | `RaceVideosRepository` | ❌ No | Not investigated (likely no sync) | ❌ **Not Supported** |
| **Push Notifications** | N/A | ❌ No | Local-only scheduling | ➖ **Not Applicable** |
| **Health (legacy)** | `LocalHealthRepository` (horses/) | ❌ No (old version, no SyncQueue) | ❌ No | ❌ **Not Supported** |
| **Auth** | `SupabaseAuthRepository` | ❌ No | Direct to Supabase | ➖ **Not Applicable** |

---

## 4. Error Handling Gaps

### Current Error Handling

| Mechanism | Detail |
|-----------|--------|
| Retry count | Max 5 retries (`SyncEngine.maxRetries`) |
| Batch processing | Max 50 items per sync cycle (`SyncEngine.processAsync` batchSize) |
| Failure handling | Re-enqueue with `retryCount+1`, status = `failed` |
| Drop after max retries | Silently dropped — no alert, no dead letter queue |
| Per-item try-catch | `_pushItem()` wraps each entity call in try-catch |
| Connection awareness | `ConnectionMonitor` checks connectivity; offline skips sync |

### Gaps

1. **No exponential backoff**: Retries happen immediately on next `syncAll()` cycle (every 15 min or on-demand). No progressive delay between retries.

2. **No dead letter queue**: Items exceeding `maxRetries` (5) are silently discarded. There's no way for users or admins to see failed items.

3. **No persistent failure log**: Failed items are not stored anywhere after being dropped from the queue.

4. **No push failure coercion**: The `default` case in `_pushItem()` silently returns `Result.ok(true)`, meaning unknown entity types or entity type mismatches are marked as successful and removed from the queue. This hides bugs like the `health_log`/`market_listing` mismatches.

5. **Pull failures are non-fatal**: In `syncAll()`, event sync failure is caught and ignored (`// Non-fatal`). Horse sync failure causes early return. Inconsistent handling.

6. **No partial sync rollback**: If one item in a batch fails, already-pushed items are not rolled back.

7. **IsarSyncStorage re-writes entire queue on every `saveQueue()`**: For queues with many items, this is inefficient — it does `clear()` + `putAll()` instead of incremental updates.

8. **No conflict detection on pull**: `syncAll()` calls `horsesRepository.syncHorses()` which does `upsert` (last-write-wins at DB level). No comparison of local vs. remote timestamps before overwriting.

---

## 5. Conflict Resolution Gaps

### Current State

The `CloudSyncCoordinator` has comments about "last-write-wins" conflict resolution in `_pushHorse()`, `_pushEvent()`, and `_pushMarketListing()`. However:

1. **`_extractUpdatedAt()` is called but the result is never used for decision-making.** The code extracts the timestamp but then always pushes the local change regardless.

2. **No conflict detection before push**: The coordinator doesn't check if the remote data was modified after the local change was queued.

3. **No merge strategy**: For any entity type, there is no merge logic — local always overwrites remote (via `upsert`).

4. **No conflict notification**: Users are never notified about conflicts.

5. **`SyncEngine` has no locking**: If `syncAll()` runs concurrently (unlikely but possible with periodic + manual triggers), items could be double-processed.

6. **Delete deletes are not reliably handled**: Several `_pushXxx` methods for delete actions simply return `Result.ok(true)` without actually deleting from Supabase (e.g., `_pushHorse` delete, `_pushEvent` delete, `_pushBreedingRecord` delete).

---

## 6. Repository Layer Discrepancies

### Dual/Multiple Repository Implementations

| Feature | Old Repo | New Repo | Currently Used? |
|---------|---------|---------|----------------|
| Events | `LocalEventsRepository` (events/data/) | `LocalEventRepository` (events/data/) | `LocalEventRepository` uses SyncQueue, `LocalEventsRepository` syncs directly |
| Health | `LocalHealthRepository` (horses/data/) | `LocalHealthRepository` (health/data/) | `health/data/LocalHealthRepository` is used (has SyncQueue) |
| Market | `LocalMarketRepository` | `LocalMarketRepositoryV2` | V2 is used (has SyncQueue) |

### Interface/Binding Issues

- `CloudSyncCoordinator` has `HealthRepository healthRepository` field but uses it only for `syncAll()`, not for individual push items. The individual health push (`_pushHealthLog`) uses `healthRepository.saveHealthLog()` which goes to the SupabaseHealthRepository.
- `CloudSyncCoordinator` imports `HorsesRepository` (from horses/data/) which is the direct-sync version, not the one using SyncQueue.
- `CloudSyncCoordinator` imports `BreedingRepository` but `LocalBreedingRepository` never enqueues items, so breeding data is never pushed.

---

## 7. Suggested Approach to Fill All Gaps

### Phase 1: Fix Critical Bugs (Entity Type Mismatches)

1. **Fix `health_log` → `health` mismatch**: Either change `LocalHealthRepository` to use `entityType: 'health'` instead of `'health_log'`, or add `'health_log'` case to coordinator switch.

2. **Fix `market_listing` → `market` mismatch**: Either change `LocalMarketRepositoryV2` to use `entityType: 'market'` instead of `'market_listing'`, or add `'market_listing'` case to coordinator switch.

3. **Remove silent `default` case**: Replace the `default: return Result.ok(true)` with `Result.fail(AppException(...))` so unknown entity types are not silently dropped.

### Phase 2: Add Sync to Missing Features

4. **Breeding**: Inject `IsarSyncStorage` into `LocalBreedingRepository` and enqueue SyncQueueItems on `saveBreedingRecord()`. Add `'breeding_record'` case to coordinator. Currently coordinator already has `_pushBreedingRecord()`.

5. **Co-ownership**: Inject `IsarSyncStorage` into `LocalCoOwnershipRepository` and enqueue SyncQueueItems on `saveCoOwner()`/`deleteCoOwner()`. Add `'co_ownership'` case to coordinator with corresponding push method. Use existing `SupabaseCoOwnershipRepository` for cloud operations.

6. **Documents**: Wire `LocalDocumentRepository` to enqueue SyncQueueItems when `pendingSync` is true. Add `'document'` case to coordinator. Upload actual file bytes during sync via `SupabaseDocumentRepository`.

7. **Certificates**: Add offline support to `SupabaseCertificateRepository` — local caching + SyncQueue enqueue for create/transfer operations.

8. **Horses**: Convert `LocalHorsesRepository.saveHorse()` from direct sync to SyncQueue enqueue. Keep `syncHorses()` for pull but remove the push from `saveHorse()`.

### Phase 3: Error Handling Improvements

9. **Dead letter queue**: Store items that exceed `maxRetries` in a separate Isar collection. Expose via UI so users can see failed items and retry manually.

10. **Exponential backoff**: Implement progressive delay: retry 1 after ~1 min, retry 2 after ~5 min, retry 3 after ~15 min, retry 4 after ~1 hour, retry 5 after ~4 hours.

11. **Persistent error log**: Store sync errors with entity type, ID, error message, and timestamp for debugging.

12. **Consistent pull error handling**: Decide whether pull failures for individual entity types should be fatal or non-fatal — apply consistently.

### Phase 4: Conflict Resolution

13. **Implement actual last-write-wins**: Before pushing, fetch the remote entity's `updated_at`. If remote is newer than the local queued change, skip the push and notify the user (or pull the remote version).

14. **Add conflict detection UI**: Show a screen/list of conflicts where users can choose "keep local", "keep remote", or "merge".

15. **Add conflict metadata to SyncQueueItem**: Store `remoteUpdatedAt` and `localUpdatedAt` for comparison.

### Phase 5: General Improvements

16. **Incremental queue persistence**: Change `IsarSyncStorage.saveQueue()` to do incremental updates instead of full clear+rewrite.

17. **Add concurrent sync guard**: Use a mutex/lock in `CloudSyncCoordinator.syncAll()` to prevent concurrent execution.

18. **Consolidate dual repositories**: Remove old repository implementations that don't use SyncQueue (e.g., `LocalEventsRepository`, `LocalHealthRepository` in horses/data/, `LocalMarketRepository`).

19. **Standardize entity type strings**: Create an enum or constants class for entity type strings to prevent future mismatches.

20. **Add unit tests for sync**: Test SyncQueue coalescing, SyncEngine retry logic, and coordinator push routing with proper mocks.
