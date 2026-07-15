import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../domain/service_booking.dart';
import '../domain/service_booking_status.dart';
import 'isar_schemas/isar_service_booking.dart';
import 'services_repository.dart';

/// Isar дээр суурилсан локал захиалгын репозитори.
class LocalServiceBookingRepository
    extends LocalRepository<ServiceBooking, IsarServiceBooking>
    implements ServiceBookingRepository {
  LocalServiceBookingRepository({
    required super.storage,
    required super.syncQueue,
  });

  @override
  IsarCollection<IsarServiceBooking> get collection => storage.serviceBookings;

  @override
  String get entityType => 'service_booking';

  @override
  ServiceBooking toDomain(IsarServiceBooking entity) => entity.toDomain();

  @override
  IsarServiceBooking fromDomain(ServiceBooking entity) =>
      IsarServiceBooking.fromDomain(entity);

  @override
  String domainIdOf(ServiceBooking entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(ServiceBooking entity) => entity.toJson();

  // ── ServiceBookingRepository ──────────────────────────────────────

  @override
  Future<Result<List<ServiceBooking>>> fetchBookings(String userId) async {
    return Result.tryFuture(() async {
      final stored = await storage.serviceBookings
          .filter()
          .userIdEqualTo(userId)
          .sortByCreatedAtDesc()
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<ServiceBooking?>> fetchBookingById(String id) async {
    return findById(id);
  }

  @override
  Future<Result<ServiceBooking>> createBooking(ServiceBooking booking) async {
    return save(booking);
  }

  @override
  Future<Result<ServiceBooking>> updateBooking(ServiceBooking booking) async {
    return save(booking);
  }

  @override
  Future<Result<ServiceBooking>> cancelBooking(String bookingId) async {
    return Result.tryFuture(() async {
      final existing = await storage.serviceBookings
          .filter()
          .domainIdEqualTo(bookingId)
          .findFirst();

      if (existing == null) {
        throw AppException(
          message: 'Захиалга олдсонгүй',
          code: 'BOOKING_NOT_FOUND',
        );
      }

      if (existing.status == ServiceBookingStatus.cancelled) {
        throw AppException(
          message: 'Захиалга аль хэдийн цуцлагдсан',
          code: 'BOOKING_ALREADY_CANCELLED',
        );
      }

      final cancelled = existing.toDomain().cancel();
      final isarObj = IsarServiceBooking.fromDomain(cancelled);
      isarObj.id = existing.id;

      await storage.serviceBookings.isar.writeTxn(() async {
        await storage.serviceBookings.put(isarObj);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'service_booking',
          entityId: bookingId,
          action: SyncAction.update,
          data: cancelled.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return cancelled;
    });
  }

  @override
  Future<Result<void>> deleteBooking(String id) async {
    return delete(id);
  }
}
