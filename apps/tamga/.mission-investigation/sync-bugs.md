# Sync System Investigation Report

Date: 2026-06-16
Scope: Entity type mismatches between local repository enqueue calls and the CloudSyncCoordinator switch-case routing

---

## Investigation Summary

Read 13+ files across the sync system. Found **1 confirmed entity type mismatch** (market), **1 corrected finding** (health — not a mismatch), **3 bugs already fixed in the latest commit**, and **5+ additional gaps**.

---

## Issue 1: `health_log` vs `health` — NOT A BUG (report was inaccurate)

| Aspect | Detail |
|--------|--------|
| **LocalHealthRepository** | `lib/src/features/health/data/local_health_repository.dart`, lines 113, 139 — uses `entityType: 'health'` |
| **CloudSyncCoordinator switch** | `lib/src/features/profile/application/cloud_sync_coordinator.dart`, line ~277 — checks for `case 'health':` |
| **Verdict** | ✅ **Internally consistent**. Both use `'health'`. The original report appears to have confused the doc comment with the actual enqueue value. |
| **Doc comment** | `lib/src/core/sync/sync_queue.dart`, line ~17 — says `// 'horse', 'health_log', 'event' ...` but actual value is `'health'`. This comment is misleading. Fix by changing `'health_log'` to `'health'`. |

---

## Issue 2: `market_listing` vs `market` — CONFIRMED REAL BUG

### Enqueue calls in `LocalMarketRepositoryV2` (`lib/src/features/market/data/local_market_repository_v2.dart`)

| Method | Line(s) | `entityType` String | Handled by Coordinator? |
|--------|---------|---------------------|------------------------|
| `saveListing` | 115 | `'market'` | ✅ Yes |
| `deleteListing` | 145 | `'market'` | ✅ Yes |
| `_updateStatus` (markAsSold/renewListing) | 282 | `'market'` | ✅ Yes |
| **`toggleFavorite`** | **401** | **`'market_listing'`** | **❌ No — hits `default` case** |
| **`boostListing`** | **448** | **`'market_listing'`** | **❌ No — hits `default` case** |
| **`setVipLevel`** | **492** | **`'market_listing'`** | **❌ No — hits `default` case** |
| **`setSellerBadge`** | **537** | **`'market_listing'`** | **❌ No — hits `default` case** |

### Impact
4 enqueue sites use `'market_listing'` but the coordinator's switch only checks for `'market'`. These items fall through to the `default` case and are silently discarded as "synced" without any cloud operation occurring.

### Suggested fix
Change all 4 occurrences of `'market_listing'` to `'market'` in `local_market_repository_v2.dart` (lines 401, 448, 492, 537). OR add a `case 'market_listing':` to the coordinator switch that delegates to the same `_pushMarketListing` method.

---

## Issue 3: Silent `default` case in coordinator switch

**File**: `lib/src/features/profile/application/cloud_sync_coordinator.dart`  
**Lines**: ~303-305

```dart
default:
  // Тодорхойгүй entity төрөл — амжилттай гэж үзэж queue-с хасна
  return const Result.ok(true);
```

This silently discards items with unknown entity types. Any `'market_listing'` items (see Issue 2) or other future mismatches will be silently dropped.

### Suggested fix
Either:
- Replace with `return Result.fail(AppException(...))` to surface unknown types, or
- Log a warning and move to dead letter queue instead of silently discarding.

---

## Issue 4: Dead letter queue — ALREADY FIXED

The latest commit (0436aca `feat: add dead letter queue, exponential backoff, and concurrent sync guard`) implemented complete dead letter queue support:

- `SyncQueue.addToDeadLetter()` / `deadLetterList()` / `clearDeadLetter()`
- `IsarSyncStorage.addToDeadLetter()` / `loadDeadLetterQueue()` / `clearDeadLetter()`
- `SyncEngine.processAsync()` passes `onDeadLetter` callback
- Coordinator passes `onDeadLetter` to `syncStorage.addToDeadLetter(item)`

**Status**: ✅ No action needed.

---

## Issue 5: Exponential backoff — ALREADY FIXED

`SyncEngine.backoffDelay()` (line ~53):
```dart
static Duration backoffDelay(int retryCount) {
  final ms = baseDelay.inMilliseconds * (1 << retryCount);
  return Duration(milliseconds: ms.clamp(0, maxBackoffDelay.inMilliseconds));
}
```
- `baseDelay = Duration(seconds: 2)`
- `maxBackoffDelay = Duration(seconds: 60)`
- Checked in `processAsync()` before retrying

**Status**: ✅ No action needed.

---

## Issue 6: Delete operations that are no-ops

In `CloudSyncCoordinator._pushItem()`, these entity types return `Result.ok(true)` for delete actions without performing any actual cloud deletion:

