import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/services/application/booking_providers.dart';
import 'package:tamga/src/features/services/application/services_providers.dart';
import 'package:tamga/src/features/services/data/services_repository.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_booking_status.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';

// ── Mock Repository ─────────────────────────────────────────────────

class MockServiceBookingRepository extends Mock
    implements ServiceBookingRepository {}

void main() {
  late MockServiceBookingRepository mockRepository;

  setUp(() {
    mockRepository = MockServiceBookingRepository();
  });

  group('booking_providers', () {
    final now = DateTime(2026, 6, 21);

    ServiceBooking createTestBooking({
      String id = 'booking-1',
      String userId = 'user-1',
      ServiceBookingStatus status = ServiceBookingStatus.pending,
    }) {
      return ServiceBooking(
        id: id,
        userId: userId,
        providerId: 'provider-1',
        providerType: ServiceProviderType.photographer,
        serviceType: 'photo_session',
        horseIds: ['horse-1'],
        locationAimag: 'Архангай',
        bookingDate: DateTime(2026, 7, 1),
        status: status,
        totalAmount: 50000,
        notes: 'Test booking',
        createdAt: now,
        updatedAt: now,
      );
    }

    // ════════════════════════════════════════════════════════════
    // VAL-SRV-BOOKING-005: Cancel booking changes status
    // ════════════════════════════════════════════════════════════
    test('cancelBookingProvider cancels a booking', () async {
      final booking = createTestBooking(id: 'booking-to-cancel');

      when(
        () => mockRepository.cancelBooking('booking-to-cancel'),
      ).thenAnswer((_) async => Result.ok(booking.cancel()));

      final container = ProviderContainer(
        overrides: [
          serviceBookingRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final result = await container.read(
        cancelBookingProvider('booking-to-cancel').future,
      );

      expect(result.status, ServiceBookingStatus.cancelled);
      expect(result.id, 'booking-to-cancel');
      expect(result.isActive, false);

      container.dispose();
    });

    test('cancelBookingProvider on already cancelled booking returns error',
        () async {
      when(
        () => mockRepository.cancelBooking('already-cancelled'),
      ).thenAnswer(
        (_) async => Result.fail(
          AppException(
            message: 'Захиалга аль хэдийн цуцлагдсан',
            code: 'BOOKING_ALREADY_CANCELLED',
          ),
        ),
      );

      final container = ProviderContainer(
        overrides: [
          serviceBookingRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      expect(
        () => container.read(
          cancelBookingProvider('already-cancelled').future,
        ),
        throwsA(isA<AppException>()),
      );

      container.dispose();
    });

    // ════════════════════════════════════════════════════════════
    // VAL-SRV-BOOKING-006: Booking list shows user's bookings
    // ════════════════════════════════════════════════════════════
    test('bookingsByUserProvider returns user bookings', () async {
      final bookings = [
        createTestBooking(id: 'b1', userId: 'user-1'),
        createTestBooking(id: 'b2', userId: 'user-1'),
      ];

      when(
        () => mockRepository.fetchBookings('user-1'),
      ).thenAnswer((_) async => Result.ok(bookings));

      final container = ProviderContainer(
        overrides: [
          serviceBookingRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final result = await container.read(
        bookingsByUserProvider('user-1').future,
      );

      expect(result.length, 2);
      expect(result[0].id, 'b1');
      expect(result[1].id, 'b2');

      container.dispose();
    });

    test('bookingsByUserProvider filters by userId', () async {
      when(
        () => mockRepository.fetchBookings('user-1'),
      ).thenAnswer((_) async => Result.ok([
        createTestBooking(id: 'b1', userId: 'user-1'),
      ]));

      when(
        () => mockRepository.fetchBookings('user-2'),
      ).thenAnswer((_) async => Result.ok([
        createTestBooking(id: 'b2', userId: 'user-2'),
      ]));

      final container = ProviderContainer(
        overrides: [
          serviceBookingRepositoryProvider
              .overrideWith((ref) => Future.value(mockRepository)),
        ],
      );

      final user1Bookings = await container.read(
        bookingsByUserProvider('user-1').future,
      );
      final user2Bookings = await container.read(
        bookingsByUserProvider('user-2').future,
      );

      expect(user1Bookings.length, 1);
      expect(user1Bookings.first.id, 'b1');
      expect(user2Bookings.length, 1);
      expect(user2Bookings.first.id, 'b2');

      container.dispose();
    });
  });
}
