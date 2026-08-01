import 'dart:convert';

import 'package:isar/isar.dart';

import '../../../../core/sync/sync_queue.dart';

part 'isar_sync_queue_item.g.dart';

@collection
class IsarSyncQueueItem {
  IsarSyncQueueItem();

  Id id = Isar.autoIncrement;

  late String entityType;
  late String entityId;
  @enumerated
  late SyncAction action;
  late String dataJson;
  late DateTime timestamp;
  late int retryCount;
  @enumerated
  late SyncItemStatus status;
  DateTime? lastAttemptAt;

  /// Dead letter queue-д шилжүүлсэн огноо. [null] бол идэвхтэй queue-д байна.
  DateTime? movedAt;

  /// [true] бол dead letter queue-д байгаа item.
  @Name('isDeadLetter')
  bool isDeadLetter = false;

  /// Stable persisted identity; completion is addressed by this field.
  @Index(unique: true, replace: true)
  late String queueId;
  @Index()
  String? accountId;
  DateTime? nextAttemptAt;

  factory IsarSyncQueueItem.fromDomain(SyncQueueItem item) {
    return IsarSyncQueueItem()
      ..queueId = item.stableQueueId
      ..entityType = item.entityType
      ..entityId = item.entityId
      ..action = item.action
      ..dataJson = jsonEncode(item.data)
      ..timestamp = item.timestamp
      ..retryCount = item.retryCount
      ..status = item.status
      ..lastAttemptAt = item.lastAttemptAt
      ..movedAt = item.movedAt
      ..isDeadLetter = item.isDeadLetter
      ..accountId = item.accountId
      ..nextAttemptAt = item.nextAttemptAt;
  }

  SyncQueueItem toDomain() {
    return SyncQueueItem(
      entityType: entityType,
      entityId: entityId,
      action: action,
      data: Map<String, dynamic>.from(jsonDecode(dataJson) as Map),
      timestamp: timestamp,
      retryCount: retryCount,
      status: status,
      lastAttemptAt: lastAttemptAt,
      movedAt: movedAt,
      queueId: queueId,
      accountId: accountId,
      nextAttemptAt: nextAttemptAt,
    );
  }
}