| Entity Type | File:Line | Comment |
|-------------|-----------|---------|
| `'horse'` | coordinator, ~258 | `// Одоогоор амжилттай гэж тэмдэглэнэ (sync delete flow ирээдүйд)` |
| `'event'` | coordinator, ~285 | `// Events delete flow ирээдүйд — одоогоор skip` |
| `'breeding'` | coordinator, ~295 | `// Breeding delete flow ирээдүйд` |
| `'lost_horse_report'` | coordinator, ~310 | `// Delete not supported for lost horse reports yet` |
| `'horse_location'` | coordinator, ~330 | `// Delete not supported for horse locations` |
| `'geofence_alert'` | coordinator, ~341 | `// Delete not supported for geofence alerts` |
| `'certificate'` | coordinator, ~390 | `// Certificate deletion is not supported via sync — mark as ok` |
| `'payment'` | coordinator, ~410 | `// Payment deletion is not supported via sync — mark as ok` |

**Status**: Acceptable as intentional "not yet implemented" gaps, but the report flags them.

---

## Additional Bugs Discovered

### Bug A: `LocalHorsesRepository` doesn't enqueue sync items at all

**File**: `lib/src/features/horses/data/local_horses_repository.dart`

This repository **never enqueues `SyncQueueItem` objects**. Any offline changes to horse records will not appear in the sync queue. The `'horse'` case in the coordinator switch exists but will never receive items.

However, note that the coordinator's `syncAll()` also calls `horsesRepository.syncHorses()` directly (line ~185 of coordinator). This means the pull direction works, but the push direction for offline modifications is broken.

**Suggested fix**: Add sync queue enqueue calls to `LocalHorsesRepository.saveHorse()` (and possibly other mutation methods).

### Bug B: `incrementViewsCount` doesn't enqueue sync item

**File**: `lib/src/features/market/data/local_market_repository_v2.dart`, lines ~185-235

The `incrementViewsCount()` method modifies the listing in Isar but does not enqueue a `SyncQueueItem`. View count increments will be lost on other devices.

**Suggested fix**: Add sync queue enqueue call after the write transaction in `incrementViewsCount()`.

### Bug C: Two separate health repositories

- `lib/src/features/health/data/local_health_repository.dart` — sync-enabled, uses `'health'` entityType
- `lib/src/features/horses/data/local_health_repository.dart` — OLD implementation, uses `MedicalLog` domain model, NO sync

The old one at `horses/data/` may be dead code or still referenced. The coordinator only connects to `HealthRepository` (the abstract interface in `health/data/`), so the old horses-based one is likely unused.

**Suggested fix**: Verify if `horses/data/local_health_repository.dart` is referenced anywhere. If not, delete it to avoid confusion.

### Bug D: Misleading doc comment in `SyncQueueItem`

**File**: `lib/src/core/sync/sync_queue.dart`, line ~17
```dart
final String entityType; // 'horse', 'health_log', 'event' ...
```

Should be:
```dart
final String entityType; // 'horse', 'health', 'event', 'market', ...
```

---

## Complete Entity Type Inventory

| Entity Type String | Enqueued By | Handled By Coordinator? |
|-------------------|-------------|------------------------|
| `'horse'` | `LocalHorsesRepository` — NO (never enqueues) | `case 'horse':` — dead code |
| `'health'` | `LocalHealthRepository` (health feature) | `case 'health':` — ✅ works |
| `'event'` | `LocalEventRepository` | `case 'event':` — ✅ works |
| `'market'` | `LocalMarketRepositoryV2` (save, delete, status) | `case 'market':` — ✅ works |
| `'market_listing'` | `LocalMarketRepositoryV2` (toggleFavorite, boost, vip, badge) | ❌ hits `default` — **BUG** |
| `'breeding'` | `LocalBreedingRepository` | `case 'breeding':` — ✅ works |
| `'co_ownership'` | `LocalCoOwnershipRepository` | `case 'co_ownership':` — ✅ works |
| `'document'` | `LocalDocumentRepository` | `case 'document':` — ✅ works |
| `'certificate'` | Not enqueued by any local repo | `case 'certificate':` — dead code? |
| `'payment'` | Not enqueued by any local repo | `case 'payment':` — dead code? |
| `'lost_horse_report'` | Coordinator helper | `case 'lost_horse_report':` — ✅ works |
| `'search_area'` | Coordinator helper | `case 'search_area':` — ✅ works |
| `'horse_location'` | Coordinator helper | `case 'horse_location':` — ✅ works |
| `'geofence_alert'` | Coordinator helper | `case 'geofence_alert':` — ✅ works |

---

## Priority Fix Recommendations

1. **HIGH** — Fix `'market_listing'` → `'market'` in `local_market_repository_v2.dart` (4 occurrences: toggleFavorite, boostListing, setVipLevel, setSellerBadge)
2. **HIGH** — Add sync queue enqueue to `LocalHorsesRepository` so offline horse changes are synced
3. **MEDIUM** — Replace the `default: return Result.ok(true)` with a logged warning + dead letter queue move
4. **MEDIUM** — Fix misleading doc comment in `sync_queue.dart`
5. **LOW** — Add sync queue enqueue to `incrementViewsCount` in market repo
