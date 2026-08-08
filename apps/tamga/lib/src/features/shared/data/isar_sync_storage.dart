import 'package:isar/isar.dart';

import '../../../core/sync/sync_queue.dart';
import 'isar_storage.dart';
import 'isar_schemas/isar_sync_queue_item.dart';

/// SyncQueue-ийг Isar-д persistent хадгалах давхарга.
///
/// Dead letter queue-г мөн хадгална — [IsarSyncQueueItem.isDeadLetter] туг ашиглан
/// ердийн queue item-ээс ялгадаг.
class IsarSyncStorage {
  IsarSyncStorage(this._storage);
  final IsarStorage _storage;

  /// Isar-аас queue-ийг сэргээх (зөвхөн идэвхтэй item-үүд).
  Future<SyncQueue> loadQueue() async {
    final items = await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(false)
        .findAll();
    final queue = SyncQueue();
    for (final item in items) {
      queue.enqueue(item.toDomain());
    }
    return queue;
  }

  /// Бүх queue-ийг Isar-д хадгалах (бүхэлд нь орлуулах).
  Future<void> saveQueue(SyncQueue queue) async {
    // Зөвхөн идэвхтэй (dead letter биш) item-үүдийг устгаад дахин хадгална
    await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(false)
        .deleteAll();
    final isarItems = queue.toList().map(IsarSyncQueueItem.fromDomain).toList();
    await _storage.syncQueueItems.putAll(isarItems);
  }

  /// Нэг item нэмээд хадгалах.
  Future<void> enqueue(SyncQueueItem item) async {
    final queue = await loadQueue();
    queue.enqueue(item);
    await saveQueue(queue);
  }

  /// Queue-ийг хоослох.
  Future<void> clear() async {
    await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(false)
        .deleteAll();
  }

  // ── Dead letter queue ───────────────────────────────────────────

  /// Isar-аас dead letter queue-ийг сэргээх.
  Future<List<SyncQueueItem>> loadDeadLetterQueue() async {
    final items = await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(true)
        .findAll();
    return items.map((i) => i.toDomain()).toList();
  }

  /// [item]-ийг dead letter queue-д нэмэх.
  Future<void> addToDeadLetter(SyncQueueItem item) async {
    final isarItem = IsarSyncQueueItem.fromDomain(
      item.copyWith(
        movedAt: item.movedAt ?? DateTime.now(),
        status: SyncItemStatus.failed,
      ),
    )..isDeadLetter = true;
    await _storage.syncQueueItems.put(isarItem);
  }

  /// Dead letter queue-г хоослох.
  Future<void> clearDeadLetter() async {
    await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(true)
        .deleteAll();
  }
}
