import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_event_record.dart';
import '../../shared/data/local_sync_preferences.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/event_record.dart';
import 'events_repository.dart';

class LocalEventsRepository implements EventsRepository {
  const LocalEventsRepository(this._storage);

  final IsarStorage _storage;

  static const _seed = [
    EventRecord(
      id: 'naadam-2024',
      title: 'Аймгийн наадам 2024',
      horseId: 'altan-shuurga',
      horseName: 'Алтан Шуурга',
      eventType: 'Стандарт уралдаан',
      dateLabel: '2024-07-15',
      placeLabel: '1-р байр',
      awardLabel: 'Алтан медаль',
      notes: 'Lineage дээр хамгийн их дурдагддаг үр төлөөс ирсэн ялалт.',
      isUpcoming: false,
    ),
    EventRecord(
      id: 'spring-cup-2025',
      title: 'Хаврын цом 2025',
      horseId: 'uulen-bor',
      horseName: 'Үүлэн Бор',
      eventType: 'Custom event',
      dateLabel: '2025-04-21',
      placeLabel: '2-р байр',
      awardLabel: 'Мөнгөн шагнал',
      notes: 'Гүүний шугамын performance-ийг events feed дээр харуулна.',
      isUpcoming: false,
    ),
    EventRecord(
      id: 'autumn-preview-2026',
      title: 'Намрын сорил 2026',
      horseId: 'shandas-gal',
      horseName: 'Шандас Гал',
      eventType: 'Preview',
      dateLabel: '2026-09-10',
      placeLabel: 'Хүлээгдэж байна',
      awardLabel: 'Pending',
      notes: 'Thin implementation-д upcoming feed хэрхэн харагдахыг үзүүлнэ.',
      isUpcoming: true,
    ),
  ];

  @override
  Future<Result<List<EventRecord>>> fetchEvents() async {
    try {
      final local = await _readLocal();
      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(local);
      }

      return syncEvents();
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_EVENTS_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<PaginatedResult<EventRecord>>> fetchEventsPaginated({
    required int page,
    required int limit,
  }) async {
    try {
      final all = await _readLocal();
      final start = page * limit;
      if (start >= all.length) {
        return const Result.ok(PaginatedResult(items: [], totalCount: 0));
      }
      final end = (start + limit).clamp(0, all.length);
      return Result.ok(
        PaginatedResult(items: all.sublist(start, end), totalCount: all.length),
      );
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_EVENTS_PAGINATED_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<EventRecord>>> syncEvents() async {
    try {
      final local = await _readLocal();
      final client = getConfiguredSupabaseClient();
      final userId = await ensureSupabaseUserId();
      if (client == null || userId == null) {
        return Result.ok(local);
      }

      await client
          .from('events')
          .upsert(
            local.map((item) => item.toSupabaseJson(ownerId: userId)).toList(),
          );
      final response = await client.from('events').select().order('date_label');
      final remote = (response as List<dynamic>)
          .map(
            (item) =>
                EventRecord.fromSupabaseJson(item as Map<String, dynamic>),
          )
          .toList();

      // Replace local collection with remote data
      await _storage.eventRecords.isar.writeTxn(() async {
        await _storage.eventRecords.clear();
        await _storage.eventRecords.putAll(
          remote.map(IsarEventRecord.fromDomain).toList(),
        );
      });

      return Result.ok(remote);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SYNC_EVENTS_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<EventRecord>>> saveEvent(EventRecord event) async {
    try {
      final local = await _readLocal();
      final index = local.indexWhere((item) => item.id == event.id);
      final next = [...local];
      if (index >= 0) {
        next[index] = event;
      } else {
        next.add(event);
      }

      // Replace local collection
      await _storage.eventRecords.isar.writeTxn(() async {
        await _storage.eventRecords.clear();
        await _storage.eventRecords.putAll(
          next.map(IsarEventRecord.fromDomain).toList(),
        );
      });

      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(next);
      }

      return syncEvents();
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SAVE_EVENT_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  Future<List<EventRecord>> _readLocal() async {
    final stored = await _storage.eventRecords.where().findAll();
    if (stored.isEmpty) {
      // Seed on first read
      await _storage.eventRecords.isar.writeTxn(() async {
        await _storage.eventRecords.putAll(
          _seed.map(IsarEventRecord.fromDomain).toList(),
        );
      });
      return _seed;
    }
    return stored.map((e) => e.toDomain()).toList();
  }
}
