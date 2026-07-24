import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/services/data/local_service_booking_repository.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_booking_status.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

void main() {
  group('LocalServiceBookingRepository', () {
    late IsarStorage storage;
    late SyncQueue syncQueue;
    late LocalServiceBookingRepository repository;

    Future<void> setupTestEnvironment() async {
      TestWidgetsFlutterBinding.ensureInitialized();

      final tempDir = Directory.systemTemp.createTempSync(
        'tamga_test_services_',
      );

      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
            const MethodChannel('plugins.flutter.io/path_provider'),
            (MethodCall methodCall) async {
              if (methodCall.method == 'getApplicationDocumentsDirectory') {
                return tempDir.path;
              }
              return null;
            },
          );

      await IsarDatabase.initialize();
      storage = IsarStorage.instance;
      syncQueue = SyncQueue();
      repository = LocalServiceBookingRepository(
        storage: storage,
        syncQueue: syncQueue,
      );
    }

    setUp(() async {
      await setupTestEnvironment();
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('fetchBookings returns empty list on first call', () async {
      final result = await repository.fetchBookings('user-1');

      expect(result.isSuccess, true);
      expect(result.value, isEmpty);
    });

    test('createBooking stores booking and returns it', () async {
      final now = DateTime(2026, 6, 21);
      final booking = ServiceBooking(
        id: 'booking-1',
        userId: 'user-1',
        providerId: 'provider-1',
        providerType: ServiceProviderType.photographer,
        serviceType: 'photo_session',
        horseIds: ['horse-1'],
        locationAimag: 'Архангай',
        bookingDate: DateTime(2026, 7, 1),
        status: ServiceBookingStatus.pending,
        totalAmount: 50000,
        notes: 'Test booking',
        createdAt: now,
        updatedAt: now,
      );

      final result = await repository.createBooking(booking);

      expect(result.isSuccess, true);
      expect(result.value.id, 'booking-1');
      expect(result.value.notes, 'Test booking');
      expect(result.value.totalAmount, 50000);
    });

    test('fetchBookings returns created booking', () async {
      final now = DateTime(2026, 6, 21);
      final booking = ServiceBooking(
        id: 'booking-2',
        userId: 'user-1',
        providerId: 'provider-1',
        providerType: ServiceProviderType.vet,
        serviceType: 'consultation',
        horseIds: ['horse-1'],
        bookingDate: DateTime(2026, 7, 5),
        status: ServiceBookingStatus.pending,
        createdAt: now,
        updatedAt: now,
      );

      await repository.createBooking(booking);
      final result = await repository.fetchBookings('user-1');

      expect(result.isSuccess, true);
      expect(result.value.length, 1);
      expect(result.value.first.id, 'booking-2');
    });

    test('fetchBookings filters by userId', () async {
      final now = DateTime(2026, 6, 21);
      await repository.createBooking(
        ServiceBooking(
          id: 'b-user1',
          userId: 'user-1',
          providerId: 'p-1',
          providerType: ServiceProviderType.photographer,
          serviceType: 'photo',
          horseIds: [],
          bookingDate: DateTime(2026, 7, 1),
          createdAt: now,
          updatedAt: now,
        ),
      );
      await repository.createBooking(
        ServiceBooking(
          id: 'b-user2',
          userId: 'user-2',
          providerId: 'p-2',
          providerType: ServiceProviderType.vet,
          serviceType: 'consult',
          horseIds: [],
          bookingDate: DateTime(2026, 7, 2),
          createdAt: now,
          updatedAt: now,
        ),
      );

      final user1Bookings = await repository.fetchBookings('user-1');
      final user2Bookings = await repository.fetchBookings('user-2');

      expect(user1Bookings.value.length, 1);
      expect(user1Bookings.value.first.id, 'b-user1');
      expect(user2Bookings.value.length, 1);
      expect(user2Bookings.value.first.id, 'b-user2');
    });

    test('cancelBooking cancels pending booking', () async {
      final now = DateTime(2026, 6, 21);
      await repository.createBooking(
        ServiceBooking(
          id: 'booking-cancel',
          userId: 'user-1',
          providerId: 'p-1',
          providerType: ServiceProviderType.photographer,
          serviceType: 'photo',
          horseIds: [],
          bookingDate: DateTime(2026, 7, 1),
          status: ServiceBookingStatus.pending,
          createdAt: now,
          updatedAt: now,
        ),
      );

      final result = await repository.cancelBooking('booking-cancel');

      expect(result.isSuccess, true);
      expect(result.value.status, ServiceBookingStatus.cancelled);

      // Verify persistence
      final fetchResult = await repository.fetchBookingById('booking-cancel');
      expect(fetchResult.isSuccess, true);
      expect(fetchResult.value?.status, ServiceBookingStatus.cancelled);
    });

    test('cancelBooking on non-existent booking returns error', () async {
      final result = await repository.cancelBooking('non-existent');

      expect(result.isFailure, true);
    });

    test('cancelBooking on already cancelled booking returns error', () async {
      final now = DateTime(2026, 6, 21);
      await repository.createBooking(
        ServiceBooking(
          id: 'booking-already-cancelled',
          userId: 'user-1',
          providerId: 'p-1',
          providerType: ServiceProviderType.photographer,
          serviceType: 'photo',
          horseIds: [],
          bookingDate: DateTime(2026, 7, 1),
          status: ServiceBookingStatus.cancelled,
          createdAt: now,
          updatedAt: now,
        ),
      );

      final result = await repository.cancelBooking(
        'booking-already-cancelled',
      );

      expect(result.isFailure, true);
    });

    test('save enqueues sync operation for create', () async {
      final now = DateTime(2026, 6, 21);
      final booking = ServiceBooking(
        id: 'booking-sync',
        userId: 'user-1',
        providerId: 'p-1',
        providerType: ServiceProviderType.photographer,
        serviceType: 'photo',
        horseIds: [],
        bookingDate: DateTime(2026, 7, 1),
        createdAt: now,
        updatedAt: now,
      );

      await repository.createBooking(booking);

      expect(syncQueue.pendingCount, greaterThan(0));

      final synced = syncQueue.toList();
      expect(
        synced.any(
          (item) =>
              item.entityType == 'service_booking' &&
              item.entityId == 'booking-sync' &&
              item.action.name == 'create',
        ),
        true,
      );
    });

    test('deleteBooking removes the booking', () async {
      final now = DateTime(2026, 6, 21);
      await repository.createBooking(
        ServiceBooking(
          id: 'booking-delete',
          userId: 'user-1',
          providerId: 'p-1',
          providerType: ServiceProviderType.photographer,
          serviceType: 'photo',
          horseIds: [],
          bookingDate: DateTime(2026, 7, 1),
          createdAt: now,
          updatedAt: now,
        ),
      );

      final deleteResult = await repository.deleteBooking('booking-delete');
      expect(deleteResult.isSuccess, true);

      final fetchResult = await repository.fetchBookingById('booking-delete');
      expect(fetchResult.value, isNull);
    });
  });
}
