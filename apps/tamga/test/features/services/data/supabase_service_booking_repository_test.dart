import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/services/data/services_repository.dart';
import 'package:tamga/src/features/services/data/supabase_service_booking_repository.dart';
import 'package:tamga/src/features/services/domain/service_booking.dart';
import 'package:tamga/src/features/services/domain/service_booking_status.dart';
import 'package:tamga/src/features/services/domain/service_provider_type.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// A fake [SupabaseQueryBuilder] whose chain entry points return filter-builder
/// fakes with matching runtime types (the plain `noSuchMethod => this` pattern
/// breaks on the SDK's typed forwarder casts). Completes with [_result] when
/// awaited.
class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(dynamic) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then(onValue, onError: onError);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> insert(
    Object values, {
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> update(Map values) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> delete() => FakeFilterBuilder(_result);
}

/// List-flavored chain fake: chained filter calls are satisfied by `this` via
/// noSuchMethod casts; [maybeSingle] switches to the nullable map flavor.
class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as PostgrestList);
    }, onError: onError);
  }

  @override
  PostgrestFilterBuilder<Map<String, dynamic>?> maybeSingle() =>
      FakeMapFilter(_result);
}

/// Nullable map-flavored chain fake for [maybeSingle] chains. Must implement
/// the NULLABLE map flavor: the VM instantiates the await continuation with
/// the future's type argument and rejects null for a non-nullable one, which
/// would leave the awaited future hanging.
class FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>?> {
  FakeMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>?) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return onValue(null);
      return onValue(value as Map<String, dynamic>);
    }, onError: onError);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleBookingRow({
  String id = 'bk-1',
  String userId = 'user-1',
  String? providerId = 'prov-1',
  String providerType = 'vet',
  String serviceType = 'Вакцинжуулалт',
  List<String> horseIds = const ['horse-1'],
  String? locationAimag = 'Төв',
  String? locationSum = 'Зуунмод',
  String? address,
  String bookingDate = '2026-07-15',
  String status = 'pending',
  int? totalAmount = 150000,
  String? notes,
  String createdAt = '2026-07-01T10:00:00.000Z',
  String updatedAt = '2026-07-01T10:00:00.000Z',
}) {
  return {
    'id': id,
    'user_id': userId,
    'provider_id': providerId,
    'provider_type': providerType,
    'service_type': serviceType,
    'horse_ids': horseIds,
    'location_aimag': locationAimag,
    'location_sum': locationSum,
    'address': address,
    'booking_date': bookingDate,
    'status': status,
    'total_amount': totalAmount,
    'notes': notes,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

ServiceBooking sampleBooking() {
  return ServiceBooking(
    id: 'bk-1',
    userId: 'user-1',
    providerId: 'prov-1',
    providerType: ServiceProviderType.vet,
    serviceType: 'Вакцинжуулалт',
    horseIds: const ['horse-1'],
    locationAimag: 'Төв',
    bookingDate: DateTime(2026, 7, 15),
    createdAt: DateTime(2026, 7, 1),
    updatedAt: DateTime(2026, 7, 1),
  );
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseServiceBookingRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseServiceBookingRepository(client: mockClient);
  });

  group('SupabaseServiceBookingRepository', () {
    test('implements ServiceBookingRepository', () {
      final repo = SupabaseServiceBookingRepository(client: null);
      expect(repo, isA<ServiceBookingRepository>());
    });

    group('fetchBookings', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.fetchBookings('user-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to ServiceBooking models on success', () async {
        final rows = [
          sampleBookingRow(
            id: 'bk-1',
            userId: 'user-1',
            providerType: 'vet',
            serviceType: 'Вакцинжуулалт',
            horseIds: const ['horse-1', 'horse-2'],
            status: 'pending',
            totalAmount: 150000,
            notes: 'Гэртээ ирэх',
          ),
          sampleBookingRow(
            id: 'bk-2',
            userId: 'user-1',
            providerType: 'photographer',
            serviceType: 'Зураг авахуулах',
            status: 'confirmed',
            totalAmount: null,
            notes: null,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchBookings('user-1');

        expect(result.isSuccess, isTrue);
        final bookings = result.value;
        expect(bookings, hasLength(2));

        final first = bookings.first;
        expect(first.id, 'bk-1');
        expect(first.userId, 'user-1');
        expect(first.providerId, 'prov-1');
        expect(first.providerType, ServiceProviderType.vet);
        expect(first.serviceType, 'Вакцинжуулалт');
        expect(first.horseIds, ['horse-1', 'horse-2']);
        expect(first.locationAimag, 'Төв');
        expect(first.locationSum, 'Зуунмод');
        expect(first.status, ServiceBookingStatus.pending);
        expect(first.totalAmount, 150000);
        expect(first.notes, 'Гэртээ ирэх');
        expect(first.bookingDate, DateTime(2026, 7, 15));

        final second = bookings[1];
        expect(second.providerType, ServiceProviderType.photographer);
        expect(second.status, ServiceBookingStatus.confirmed);
        expect(second.totalAmount, isNull);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchBookings('user-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchBookingById', () {
      test('returns null result when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.fetchBookingById('bk-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('maps the single row on success', () async {
        when(() => mockClient.from(any())).thenAnswer(
          (_) => FakeQueryBuilder(
            sampleBookingRow(id: 'bk-1', status: 'completed'),
          ),
        );

        final result = await repository.fetchBookingById('bk-1');

        expect(result.isSuccess, isTrue);
        expect(result.value!.id, 'bk-1');
        expect(result.value!.status, ServiceBookingStatus.completed);
        verify(() => mockClient.from('service_bookings')).called(1);
      });

      test('returns null when no row is found', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(null));

        final result = await repository.fetchBookingById('missing');

        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchBookingById('bk-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('createBooking', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.createBooking(sampleBooking());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('inserts and returns the booking on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.createBooking(sampleBooking());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'bk-1');
        expect(result.value.status, ServiceBookingStatus.pending);
        verify(() => mockClient.from('service_bookings')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.createBooking(sampleBooking());

        expect(result.isFailure, isTrue);
      });
    });

    group('updateBooking', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.updateBooking(sampleBooking());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('upserts and returns the booking on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.updateBooking(sampleBooking());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'bk-1');
        verify(() => mockClient.from('service_bookings')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.updateBooking(sampleBooking());

        expect(result.isFailure, isTrue);
      });
    });

    group('cancelBooking', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.cancelBooking('bk-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('cancels an active booking on success', () async {
        final results = <dynamic>[
          sampleBookingRow(id: 'bk-1', status: 'pending'),
          <Map<String, dynamic>>[],
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

        final result = await repository.cancelBooking('bk-1');

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'bk-1');
        expect(result.value.status, ServiceBookingStatus.cancelled);
        verify(() => mockClient.from('service_bookings')).called(2);
      });

      test(
        'fails with BOOKING_ALREADY_CANCELLED when already cancelled',
        () async {
          when(() => mockClient.from(any())).thenAnswer(
            (_) => FakeQueryBuilder(
              sampleBookingRow(id: 'bk-1', status: 'cancelled'),
            ),
          );

          final result = await repository.cancelBooking('bk-1');

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'BOOKING_ALREADY_CANCELLED');
        },
      );

      test(
        'fails with BOOKING_NOT_FOUND when booking does not exist',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(null));

          final result = await repository.cancelBooking('missing');

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'BOOKING_NOT_FOUND');
        },
      );

      test('returns failure when the lookup query throws', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Select failed'));

        final result = await repository.cancelBooking('bk-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('deleteBooking', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseServiceBookingRepository(client: null);
        final result = await repo.deleteBooking('bk-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deletes the booking on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.deleteBooking('bk-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('service_bookings')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.deleteBooking('bk-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
