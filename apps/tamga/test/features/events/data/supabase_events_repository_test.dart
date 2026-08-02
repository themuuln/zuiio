import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/events/data/supabase_events_repository.dart';
import 'package:tamga/src/features/events/domain/event_record.dart';

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

Map<String, dynamic> sampleEventRecordRow({
  String id = 'evt-1',
  String title = 'Улсын наадам',
  String horseId = 'horse-1',
  String horseName = 'Хан Хүлэг',
  String eventType = 'race',
  String dateLabel = '2026-07-11',
  String placeLabel = 'Төв аймаг',
  String awardLabel = '1-р байр',
  String notes = '',
  bool isUpcoming = true,
  List<String> photoUrls = const [],
}) {
  return {
    'id': id,
    'title': title,
    'horse_id': horseId,
    'horse_name': horseName,
    'event_type': eventType,
    'date_label': dateLabel,
    'place_label': placeLabel,
    'award_label': awardLabel,
    'notes': notes,
    'is_upcoming': isUpcoming,
    'photo_urls': photoUrls,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseEventsRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseEventsRepository(client: mockClient);
  });

  group('SupabaseEventsRepository', () {
    test('can be constructed with a null client', () {
      final repo = SupabaseEventsRepository(client: null);
      expect(repo, isNotNull);
    });

    group('list', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventsRepository(client: null);
        final result = await repo.list();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test(
        'returns empty list when no authenticated user exists (never queries)',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.list();

          expect(result.isSuccess, isTrue);
          expect(result.value, isEmpty);
          verifyNever(() => mockClient.from('events'));
        },
      );
    });

    group('listByHorse', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseEventsRepository(client: null);
        final result = await repo.listByHorse('horse-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to EventRecord models on success', () async {
        final rows = [
          sampleEventRecordRow(
            id: 'evt-1',
            title: 'Улсын наадам',
            horseId: 'horse-1',
            horseName: 'Хан Хүлэг',
            eventType: 'race',
            dateLabel: '2026-07-11',
            placeLabel: 'Төв аймаг',
            awardLabel: '1-р байр',
            isUpcoming: true,
            photoUrls: ['https://example.com/p1.jpg'],
          ),
          sampleEventRecordRow(
            id: 'evt-2',
            title: 'Дуудлага худалдаа',
            horseId: 'horse-1',
            isUpcoming: false,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.listByHorse('horse-1');

        expect(result.isSuccess, isTrue);
        final records = result.value;
        expect(records, hasLength(2));

        final first = records.first;
        expect(first.id, 'evt-1');
        expect(first.title, 'Улсын наадам');
        expect(first.horseId, 'horse-1');
        expect(first.horseName, 'Хан Хүлэг');
        expect(first.eventType, 'race');
        expect(first.dateLabel, '2026-07-11');
        expect(first.placeLabel, 'Төв аймаг');
        expect(first.awardLabel, '1-р байр');
        expect(first.isUpcoming, isTrue);
        expect(first.photoUrls, ['https://example.com/p1.jpg']);

        expect(records[1].isUpcoming, isFalse);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.listByHorse('horse-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('create', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventsRepository(client: null);
        final result = await repo.create(_sampleRecord());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'returns SUPABASE_NOT_CONFIGURED when no authenticated user exists',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.create(_sampleRecord());

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('events'));
        },
      );
    });

    group('update', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventsRepository(client: null);
        final result = await repo.update(_sampleRecord());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'returns SUPABASE_NOT_CONFIGURED when no authenticated user exists',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.update(_sampleRecord());

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('events'));
        },
      );
    });

    group('delete', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseEventsRepository(client: null);
        final result = await repo.delete('evt-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deletes the event on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.delete('evt-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('events')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.delete('evt-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}

EventRecord _sampleRecord() {
  return EventRecord(
    id: 'evt-1',
    title: 'Улсын наадам',
    horseId: 'horse-1',
    horseName: 'Хан Хүлэг',
    eventType: 'race',
    dateLabel: '2026-07-11',
    placeLabel: 'Төв аймаг',
    awardLabel: '',
    notes: '',
    isUpcoming: true,
  );
}
