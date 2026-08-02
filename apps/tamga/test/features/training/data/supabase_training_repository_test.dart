import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/training/data/supabase_training_repository.dart';
import 'package:tamga/src/features/training/data/training_repository.dart';
import 'package:tamga/src/features/training/domain/performance_record.dart';
import 'package:tamga/src/features/training/domain/training_log.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// Postgrest builders are immutable and execute a real HTTP request when
// awaited, so the chain is replaced with lightweight fakes that record the
// calls the repository makes and deliver canned rows through a real `then`
// implementation (the await machinery relies on `Future.then`).

class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this.rows, this.calls, {this.totalCount});

  final List<Map<String, dynamic>> rows;
  final List<String> calls;
  final int? totalCount;

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) {
    calls.add('select($columns)');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> insert(
    Object values, {
    bool defaultToNull = true,
  }) {
    calls.add('insert');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    calls.add('upsert');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> update(Map values) {
    calls.add('update:${values.keys.join(',')}');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> delete() {
    calls.add('delete');
    return FakeFilterBuilder(rows, calls, totalCount: totalCount);
  }
}

class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this.rows, this.calls, {this.totalCount});

  final List<Map<String, dynamic>> rows;
  final List<String> calls;
  final int? totalCount;

  @override
  PostgrestFilterBuilder<PostgrestList> eq(String column, Object value) {
    calls.add('eq:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> gte(String column, Object value) {
    calls.add('gte:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> lte(String column, Object value) {
    calls.add('lte:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> gt(String column, Object value) {
    calls.add('gt:$column=$value');
    return this;
  }

  @override
  PostgrestFilterBuilder<PostgrestList> or(
    String filters, {
    String? referencedTable,
  }) {
    calls.add('or:$filters');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) {
    calls.add('order:$column:asc=$ascending');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> range(
    int from,
    int to, {
    String? referencedTable,
  }) {
    calls.add('range:$from-$to');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestList> select([String columns = '*']) {
    calls.add('select($columns)');
    return this;
  }

  @override
  PostgrestTransformBuilder<PostgrestMap> single() {
    calls.add('single');
    return FakeMapBuilder(rows.first);
  }

  @override
  PostgrestTransformBuilder<PostgrestMap?> maybeSingle() {
    calls.add('maybeSingle');
    return FakeMaybeMapBuilder(rows.isEmpty ? null : rows.first);
  }

  @override
  ResponsePostgrestBuilder<
    PostgrestResponse<PostgrestList>,
    PostgrestList,
    PostgrestList
  >
  count([CountOption count = CountOption.exact]) {
    calls.add('count');
    return FakeCountBuilder(rows, totalCount ?? rows.length);
  }

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestList value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(rows));
  }
}

class FakeMapBuilder extends Fake
    implements PostgrestTransformBuilder<PostgrestMap> {
  FakeMapBuilder(this.row);

  final Map<String, dynamic> row;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestMap value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(row));
  }
}

class FakeMaybeMapBuilder extends Fake
    implements PostgrestTransformBuilder<PostgrestMap?> {
  FakeMaybeMapBuilder(this.row);

  final Map<String, dynamic>? row;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestMap? value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(() => onValue(row));
  }
}

