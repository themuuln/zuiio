/// Sync queue-д хадгалагдах үйлдлийн төрөл.
enum SyncAction { create, update, delete }

/// Queue item-ийн sync төлөв.
enum SyncItemStatus { pending, synced, failed }

/// CopyWith-д nullable талбарыг ялгах sentinel утга.
const _sentinel = Object();

/// Sync queue-ийн нэгж бичлэг.
///
/// Оффлайн үед хэрэглэгчийн хийсэн өөрчлөлтийг хадгалан,
/// сүлжээнд холбогдсон үед Supabase руу илгээнэ.
class SyncQueueItem {
  const SyncQueueItem({
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.data,
    required this.timestamp,
    this.retryCount = 0,
    this.status = SyncItemStatus.pending,
    this.lastAttemptAt,
    this.movedAt,
  });

  final String entityType; // 'horse', 'health', 'event' ...
  final String entityId;
  final SyncAction action;
  final Map<String, dynamic> data;
  final DateTime timestamp;
  final int retryCount;
  final SyncItemStatus status;
  final DateTime? lastAttemptAt;

  /// Dead letter queue-д шилжүүлсэн огноо. [null] бол идэвхтэй queue-д байна.
  final DateTime? movedAt;

  bool get isDeadLetter => movedAt != null;

  SyncQueueItem copyWith({
    int? retryCount,
    SyncItemStatus? status,
    Object? lastAttemptAt = _sentinel,
    Object? movedAt = _sentinel,
  }) {
    return SyncQueueItem(
      entityType: entityType,
      entityId: entityId,
      action: action,
      data: data,
      timestamp: timestamp,
      retryCount: retryCount ?? this.retryCount,
      status: status ?? this.status,
      lastAttemptAt: lastAttemptAt == _sentinel
          ? this.lastAttemptAt
          : lastAttemptAt as DateTime?,
      movedAt: movedAt == _sentinel ? this.movedAt : movedAt as DateTime?,
    );
  }

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      entityType: json['entityType'] as String,
      entityId: json['entityId'] as String,
      action: SyncAction.values.byName(json['action'] as String),
      data: Map<String, dynamic>.from(json['data'] as Map),
      timestamp: DateTime.parse(json['timestamp'] as String),
      retryCount: json['retryCount'] as int? ?? 0,
      status: SyncItemStatus.values.byName(
        json['status'] as String? ?? 'pending',
      ),
      lastAttemptAt: json['lastAttemptAt'] != null
          ? DateTime.parse(json['lastAttemptAt'] as String)
          : null,
      movedAt: json['movedAt'] != null
          ? DateTime.parse(json['movedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'entityType': entityType,
      'entityId': entityId,
      'action': action.name,
      'data': data,
      'timestamp': timestamp.toIso8601String(),
      'retryCount': retryCount,
      'status': status.name,
      'lastAttemptAt': lastAttemptAt?.toIso8601String(),
      'movedAt': movedAt?.toIso8601String(),
    };
  }
}

/// FIFO sync queue — offline үед хуримтлагдсан өөрчлөлтүүдийг хадгална.
///
/// Coalescing дэмждэг: нэг entity-д хэд хэдэн өөрчлөлт орвол
/// сүүлийнх нь үлдэж, create + delete бол хүчингүй болно.
///
/// Мөн dead letter queue-г агуулна — maxRetries-д хүрсэн item-үүдийг
/// хаяхын оронд энд хадгалж, дараа нь шалгах боломжтой.
class SyncQueue {
  final List<SyncQueueItem> _items = [];
  final List<SyncQueueItem> _deadLetterItems = [];

  /// Хоосон queue үүсгэх.
  SyncQueue();

  /// Хадгалагдсан json-оос сэргээх.
  factory SyncQueue.fromJson(Map<String, dynamic> json) {
    final queue = SyncQueue();
    final items =
        (json['items'] as List<dynamic>?)
            ?.map((e) => SyncQueueItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    queue._items.addAll(items);
    final deadLetter =
        (json['deadLetterItems'] as List<dynamic>?)
            ?.map((e) => SyncQueueItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    queue._deadLetterItems.addAll(deadLetter);
    return queue;
  }

  int get pendingCount => _items.length;

  /// Dead letter queue-д байгаа item-үүдийн тоо.
  int get deadLetterCount => _deadLetterItems.length;

  /// Хамгийн эртний item-ийг харах (устгахгүй).
  SyncQueueItem? peek() => _items.isEmpty ? null : _items.first;

  /// Хамгийн эртний item-ийг гаргаж авах.
  SyncQueueItem? dequeue() => _items.isEmpty ? null : _items.removeAt(0);

  /// Тухайн entity-ийн бүх pending item-ийг устгах.
  void removeById(String entityId) {
    _items.removeWhere((item) => item.entityId == entityId);
  }

  /// Бүх queue-г хоослох.
  void clear() => _items.clear();

  /// Шинэ item нэмэх. Coalescing хийж болзошгүй:
  /// - Нэг entity-д create/update байвал сүүлийн update-г хадгална
  /// - Create + delete бол хоёуланг нь устгана
  void enqueue(SyncQueueItem item) {
    // Delete after create → cancel both
    if (item.action == SyncAction.delete) {
      final existing = _items
          .where((i) => i.entityId == item.entityId)
          .toList();
      if (existing.any((i) => i.action == SyncAction.create)) {
        _items.removeWhere((i) => i.entityId == item.entityId);
        return;
      }
    }

    // Update after create/update → replace last
    if (item.action == SyncAction.update) {
      final lastIndex = _items.lastIndexWhere(
        (i) => i.entityId == item.entityId && i.action != SyncAction.delete,
      );
      if (lastIndex >= 0) {
        _items[lastIndex] = item;
        return;
      }
    }

    _items.add(item);
  }

  // ── Dead letter queue ───────────────────────────────────────────

  /// [item]-ийг dead letter queue-д шилжүүлэх.
  /// [movedAt] цагийг автоматаар тэмдэглэнэ.
  void addToDeadLetter(SyncQueueItem item) {
    _deadLetterItems.add(
      item.copyWith(movedAt: item.movedAt ?? DateTime.now()),
    );
  }

  /// Dead letter queue-ийн бүх item-ийг буцаах.
  List<SyncQueueItem> deadLetterList() => List.unmodifiable(_deadLetterItems);

  /// Dead letter queue-г хоослох.
  void clearDeadLetter() => _deadLetterItems.clear();

  // ── Serialization ────────────────────────────────────────────────

  /// Бүх item-ийг жагсаалтаар авах.
  List<SyncQueueItem> toList() => List.unmodifiable(_items);

  /// Serialization.
  Map<String, dynamic> toJson() => {
    'items': _items.map((e) => e.toJson()).toList(),
    'deadLetterItems': _deadLetterItems.map((e) => e.toJson()).toList(),
  };
}
