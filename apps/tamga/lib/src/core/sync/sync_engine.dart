import '../error/result.dart';
import 'sync_queue.dart';

/// SyncQueue-ийн үйлдлүүдийг боловсруулах engine.
///
/// Дэд урсгал (background isolate) дээр ажиллах зориулалттай.
/// Нэг processAsync() дуудалтад item бүр **нэг удаа** боловсруулагдана.
class SyncEngine {
  SyncEngine._();

  /// Дахин оролдох хамгийн их тоо.
  /// Хэт олон удаа алдсан item-ийг queue-с хасч, dead letter queue-д шилжүүлнэ.
  static const int maxRetries = 5;

  /// Экспоненциал backoff-ийн суурь саатлын хугацаа (2 секунд).
  static const Duration baseDelay = Duration(seconds: 2);

  /// Экспоненциал backoff-ийн дээд хязгаар (60 секунд).
  static const Duration maxBackoffDelay = Duration(seconds: 60);

  /// Өгөгдсөн [retryCount]-д харгалзах backoff саатлыг буцаана.
  ///
  /// Саатал нь: `baseDelay * 2^retryCount`, дээд тал нь [maxBackoffDelay].
  /// Жишээ нь: retryCount 0 → 2s, retryCount 1 → 4s, retryCount 2 → 8s ...
  static Duration backoffDelay(int retryCount) {
    if (retryCount < 0) return Duration.zero;
    final ms = baseDelay.inMilliseconds * (1 << retryCount);
    return Duration(milliseconds: ms.clamp(0, maxBackoffDelay.inMilliseconds));
  }

  /// Queue-с item-үүдийг аваад [onProcessItem] руу дамжуулна.
  ///
  /// Амжилттай болсон item-үүдийг synced төлөвт оруулж, queue-с устгана.
  /// Алдаа гарсан бол retryCount-ийг нэмэгдүүлж, failed төлөвт тавиад
  /// дахин enqueue хийнэ. Дахин оролдох бүрд [backoffDelay]-ийн дагуу
  /// саатлыг шалгаж, хангалттай хугацаа өнгөрөөгүй бол retryCount-ийг
  /// нэмэгдүүлэхгүйгээр дараа дараагийн batch-д шилжүүлнэ.
  ///
  /// [maxRetries]-д хүрсэн item-үүд [onDeadLetter] callback-оор
  /// дамжуулан dead letter queue-д шилжинэ.
  ///
  /// [batchSize]-аас дээш item-ийг нэг удаа боловсруулахгүй.
  /// Item бүр нэг processAsync() дуудалтад зөвхөн нэг удаа оролдоно.
  static Future<int> processAsync({
    required SyncQueue queue,
    required Future<Result<bool>> Function(SyncQueueItem) onProcessItem,
    void Function(SyncQueueItem)? onDeadLetter,
    int batchSize = 50,
  }) async {
    // Snapshot — зөвхөн одоо байгаа item-үүдийг боловсруулна
    final snapshot = <SyncQueueItem>[];
    for (int i = 0; i < batchSize; i++) {
      final item = queue.dequeue();
      if (item == null) break;
      snapshot.add(item);
    }

    int pushedCount = 0;
    for (final item in snapshot) {
      // ── Экспоненциал backoff шалгалт ──────────────────────────────
      if (item.lastAttemptAt != null) {
        final elapsed = DateTime.now().difference(item.lastAttemptAt!);
        if (elapsed < backoffDelay(item.retryCount)) {
          // Backoff саатал хараахан дуусаагүй — retryCount нэмэхгүйгээр
          // дараагийн batch-д дахин оролдохоор буцаан enqueue хийнэ
          queue.enqueue(item);
          continue;
        }
      }

      final now = DateTime.now();
      final result = await onProcessItem(item);

      if (result.isSuccess) {
        pushedCount++;
        // Амжилттай — queue-с аль хэдийн устгагдсан
      } else if (item.retryCount < maxRetries) {
        // Дахин оролдох эрхтэй — failed төлөвт шилжүүлж enqueue хийх
        queue.enqueue(
          item.copyWith(
            retryCount: item.retryCount + 1,
            status: SyncItemStatus.failed,
            lastAttemptAt: now,
          ),
        );
      } else {
        // maxRetries-д хүрсэн — dead letter queue-д шилжүүлнэ
        if (onDeadLetter != null) {
          onDeadLetter(item.copyWith(movedAt: now));
        }
      }
    }
    return pushedCount;
  }
}
