import 'package:isar/isar.dart';

import '../../../core/sync/sync_queue.dart';
import 'isar_storage.dart';
import 'isar_schemas/isar_sync_queue_item.dart';
import 'isar_schemas/isar_lost_horse_media_draft.dart';

/// SyncQueue-ийг Isar-д persistent хадгалах давхарга.
///
/// Dead letter queue-г мөн хадгална — [IsarSyncQueueItem.isDeadLetter] туг ашиглан
/// ердийн queue item-ээс ялгадаг.
class IsarSyncStorage {
  IsarSyncStorage(this._storage);
  final IsarStorage _storage;

  /// Isar-аас queue-ийг сэргээх (зөвхөн идэвхтэй item-үүд).
  Future<SyncQueue> loadQueue({String? accountId}) async {
    final items = await _storage.syncQueueItems
        .filter()
        .isDeadLetterEqualTo(false)
        .findAll();
    final queue = SyncQueue();
    for (final item in items) {
      if (accountId == null || item.accountId == accountId) {
        queue.enqueue(item.toDomain());
      }
    }
    return queue;
  }

  /// Upsert pending rows without deleting rows enqueued by another isolate.
  Future<void> saveQueue(SyncQueue queue, {String? accountId}) async {
    final rows = queue
        .toList()
        .where((item) => accountId == null || item.accountId == accountId)
        .map(IsarSyncQueueItem.fromDomain)
        .toList();
    if (rows.isEmpty) return;
    await _storage.syncQueueItems.isar.writeTxn(() async {
      await _storage.syncQueueItems.putAll(rows);
    });
  }

  /// Complete one stable queue row after the remote operation is acknowledged.
  Future<void> removeQueueItem(String queueId) async {
    await _storage.syncQueueItems.isar.writeTxn(() async {
      final row = await _storage.syncQueueItems
          .filter()
          .queueIdEqualTo(queueId)
          .findFirst();
      if (row != null) await _storage.syncQueueItems.delete(row.id);
    });
  }

  /// Add one row while preserving coalescing for the same entity.
  Future<void> enqueue(SyncQueueItem item) async {
    final isar = _storage.syncQueueItems.isar;
    await isar.writeTxn(() async {
      final existing = await _storage.syncQueueItems
          .filter()
          .isDeadLetterEqualTo(false)
          .findAll();
      final related = existing.where((row) => row.entityId == item.entityId);
      if (item.action == SyncAction.delete &&
          related.any((row) => row.action == SyncAction.create)) {
        for (final row in related) {
          await _storage.syncQueueItems.delete(row.id);
        }
        return;
      }
      if (item.action == SyncAction.update) {
        for (final row in related.where(
          (row) => row.action != SyncAction.delete,
        )) {
          await _storage.syncQueueItems.delete(row.id);
        }
      }
      await _storage.syncQueueItems.put(IsarSyncQueueItem.fromDomain(item));
    });
  }

  /// Loads staged recovery attachments for an idempotent remote upload.
  Future<List<IsarLostHorseMediaDraft>> loadRecoveryMediaDrafts(
    String reportId,
  ) {
    return _storage.lostHorseMediaDrafts
        .filter()
        .reportIdEqualTo(reportId)
        .sortBySortOrder()
        .findAll();
  }

  /// Marks staged recovery attachments acknowledged by the remote service.
  Future<void> markRecoveryMediaUploaded(
    String reportId, {
    List<String>? mediaIds,
  }) async {
    final drafts = await loadRecoveryMediaDrafts(reportId);
    final selected = mediaIds == null
        ? drafts
        : drafts.where((draft) => mediaIds.contains(draft.mediaId)).toList();
    if (selected.isEmpty) return;
    for (final draft in selected) {
      draft.uploaded = true;
      draft.remoteUrl = draft.storagePath;
    }
    await _storage.lostHorseMediaDrafts.isar.writeTxn(() async {
      await _storage.lostHorseMediaDrafts.putAll(selected);
    });
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
