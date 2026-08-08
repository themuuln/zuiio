import '../../../core/error/result.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/event_record.dart';

abstract interface class EventsRepository {
  Future<Result<List<EventRecord>>> fetchEvents();

  /// Хуудаслалттайгаар үйл явдлуудыг авах.
  Future<Result<PaginatedResult<EventRecord>>> fetchEventsPaginated({
    required int page,
    required int limit,
  });

  Future<Result<List<EventRecord>>> syncEvents();
  Future<Result<List<EventRecord>>> saveEvent(EventRecord event);
}
