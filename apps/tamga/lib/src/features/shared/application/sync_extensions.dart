import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../data/isar_sync_storage.dart';
import 'sync_providers.dart';

// ── Pending sync items ──────────────────────────────────────────

/// Sync queue-д байгаа pending item-үүдийг Isar-аас шууд ачаална.
///
/// CloudSyncCoordinator-ын төлөвөөс хамааралгүйгээр шууд өгөгдлийн сангаас
/// уншина. SyncQueueScreen дээр pending жагсаалтыг харуулахад ашиглана.
final pendingSyncItemsProvider = FutureProvider<List<SyncQueueItem>>((
  ref,
) async {
  final storage = ref.watch(isarSyncStorageProvider);
  final queue = await storage.loadQueue();
  return queue.toList();
});

// ── Dead letter items from storage ──────────────────────────────

/// Dead letter queue-д байгаа item-үүдийг Isar-аас шууд ачаална.
///
/// Энэ provider нь [deadLetterQueueProvider]-оос ялгаатай нь
/// CloudSyncCoordinator-ын in-memory төлөвөөс хамаарахгүйгээр
/// хадгалагдсан өгөгдлийг шууд уншина. Dead letter item-ийг
/// retry/clear хийх үед шинэчлэлтийг зөв тусгахад ашиглана.
final persistentDeadLetterItemsProvider = FutureProvider<List<SyncQueueItem>>((
  ref,
) async {
  final storage = ref.watch(isarSyncStorageProvider);
  return storage.loadDeadLetterQueue();
});

// ── Sync helpers ─────────────────────────────────────────────────

/// Dead letter queue-с нэг item-ийг retry хийх (pending queue-д буцаан нэмэх).
///
/// 1. Item-ийн retryCount-ийг 0 болгож, status-ийг pending болгоно
/// 2. Dead letter storage-аас устгана (Isar-аас шууд)
/// 3. Pending queue-д нэмнэ
Future<void> retryDeadLetterItem(
  IsarSyncStorage storage,
  SyncQueueItem item,
) async {
  // RetryCount-ийг 0 болгож, pending queue-д буцаан нэмэх
  final retryItem = SyncQueueItem(
    entityType: item.entityType,
    entityId: item.entityId,
    action: item.action,
    data: item.data,
    timestamp: item.timestamp,
    retryCount: 0,
    status: SyncItemStatus.pending,
  );

  // Dead letter queue-с устгах
  await _removeFromDeadLetterStorage(storage, item);

  // Pending queue-д нэмэх
  await storage.enqueue(retryItem);
}

/// Dead letter queue-г бүрэн хоослох.
Future<void> clearDeadLetterQueue(IsarSyncStorage storage) async {
  await storage.clearDeadLetter();
}

/// Dead letter storage-аас нэг item-ийг устгах (load → filter → clear → re-add).
Future<void> _removeFromDeadLetterStorage(
  IsarSyncStorage storage,
  SyncQueueItem itemToRemove,
) async {
  final deadLetterItems = await storage.loadDeadLetterQueue();
  deadLetterItems.removeWhere((item) => item.entityId == itemToRemove.entityId);
  await storage.clearDeadLetter();
  for (final item in deadLetterItems) {
    await storage.addToDeadLetter(item);
  }
}
