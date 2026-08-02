import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/races/data/race_entry_repository.dart';
import 'package:tamga/src/features/races/data/supabase_race_entry_repository.dart';
import 'package:tamga/src/features/races/domain/race_entry.dart';

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

Map<String, dynamic> sampleRaceEntryRow({
  String id = 're-1',
  String raceId = 'race-1',
  String horseId = 'horse-1',
  String ownerId = 'owner-1',
  String? jockeyName = 'Бат',
  String status = 'registered',
  String? result,
  int? placement,
  int? prize,
}) {
  return {
    'id': id,
    'race_id': raceId,
    'horse_id': horseId,
    'owner_id': ownerId,
    'jockey_name': jockeyName,
    'status': status,
    'result': result,
    'placement': placement,
    'prize': prize,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseRaceEntryRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseRaceEntryRepository(client: mockClient);
  });

  group('SupabaseRaceEntryRepository', () {
    test('implements RaceEntryRepository', () {
      final repo = SupabaseRaceEntryRepository(client: null);
      expect(repo, isA<RaceEntryRepository>());
    });

    group('fetchByRace', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseRaceEntryRepository(client: null);
        final result = await repo.fetchByRace('race-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to RaceEntry models on success', () async {
        final rows = [
          sampleRaceEntryRow(
            id: 're-1',
            raceId: 'race-1',
            horseId: 'horse-1',
            ownerId: 'owner-1',
            jockeyName: 'Бат',
            status: 'registered',
          ),
          sampleRaceEntryRow(
            id: 're-2',
            raceId: 'race-1',
            horseId: 'horse-2',
            jockeyName: 'Дорж',
            status: 'competed',
            result: '2:30.5',
            placement: 1,
            prize: 500000,
          ),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchByRace('race-1');

        expect(result.isSuccess, isTrue);
        final entries = result.value;
        expect(entries, hasLength(2));

        final first = entries.first;
        expect(first.id, 're-1');
        expect(first.raceId, 'race-1');
        expect(first.horseId, 'horse-1');
        expect(first.ownerId, 'owner-1');
        expect(first.jockeyName, 'Бат');
        expect(first.status, RaceEntryStatus.registered);
        expect(first.result, isNull);

        final second = entries[1];
        expect(second.status, RaceEntryStatus.competed);
        expect(second.result, '2:30.5');
        expect(second.placement, 1);
        expect(second.prize, 500000);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.fetchByRace('race-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchByHorse', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseRaceEntryRepository(client: null);
        final result = await repo.fetchByHorse('horse-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('filters by horse_id and maps rows on success', () async {
        final rows = [
          sampleRaceEntryRow(id: 're-1', horseId: 'horse-1'),
          sampleRaceEntryRow(id: 're-2', horseId: 'horse-1'),
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(rows));

        final result = await repository.fetchByHorse('horse-1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.every((e) => e.horseId == 'horse-1'), isTrue);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchByHorse('horse-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('register', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceEntryRepository(client: null);
        final result = await repo.register(
          raceId: 'race-1',
          horseId: 'horse-1',
          ownerId: 'owner-1',
          jockeyName: 'Бат',
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

          final result = await repository.register(
            raceId: 'race-1',
            horseId: 'horse-1',
            ownerId: 'owner-1',
            jockeyName: 'Бат',
          );

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
          verifyNever(() => mockClient.from('race_entries'));
        },
      );
    });

    group('cancel', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceEntryRepository(client: null);
        final result = await repo.cancel('re-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('fetches and scratches the entry on success', () async {
        final results = <dynamic>[
          sampleRaceEntryRow(
            id: 're-1',
            raceId: 'race-1',
            horseId: 'horse-1',
            status: 'registered',
          ),
          <Map<String, dynamic>>[],
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

        final result = await repository.cancel('re-1');

        expect(result.isSuccess, isTrue);
        final entry = result.value;
        expect(entry.id, 're-1');
        expect(entry.raceId, 'race-1');
        expect(entry.horseId, 'horse-1');
        expect(entry.status, RaceEntryStatus.scratched);
        verify(() => mockClient.from('race_entries')).called(2);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Select failed'));

        final result = await repository.cancel('re-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('updateResult', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseRaceEntryRepository(client: null);
        final result = await repo.updateResult(
          id: 're-1',
          result: '2:30.5',
          placement: 1,
          prize: 500000,
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('updates status to competed with result on success', () async {
        final results = <dynamic>[
          sampleRaceEntryRow(
            id: 're-1',
            raceId: 'race-1',
            horseId: 'horse-1',
            status: 'registered',
          ),
          <Map<String, dynamic>>[],
        ];
        when(
          () => mockClient.from(any()),
        ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));

        final result = await repository.updateResult(
          id: 're-1',
          result: '2:30.5',
          placement: 1,
          prize: 500000,
        );

        expect(result.isSuccess, isTrue);
        final entry = result.value;
        expect(entry.status, RaceEntryStatus.competed);
        expect(entry.result, '2:30.5');
        expect(entry.placement, 1);
        expect(entry.prize, 500000);
        verify(() => mockClient.from('race_entries')).called(2);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Select failed'));

        final result = await repository.updateResult(
          id: 're-1',
          result: '2:30.5',
          placement: 1,
          prize: 500000,
        );

        expect(result.isFailure, isTrue);
      });
    });
  });
}
