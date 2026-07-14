import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_booking_status.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';

void main() {
  group('ServiceBooking', () {
    final now = DateTime(2026, 6, 21);

    ServiceBooking createTestBooking({
      String id = 'booking-1',
      String userId = 'user-1',
      String? providerId = 'provider-1',
      ServiceProviderType providerType = ServiceProviderType.photographer,
      String serviceType = 'photo_session',
      List<String> horseIds = const ['horse-1', 'horse-2'],
      String? locationAimag = 'Архангай',
      String? locationSum = 'Эрдэнэбулган',
      String? address = 'Test address',
      DateTime? bookingDate,
      ServiceBookingStatus status = ServiceBookingStatus.pending,
      int? totalAmount = 50000,
      String? notes = 'Test booking',
      DateTime? createdAt,
      DateTime? updatedAt,
    }) {
      return ServiceBooking(
        id: id,
        userId: userId,
        providerId: providerId,
        providerType: providerType,
        serviceType: serviceType,
        horseIds: horseIds,
        locationAimag: locationAimag,
        locationSum: locationSum,
        address: address,
        bookingDate: bookingDate ?? DateTime(2026, 7, 1),
        status: status,
        totalAmount: totalAmount,
        notes: notes,
        createdAt: createdAt ?? now,
        updatedAt: updatedAt ?? now,
      );
    }

    test('creates ServiceBooking with all fields', () {
      final booking = createTestBooking();

      expect(booking.id, 'booking-1');
      expect(booking.userId, 'user-1');
      expect(booking.providerId, 'provider-1');
      expect(booking.providerType, ServiceProviderType.photographer);
      expect(booking.serviceType, 'photo_session');
      expect(booking.horseIds, ['horse-1', 'horse-2']);
      expect(booking.locationAimag, 'Архангай');
      expect(booking.locationSum, 'Эрдэнэбулган');
      expect(booking.address, 'Test address');
      expect(booking.bookingDate, DateTime(2026, 7, 1));
      expect(booking.status, ServiceBookingStatus.pending);
      expect(booking.totalAmount, 50000);
      expect(booking.notes, 'Test booking');
      expect(booking.createdAt, now);
      expect(booking.updatedAt, now);
      expect(booking.isActive, true);
    });

    test('cancel changes status to cancelled', () {
      final booking = createTestBooking();
      final cancelled = booking.cancel();

      expect(cancelled.status, ServiceBookingStatus.cancelled);
      expect(cancelled.id, booking.id);
      expect(cancelled.isActive, false);
    });

    test('confirm changes status to confirmed', () {
      final booking = createTestBooking();
      final confirmed = booking.confirm();

      expect(confirmed.status, ServiceBookingStatus.confirmed);
      expect(confirmed.isActive, true);
    });

    test('complete changes status to completed', () {
      final booking = createTestBooking();
      final completed = booking.complete();

      expect(completed.status, ServiceBookingStatus.completed);
      expect(completed.isActive, false);
    });

    test('cancel on already cancelled booking still cancels', () {
      final booking = createTestBooking(status: ServiceBookingStatus.cancelled);
      final cancelled = booking.cancel();

      expect(cancelled.status, ServiceBookingStatus.cancelled);
    });

    test('JSON serialization round-trips correctly', () {
      final booking = createTestBooking();
      final json = booking.toJson();
      final restored = ServiceBooking.fromJson(json);

      expect(restored.id, booking.id);
      expect(restored.userId, booking.userId);
      expect(restored.providerId, booking.providerId);
      expect(restored.providerType, booking.providerType);
      expect(restored.serviceType, booking.serviceType);
      expect(restored.horseIds, booking.horseIds);
      expect(restored.locationAimag, booking.locationAimag);
      expect(restored.locationSum, booking.locationSum);
      expect(restored.address, booking.address);
      expect(restored.bookingDate, booking.bookingDate);
      expect(restored.status, booking.status);
      expect(restored.totalAmount, booking.totalAmount);
      expect(restored.notes, booking.notes);
      expect(restored.createdAt, booking.createdAt);
      expect(restored.updatedAt, booking.updatedAt);
    });

    test('Supabase JSON serialization round-trips correctly', () {
      final booking = createTestBooking();
      final supabaseJson = booking.toSupabaseJson();
      final restored = ServiceBooking.fromSupabaseJson(supabaseJson);

      expect(restored.id, booking.id);
      expect(restored.userId, booking.userId);
      expect(restored.providerId, booking.providerId);
      expect(restored.providerType, booking.providerType);
      expect(restored.serviceType, booking.serviceType);
      expect(restored.horseIds, booking.horseIds);
      expect(restored.status, booking.status);
      expect(restored.notes, booking.notes);
    });

    test('fromSupabaseJson handles snake_case keys', () {
      final row = {
        'id': 'sb-1',
        'user_id': 'user-1',
        'provider_id': null,
        'provider_type': 'vet',
        'service_type': 'consultation',
        'horse_ids': ['horse-1'],
        'location_aimag': 'Булган',
        'location_sum': null,
        'address': null,
        'booking_date': '2026-07-15',
        'status': 'confirmed',
        'total_amount': null,
        'notes': null,
        'created_at': '2026-06-21T10:00:00.000',
        'updated_at': '2026-06-21T10:00:00.000',
      };

      final booking = ServiceBooking.fromSupabaseJson(row);

      expect(booking.id, 'sb-1');
      expect(booking.userId, 'user-1');
      expect(booking.providerId, null);
      expect(booking.providerType, ServiceProviderType.vet);
      expect(booking.serviceType, 'consultation');
      expect(booking.horseIds, ['horse-1']);
      expect(booking.status, ServiceBookingStatus.confirmed);
      expect(booking.totalAmount, null);
    });

    test('toSupabaseJson produces snake_case keys', () {
      final booking = createTestBooking();
      final json = booking.toSupabaseJson();

      expect(json.containsKey('id'), true);
      expect(json.containsKey('user_id'), true);
      expect(json.containsKey('provider_type'), true);
      expect(json.containsKey('service_type'), true);
      expect(json.containsKey('horse_ids'), true);
      expect(json.containsKey('booking_date'), true);
      expect(json.containsKey('created_at'), true);
      expect(json.containsKey('updated_at'), true);
      expect(json.containsKey('user_id'), true);
      expect(json.containsKey('location_aimag'), true);

      // CamelCase keys should not be present
      expect(json.containsKey('userId'), false);
      expect(json.containsKey('providerType'), false);
    });

    test('toSupabaseJson booking_date is date-only format', () {
      final booking = createTestBooking(bookingDate: DateTime(2026, 7, 5, 14, 30));
      final json = booking.toSupabaseJson();

      expect(json['booking_date'], '2026-07-05');
    });

    test('isActive returns true for pending status', () {
      final booking = createTestBooking(status: ServiceBookingStatus.pending);
      expect(booking.isActive, true);
    });

    test('isActive returns true for confirmed status', () {
      final booking = createTestBooking(status: ServiceBookingStatus.confirmed);
      expect(booking.isActive, true);
    });

    test('isActive returns false for completed status', () {
      final booking = createTestBooking(status: ServiceBookingStatus.completed);
      expect(booking.isActive, false);
    });

    test('isActive returns false for cancelled status', () {
      final booking = createTestBooking(status: ServiceBookingStatus.cancelled);
      expect(booking.isActive, false);
    });
  });

  group('ServiceBookingStatus', () {
    test('has correct labels', () {
      expect(ServiceBookingStatus.pending.label, 'Хүлээгдэж буй');
      expect(ServiceBookingStatus.confirmed.label, 'Баталгаажсан');
      expect(ServiceBookingStatus.completed.label, 'Дууссан');
      expect(ServiceBookingStatus.cancelled.label, 'Цуцалсан');
    });

    test('all values have names', () {
      for (final status in ServiceBookingStatus.values) {
        expect(status.name, isNotEmpty);
      }
    });
  });

  group('ServiceProviderType', () {
    test('has correct labels', () {
      expect(ServiceProviderType.photographer.label, 'Гэрэл зурагчин');
      expect(ServiceProviderType.vet.label, 'Мал эмнэлэг');
    });

    test('all values have names', () {
      for (final type in ServiceProviderType.values) {
        expect(type.name, isNotEmpty);
      }
    });
  });
}
