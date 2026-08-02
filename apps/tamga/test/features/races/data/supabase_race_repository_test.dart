import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/races/data/race_repository.dart';
import 'package:tamga/src/features/races/data/supabase_race_repository.dart';
import 'package:tamga/src/features/races/domain/race.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// A fake [SupabaseQueryBuilder] that returns a typed chain of fakes and
/// completes with [_result] when the chain is awaited.
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

/// A fake [PostgrestFilterBuilder] (list-flavored) that completes with
/// [_result] when awaited; `single`/`maybeSingle` switch to the map flavor.
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

/// A fake [PostgrestFilterBuilder] (map-flavored) used for `single` chains.
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

Map<String, dynamic> sampleRaceRow({
  String id = 'race-1',
  String name = 'Улсын наадам',
  String? location = 'Төв цэнгэлдэх хүрээлэн',
  String? date = '2026-07-11T00:00:00.000Z',
  String type = 'naadam',
  String status = 'upcoming',
  int? maxEntries = 20,
  int entryFee = 10000,
  String organizerId = 'org-1',
  String? description,
  String? prizeDistribution,
}) {
  return {
    'id': id,
    'name': name,
    'location': location,
    'date': date,
    'type': type,
    'status': status,
    'max_entries': maxEntries,
    'entry_fee': entryFee,
    'organizer_id': organizerId,
    'description': description,
    'prize_distribution': prizeDistribution,
  };
}

Race sampleRace() {
  return Race(
    id: 'race-1',
    name: 'Улсын наадам',
    type: RaceType.naadam,
    status: RaceStatus.upcoming,
    maxEntries: 20,
    entryFee: 10000,
  );
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseRaceRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseRaceRepository(client: mockClient);
  });

  group('SupabaseRaceRepository', () {
    test('implements RaceRepository', () {
      final repo = SupabaseRaceRepository(client: null);
      expect(repo, isA<RaceRepository>());
    });

    group('fetchAll', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.fetchAll();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to Race models on success', () async {
        final rows = [
          sampleRaceRow(
            id: 'race-1',
            name: 'Улсын наадам',
            location: 'Төв цэнгэлдэх хүрээлэн',
            date: '2026-07-11T00:00:00.000Z',
            type: 'naadam',
            status: 'upcoming',
            maxEntries: 20,
            entryFee: 10000,
            prizeDistribution: '1-р байр: 1,000,000₮',
          ),
          sampleRaceRow(
            id: 'race-2',
            name: 'Орон нутгийн уралдаан',
            type: 'local',
            status: 'completed',
            maxEntries: null,
            entryFee: 0,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchAll();

        expect(result.isSuccess, isTrue);
        final races = result.value;
        expect(races, hasLength(2));

        final first = races.first;
        expect(first.id, 'race-1');
        expect(first.name, 'Улсын наадам');
        expect(first.location, 'Төв цэнгэлдэх хүрээлэн');
        expect(first.date, DateTime.parse('2026-07-11T00:00:00.000Z'));
        expect(first.type, RaceType.naadam);
        expect(first.status, RaceStatus.upcoming);
        expect(first.maxEntries, 20);
        expect(first.entryFee, 10000);
        expect(first.organizerId, 'org-1');
        expect(first.prizeDistribution, '1-р байр: 1,000,000₮');

        final second = races[1];
        expect(second.type, RaceType.local);
        expect(second.status, RaceStatus.completed);
        expect(second.maxEntries, isNull);
        expect(second.entryFee, 0);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchAll();

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchById', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.fetchById('race-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('maps the single row to a Race on success', () async {
        when(() => mockClient.from(any())).thenAnswer(
          (_) => FakeQueryBuilder(
            sampleRaceRow(id: 'race-1', name: 'Улсын наадам'),
          ),
        );

        final result = await repository.fetchById('race-1');

        expect(result.isSuccess, isTrue);
        final race = result.value;
        expect(race.id, 'race-1');
        expect(race.name, 'Улсын наадам');
        expect(race.type, RaceType.naadam);
        verify(() => mockClient.from('races')).called(1);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchById('race-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchByType', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.fetchByType(RaceType.regional);
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('filters by type and maps rows on success', () async {
        final rows = [
          sampleRaceRow(id: 'race-1', type: 'regional'),
          sampleRaceRow(id: 'race-2', type: 'regional'),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchByType(RaceType.regional);

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((r) => r.type == RaceType.regional), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchByType(RaceType.local);

        expect(result.isFailure, isTrue);
      });
    });

    group('create', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.create(sampleRace());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test(
        'returns SUPABASE_NOT_CONFIGURED when no authenticated user exists',
        () async {
          when(
            () => mockClient.from(any()),
          ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

          final result = await repository.create(sampleRace());

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('races'));
        },
      );
    });

    group('update', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.update(sampleRace());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('upserts and returns the race on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.update(sampleRace());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'race-1');
        expect(result.value.name, 'Улсын наадам');
        verify(() => mockClient.from('races')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.update(sampleRace());

        expect(result.isFailure, isTrue);
      });
    });

    group('delete', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceRepository(client: null);
        final result = await repo.delete('race-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deletes the race on success', () async {
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(<Map<String, dynamic>>[]));

        final result = await repository.delete('race-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('races')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.delete('race-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}