class FakeCountBuilder extends Fake
    implements
        ResponsePostgrestBuilder<
          PostgrestResponse<PostgrestList>,
          PostgrestList,
          PostgrestList
        > {
  FakeCountBuilder(this.rows, this.totalCount);

  final List<Map<String, dynamic>> rows;
  final int totalCount;

  @override
  Future<U> then<U>(
    FutureOr<U> Function(PostgrestResponse<PostgrestList> value) onValue, {
    Function? onError,
  }) {
    return Future<U>.sync(
      () => onValue(PostgrestResponse(data: rows, count: totalCount)),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> trainingLogRow({
  String id = 'tl-1',
  String horseId = 'horse-1',
  String type = 'gallop',
  String date = '2026-01-15T10:00:00.000',
  int durationMinutes = 45,
  double? distanceKm = 3.5,
  String notes = 'Warm up gallop',
  String? handlerName = 'Бат',
  String? weather = 'Sunny',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'type': type,
    'date': date,
    'duration_minutes': durationMinutes,
    'distance_km': distanceKm,
    'notes': notes,
    'handler_name': handlerName,
    'weather': weather,
    'created_at': '2026-01-15T10:00:00.000',
    'updated_at': '2026-01-15T10:00:00.000',
  };
}

Map<String, dynamic> performanceRow({
  String id = 'perf-1',
  String horseId = 'horse-1',
  String metric = 'speed',
  double value = 55.5,
  String? date = '2026-01-15T10:00:00.000',
  String? unit = 'км/ц',
  String notes = '',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'metric': metric,
    'value': value,
    'date': date,
    'unit': unit,
    'notes': notes,
    'created_at': '2026-01-15T10:00:00.000',
    'updated_at': '2026-01-15T10:00:00.000',
  };
}

TrainingLog sampleTrainingLog() {
  return TrainingLog(
    id: 'tl-1',
    horseId: 'horse-1',
    type: TrainingLogType.gallop,
    date: DateTime(2026, 1, 15, 10),
    durationMinutes: 45,
    distanceKm: 3.5,
    notes: 'Warm up gallop',
    createdAt: DateTime(2026, 1, 15, 10),
    updatedAt: DateTime(2026, 1, 15, 10),
  );
}

PerformanceRecord samplePerformance() {
  return PerformanceRecord(
    id: 'perf-1',
    horseId: 'horse-1',
    metric: MetricType.speed,
    value: 55.5,
    date: DateTime(2026, 1, 15, 10),
    unit: 'км/ц',
    createdAt: DateTime(2026, 1, 15, 10),
    updatedAt: DateTime(2026, 1, 15, 10),
  );
}

void main() {
  group('SupabaseTrainingRepository implements TrainingRepository', () {
    test('class exists and implements TrainingRepository', () {
      final repo = SupabaseTrainingRepository(client: null);
      expect(repo, isA<TrainingRepository>());
    });
  });

  group('fetchByHorse', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.fetchByHorse('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('maps rows to TrainingLog domain models field by field', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        trainingLogRow(),
        trainingLogRow(
          id: 'tl-2',
          type: 'endurance',
          durationMinutes: 120,
          distanceKm: null,
          notes: 'Long slow distance',
          handlerName: null,
          weather: null,
        ),
      ];
      when(
        () => mockClient.from('training_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.fetchByHorse('horse-1');

      expect(result.isSuccess, isTrue);
      final logs = result.value;
      expect(logs, hasLength(2));

      final first = logs[0];
      expect(first.id, 'tl-1');
      expect(first.horseId, 'horse-1');
      expect(first.type, TrainingLogType.gallop);
      expect(first.date, DateTime.parse('2026-01-15T10:00:00.000'));
      expect(first.durationMinutes, 45);
      expect(first.distanceKm, 3.5);
      expect(first.notes, 'Warm up gallop');
      expect(first.handlerName, 'Бат');
      expect(first.weather, 'Sunny');

      final second = logs[1];
      expect(second.type, TrainingLogType.endurance);
      expect(second.durationMinutes, 120);
      expect(second.distanceKm, isNull);
      expect(second.handlerName, isNull);
      expect(second.weather, isNull);

      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:horse_id=horse-1',
          'order:date:asc=false',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.fetchByHorse('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('save', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.save(sampleTrainingLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('refuses to save without an authenticated user', () async {
      // In the unit-test environment no Supabase session exists, so
      // currentUserId is null and the repository bails out before querying.
      final mockClient = MockSupabaseClient();
      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.save(sampleTrainingLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });
  });

  group('delete', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.delete('tl-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('training_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.delete('tl-1');

      expect(result.isSuccess, isTrue);
      expect(calls, containsAllInOrder(['delete', 'eq:id=tl-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.delete('tl-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchPerformanceByHorse', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.fetchPerformanceByHorse('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test(
      'maps rows to PerformanceRecord domain models field by field',
      () async {
        final mockClient = MockSupabaseClient();
        final calls = <String>[];
        final rows = [
          performanceRow(),
          performanceRow(
            id: 'perf-2',
            metric: 'weight',
            value: 420.0,
            date: null,
            unit: 'кг',
            notes: 'Post-race weigh-in',
          ),
        ];
        when(
          () => mockClient.from('performance_records'),
        ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

        final repo = SupabaseTrainingRepository(client: mockClient);
        final result = await repo.fetchPerformanceByHorse('horse-1');

        expect(result.isSuccess, isTrue);
        final records = result.value;
        expect(records, hasLength(2));

        final first = records[0];
        expect(first.id, 'perf-1');
        expect(first.horseId, 'horse-1');
        expect(first.metric, MetricType.speed);
        expect(first.value, 55.5);
        expect(first.date, DateTime.parse('2026-01-15T10:00:00.000'));
        expect(first.unit, 'км/ц');

        final second = records[1];
        expect(second.metric, MetricType.weight);
        expect(second.value, 420.0);
        expect(second.unit, 'кг');
        expect(second.notes, 'Post-race weigh-in');
        // When date is null, fromSupabaseJson falls back to created_at.
        expect(second.date, DateTime.parse('2026-01-15T10:00:00.000'));

        expect(
          calls,
          containsAllInOrder([
            'select(*)',
            'eq:horse_id=horse-1',
            'order:date:asc=false',
          ]),
        );
      },
    );

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.fetchPerformanceByHorse('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('savePerformance', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.savePerformance(samplePerformance());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('refuses to save without an authenticated user', () async {
      final mockClient = MockSupabaseClient();
      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.savePerformance(samplePerformance());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });
  });

  group('deletePerformance', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseTrainingRepository(client: null);
      final result = await repo.deletePerformance('perf-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('performance_records'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.deletePerformance('perf-1');

      expect(result.isSuccess, isTrue);
      expect(calls, containsAllInOrder(['delete', 'eq:id=perf-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseTrainingRepository(client: mockClient);
      final result = await repo.deletePerformance('perf-1');

      expect(result.isFailure, isTrue);
    });
  });
}
