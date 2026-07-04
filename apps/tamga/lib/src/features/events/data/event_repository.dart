import '../../../core/error/result.dart';
import '../../../shared/domain/event.dart';

/// Result-д суурилсан EventRepository interface.
abstract class EventRepository {
  Future<Result<List<Event>>> fetchEvents();
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId);
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId);
  Future<Result<Event>> saveEvent(Event event);
  Future<Result<void>> deleteEvent(String id);
  Future<Result<List<Event>>> fetchFeaturedEvents();
}
