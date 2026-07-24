import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/result.dart';
import '../../../shared/domain/event.dart';
import '../../shared/data/isar_schemas/isar_event.dart';
import 'event_repository.dart';

class LocalEventRepository
    extends LocalRepository<Event, IsarEvent>
    implements EventRepository {
  LocalEventRepository({
    required super.storage,
    required super.syncQueue,
  });

  @override
  IsarCollection<IsarEvent> get collection => storage.events;

  @override
  String get entityType => 'event';

  @override
  Event toDomain(IsarEvent entity) => entity.toDomain();

  @override
  IsarEvent fromDomain(Event entity) => IsarEvent.fromDomain(entity);

  @override
  String domainIdOf(Event entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(Event entity) => entity.toJson();

  @override
  Future<Result<List<Event>>> fetchEvents() => findAll();

  @override
  Future<Result<List<Event>>> fetchEventsByHorse(String horseId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<List<Event>>> fetchEventsByOwner(String ownerId) async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .ownerIdEqualTo(ownerId)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<List<Event>>> fetchFeaturedEvents() async {
    return Result.tryFuture(() async {
      final stored = await collection
          .filter()
          .isFeaturedEqualTo(true)
          .findAll();
      return stored.map(toDomain).toList();
    });
  }

  @override
  Future<Result<Event>> saveEvent(Event event) => save(event);

  @override
  Future<Result<void>> deleteEvent(String id) => delete(id);
}
