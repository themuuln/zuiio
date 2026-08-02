import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/events/data/event_repository.dart';
import 'package:tamga/src/features/events/data/supabase_event_repository.dart';
import 'package:tamga/src/shared/domain/event.dart';

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

Map<String, dynamic> sampleEventRow({
  String id = 'evt-1',
  String horseId = 'horse-1',
  String title = 'Улсын наадам',
  String eventType = 'race',
  String ownerId = 'owner-1',
  String? date = '2026-07-11T00:00:00.000Z',
  String? horseName = 'Хан Хүлэг',
  String? location = 'Төв аймаг',
  double? latitude,
  double? longitude,
  String? result,
  int? prizeAmount,
  String? organizerName,
  String? organizerPhone,
  String? organizerEmail,
  bool isFeatured = false,
  bool registrationEnabled = false,
  String? address,
  String? notes,
  List<String> photoUrls = const [],
  String createdAt = '2026-01-01T00:00:00.000Z',
  String updatedAt = '2026-01-01T00:00:00.000Z',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'title': title,
    'event_type': eventType,
    'owner_id': ownerId,
    'date': date,
    'horse_name': horseName,
    'location': location,
    'latitude': latitude,
    'longitude': longitude,
    'result': result,
    'prize_amount': prizeAmount,
    'organizer_name': organizerName,
    'organizer_phone': organizerPhone,
    'organizer_email': organizerEmail,
    'is_featured': isFeatured,
    'registration_enabled': registrationEnabled,
    'address': address,
    'notes': notes,
    'photo_urls': photoUrls,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseEventRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseEventRepository(client: mockClient);
  });

  group('SupabaseEventRepository', () {
    test('implements EventRepository', () {
      final repo = SupabaseEventRepository(client: null);
      expect(repo, isA<EventRepository>());
    });

    group('fetchEvents', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.fetchEvents();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test(
        'returns empty list when no authenticated user exists (never queries)',
        () async {
          // currentUserId comes from the global Supabase instance, which is
          // never configured in tests — so the query is never reached.
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.fetchEvents();

          expect(result.isSuccess, isTrue);
          expect(result.value, isEmpty);
          verifyNever(() => mockClient.from('events'));
        },
      );
    });

    group('fetchEventsByHorse', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.fetchEventsByHorse('horse-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to Event models on success', () async {
        final rows = [
          sampleEventRow(
            id: 'evt-1',
            horseId: 'horse-1',
            title: 'Улсын наадам',
            eventType: 'race',
            date: '2026-07-11T00:00:00.000Z',
            location: 'Төв аймаг',
            prizeAmount: 500000,
            isFeatured: true,
            registrationEnabled: true,
            notes: 'Тэмдэглэл',
          ),
          sampleEventRow(
            id: 'evt-2',
            horseId: 'horse-1',
            title: 'Дуудлага худалдаа',
            eventType: 'auction',
            date: null,
            location: null,
            horseName: null,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchEventsByHorse('horse-1');

        expect(result.isSuccess, isTrue);
        final events = result.value;
        expect(events, hasLength(2));

        final first = events.first;
        expect(first.id, 'evt-1');
        expect(first.horseId, 'horse-1');
        expect(first.title, 'Улсын наадам');
        expect(first.eventType, EventType.race);
        expect(first.ownerId, 'owner-1');
        expect(first.date, DateTime.parse('2026-07-11T00:00:00.000Z'));
        expect(first.location, 'Төв аймаг');
        expect(first.prizeAmount, 500000);
        expect(first.isFeatured, isTrue);
        expect(first.registrationEnabled, isTrue);
        expect(first.notes, 'Тэмдэглэл');

        expect(events[1].eventType, EventType.auction);
        expect(events[1].date, isNull);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchEventsByHorse('horse-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchEventsByOwner', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.fetchEventsByOwner('owner-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('filters by owner_id and maps rows on success', () async {
        final rows = [
          sampleEventRow(id: 'evt-1', ownerId: 'owner-1'),
          sampleEventRow(id: 'evt-2', ownerId: 'owner-1'),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchEventsByOwner('owner-1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((e) => e.ownerId == 'owner-1'), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchEventsByOwner('owner-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchFeaturedEvents', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.fetchFeaturedEvents();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps featured rows on success', () async {
        final rows = [
          sampleEventRow(id: 'evt-1', isFeatured: true),
          sampleEventRow(id: 'evt-2', isFeatured: true),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchFeaturedEvents();

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((e) => e.isFeatured), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchFeaturedEvents();

        expect(result.isFailure, isTrue);
      });
    });

    group('saveEvent', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.saveEvent(
          Event(
            id: 'evt-1',
            horseId: 'horse-1',
            title: 'Наадам',
            eventType: EventType.race,
            createdAt: DateTime(2026, 1, 1),
            updatedAt: DateTime(2026, 1, 1),
          ),
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'returns SUPABASE_NOT_CONFIGURED when no authenticated user exists',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.saveEvent(
            Event(
              id: 'evt-1',
              horseId: 'horse-1',
              title: 'Наадам',
              eventType: EventType.race,
              createdAt: DateTime(2026, 1, 1),
              updatedAt: DateTime(2026, 1, 1),
            ),
          );

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('events'));
        },
      );
    });

    group('deleteEvent', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventRepository(client: null);
        final result = await repo.deleteEvent('evt-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deletes the event on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.deleteEvent('evt-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('events')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.deleteEvent('evt-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
