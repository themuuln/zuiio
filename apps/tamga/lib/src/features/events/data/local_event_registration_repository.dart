import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../shared/domain/event_registration.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_event_registration.dart';
import 'event_registration_repository.dart';

/// Isar болон SyncQueue-д суурилсан EventRegistrationRepository хэрэгжилт.
///
/// Бүх бүртгэлийн үйлдлийг локал Isar-д хадгаж,
/// SyncQueue-д нэмж, дараа нь Supabase руу синк хийнэ.
class LocalEventRegistrationRepository implements EventRegistrationRepository {
  LocalEventRegistrationRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  @override
  Future<Result<List<EventRegistration>>> fetchRegistrations(
    String eventId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await _storage.eventRegistrations
          .filter()
          .eventIdEqualTo(eventId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<EventRegistration>>> fetchRegistrationsByHorse(
    String horseId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await _storage.eventRegistrations
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<EventRegistration>> registerHorse({
    required String eventId,
    required String horseId,
    required String ownerId,
  }) async {
    return Result.tryFuture(() async {
      // Duplicate check
      final existing = await _storage.eventRegistrations
          .filter()
          .eventIdEqualTo(eventId)
          .and()
          .horseIdEqualTo(horseId)
          .and()
          .statusEqualTo(RegistrationStatus.registered)
          .findFirst();

      if (existing != null) {
        throw AppException(
          message: 'Энэ морь аль хэдийн бүртгүүлсэн байна',
          code: 'DUPLICATE_REGISTRATION',
        );
      }

      final id = const Uuid().v4();
      final now = DateTime.now();

      final registration = EventRegistration(
        id: id,
        eventId: eventId,
        horseId: horseId,
        ownerId: ownerId,
        registeredAt: now,
        status: RegistrationStatus.registered,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final isarReg = IsarEventRegistration.fromDomain(registration);
      await _storage.eventRegistrations.isar.writeTxn(() async {
        await _storage.eventRegistrations.put(isarReg);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'event_registration',
          entityId: id,
          action: SyncAction.create,
          data: registration.toJson(),
          timestamp: now,
        ),
      );

      return registration;
    });
  }

  @override
  Future<Result<EventRegistration>> cancelRegistration(String id) async {
    return Result.tryFuture(() async {
      final existing = await _storage.eventRegistrations
          .filter()
          .domainIdEqualTo(id)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Бүртгэл олдсонгүй',
          code: 'REGISTRATION_NOT_FOUND',
        );
      }

      final updated = existing.toDomain().copyWith(
        status: RegistrationStatus.cancelled,
      );

      final isarReg = IsarEventRegistration.fromDomain(updated);
      isarReg.id = existing.id;

      await _storage.eventRegistrations.isar.writeTxn(() async {
        await _storage.eventRegistrations.put(isarReg);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'event_registration',
          entityId: id,
          action: SyncAction.update,
          data: updated.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return updated;
    });
  }
}
