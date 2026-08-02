import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/events/data/event_registration_repository.dart';
import 'package:tamga/src/features/events/data/supabase_event_registration_repository.dart';
import 'package:tamga/src/shared/domain/event_registration.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// A fake [SupabaseQueryBuilder] that returns typed filter builders for the
/// entry points (select/insert/update/upsert/delete) and completes with
/// [_result] when awaited. The SDK's Postgrest builders `implements
/// Future`, so the VM synthesizes typed forwarders that cast the
/// noSuchMethod result to each method's declared return type — a fake that
/// returns `this` for everything cannot satisfy those casts. These typed
/// fakes override the entry points and give every fake a real `then` so
/// awaiting a chain resolves the configured [_result].
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

/// List-flavored filter chain. eq/gte/order/select/etc. that keep the
/// PostgrestList flavor are satisfied by `this` via noSuchMethod;
/// single/maybeSingle switch to the map flavor.
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
  PostgrestFilterBuilder<Map<String, dynamic>> single() =>
      FakeMapFilter(_result);

  @override
  PostgrestFilterBuilder<Map<String, dynamic>?> maybeSingle() =>
      FakeMapFilter(_result);
}

/// Map-flavored filter for single()/maybeSingle() chains.
class FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>> {
  FakeMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as Map<String, dynamic>);
    }, onError: onError);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleRegistrationRow({
  String id = 'reg-1',
  String eventId = 'evt-1',
  String horseId = 'horse-1',
  String ownerId = 'owner-1',
  String registeredAt = '2026-07-01T10:00:00.000Z',
  String status = 'registered',
  String? notes,
  String createdAt = '2026-07-01T10:00:00.000Z',
  String updatedAt = '2026-07-01T10:00:00.000Z',
}) {
  return {
    'id': id,
    'event_id': eventId,
    'horse_id': horseId,
    'owner_id': ownerId,
    'registered_at': registeredAt,
    'status': status,
    'notes': notes,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseEventRegistrationRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseEventRegistrationRepository(client: mockClient);
  });

  group('SupabaseEventRegistrationRepository', () {
    test('implements EventRegistrationRepository', () {
      final repo = SupabaseEventRegistrationRepository(client: null);
      expect(repo, isA<EventRegistrationRepository>());
    });

    group('fetchRegistrations', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRegistrationRepository(client: null);
        final result = await repo.fetchRegistrations('evt-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to EventRegistration models on success', () async {
        final rows = [
          sampleRegistrationRow(
            id: 'reg-1',
            eventId: 'evt-1',
            horseId: 'horse-1',
            ownerId: 'owner-1',
            status: 'registered',
            notes: 'Хоёр дахь морь',
          ),
          sampleRegistrationRow(
            id: 'reg-2',
            eventId: 'evt-1',
            horseId: 'horse-2',
            ownerId: 'owner-2',
            status: 'cancelled',
            notes: null,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchRegistrations('evt-1');

        expect(result.isSuccess, isTrue);
        final registrations = result.value;
        expect(registrations, hasLength(2));

        final first = registrations.first;
        expect(first.id, 'reg-1');
        expect(first.eventId, 'evt-1');
        expect(first.horseId, 'horse-1');
        expect(first.ownerId, 'owner-1');
        expect(first.status, RegistrationStatus.registered);
        expect(first.notes, 'Хоёр дахь морь');
        expect(first.registeredAt, DateTime.parse('2026-07-01T10:00:00.000Z'));

        expect(registrations[1].status, RegistrationStatus.cancelled);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchRegistrations('evt-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchRegistrationsByHorse', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRegistrationRepository(client: null);
        final result = await repo.fetchRegistrationsByHorse('horse-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('filters by horse_id and maps rows on success', () async {
        final rows = [
          sampleRegistrationRow(id: 'reg-1', horseId: 'horse-1'),
          sampleRegistrationRow(id: 'reg-2', horseId: 'horse-1'),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchRegistrationsByHorse('horse-1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((r) => r.horseId == 'horse-1'), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchRegistrationsByHorse('horse-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('registerHorse', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventRegistrationRepository(client: null);
        final result = await repo.registerHorse(
          eventId: 'evt-1',
          horseId: 'horse-1',
          ownerId: 'owner-1',
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'returns SUPABASE_NOT_CONFIGURED when no authenticated user exists',
        () async {
          // currentUserId comes from the global Supabase instance, which is
          // never configured in tests — so the query is never reached.
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.registerHorse(
            eventId: 'evt-1',
            horseId: 'horse-1',
            ownerId: 'owner-1',
          );

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('event_registrations'));
        },
      );
    });

    group('cancelRegistration', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventRegistrationRepository(client: null);
        final result = await repo.cancelRegistration('reg-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'fetches, cancels and upserts the registration on success',
        () async {
          final results = <dynamic>[
            sampleRegistrationRow(
              id: 'reg-1',
              eventId: 'evt-1',
              horseId: 'horse-1',
              status: 'registered',
            ),
            <Map<String, dynamic>>[],
          ];
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

          final result = await repository.cancelRegistration('reg-1');

          expect(result.isSuccess, isTrue);
          final cancelled = result.value;
          expect(cancelled.id, 'reg-1');
          expect(cancelled.eventId, 'evt-1');
          expect(cancelled.horseId, 'horse-1');
          expect(cancelled.status, RegistrationStatus.cancelled);
          verify(() => mockClient.from('event_registrations')).called(2);
        },
      );

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Select failed'));

        final result = await repository.cancelRegistration('reg-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
