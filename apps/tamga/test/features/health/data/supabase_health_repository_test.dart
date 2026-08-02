import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/health/data/health_repository.dart';
import 'package:tamga/src/features/health/data/supabase_health_repository.dart';
import 'package:tamga/src/shared/domain/health_log.dart';

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

Map<String, dynamic> healthLogRow({
  String id = 'hl-1',
  String horseId = 'horse-1',
  String logType = 'vaccination',
  String? date = '2026-01-15T10:00:00.000',
  String notes = 'Rabies booster',
  String? medicament = 'Rabisin',
  double? cost = 15000.0,
  String? farrierName,
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'log_type': logType,
    'date': date,
    'notes': notes,
    'medicament': medicament,
    'cost': cost,
    'farrier_name': farrierName,
    'created_at': '2026-01-15T10:00:00.000',
    'updated_at': '2026-01-15T10:00:00.000',
  };
}

HealthLog sampleHealthLog() {
  return HealthLog(
    id: 'hl-1',
    horseId: 'horse-1',
    logType: LogType.vaccination,
    date: DateTime(2026, 1, 15, 10),
    notes: 'Rabies booster',
    medicament: 'Rabisin',
    cost: 15000.0,
    createdAt: DateTime(2026, 1, 15, 10),
    updatedAt: DateTime(2026, 1, 15, 10),
  );
}

void main() {
  group('SupabaseHealthRepository implements HealthRepository', () {
    test('class exists and implements HealthRepository', () {
      final repo = SupabaseHealthRepository(client: null);
      expect(repo, isA<HealthRepository>());
    });
  });

  group('fetchAll', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.fetchAll();
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns empty list when no rows match', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAll();

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
      expect(calls, containsAllInOrder(['select(*)', 'order:date:asc=false']));
    });

    test('maps rows to HealthLog domain models field by field', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        healthLogRow(
          id: 'hl-1',
          horseId: 'horse-1',
          logType: 'deworming',
          notes: 'Praziquantel',
          medicament: 'Praziquantel',
          cost: 8000.0,
        ),
        healthLogRow(
          id: 'hl-2',
          horseId: 'horse-2',
          logType: 'shoeing',
          notes: 'Front shoes',
          medicament: null,
          cost: null,
          farrierName: 'Бат',
          date: null,
        ),
      ];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAll();

      expect(result.isSuccess, isTrue);
      final logs = result.value;
      expect(logs, hasLength(2));

      final first = logs[0];
      expect(first.id, 'hl-1');
      expect(first.horseId, 'horse-1');
      expect(first.logType, LogType.deworming);
      expect(first.date, DateTime.parse('2026-01-15T10:00:00.000'));
      expect(first.notes, 'Praziquantel');
      expect(first.medicament, 'Praziquantel');
      expect(first.cost, 8000.0);
      expect(first.farrierName, isNull);

      final second = logs[1];
      expect(second.logType, LogType.shoeing);
      expect(second.date, isNull);
      expect(second.medicament, isNull);
      expect(second.cost, isNull);
      expect(second.farrierName, 'Бат');
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('Network error'));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAll();

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });

    test('preserves PostgrestException code when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(
        () => mockClient.from(any()),
      ).thenThrow(PostgrestException(message: 'not found', code: 'PGRST116'));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAll();

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'PGRST116');
    });
  });

  group('fetchMedicalLogs', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.fetchMedicalLogs('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('filters by horse and medical log type', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder([healthLogRow()], calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchMedicalLogs('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, hasLength(1));
      expect(result.value.first.id, 'hl-1');
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:horse_id=horse-1',
          'eq:log_type=medical',
          'order:date:asc=false',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchMedicalLogs('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchAllByHorse', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.fetchAllByHorse('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('filters by horse id and maps rows', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder([healthLogRow()], calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAllByHorse('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.first.horseId, 'horse-1');
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

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAllByHorse('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('saveHealthLog', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.saveHealthLog(sampleHealthLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('refuses to save without an authenticated user', () async {
      // In the unit-test environment no Supabase session exists, so
      // currentUserId is null and the repository bails out before querying.
      final mockClient = MockSupabaseClient();
      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.saveHealthLog(sampleHealthLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });
  });

  group('deleteHealthLog', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.deleteHealthLog('horse-1', 'hl-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.deleteHealthLog('horse-1', 'hl-1');

      expect(result.isSuccess, isTrue);
      expect(
        calls,
        containsAllInOrder(['delete', 'eq:id=hl-1', 'eq:horse_id=horse-1']),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.deleteHealthLog('horse-1', 'hl-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchAllByHorsePaginated', () {
    test('returns empty page when Supabase client is null', () async {
      final repo = SupabaseHealthRepository(client: null);
      final result = await repo.fetchAllByHorsePaginated(
        horseId: 'horse-1',
        page: 1,
        limit: 20,
      );
      expect(result.isSuccess, isTrue);
      expect(result.value.items, isEmpty);
      expect(result.value.totalCount, 0);
    });

    test('returns items with the total count from the count query', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('health_logs')).thenAnswer(
        (_) => FakeQueryBuilder([healthLogRow()], calls, totalCount: 42),
      );

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAllByHorsePaginated(
        horseId: 'horse-1',
        page: 1,
        limit: 20,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.items, hasLength(1));
      expect(result.value.items.first.id, 'hl-1');
      expect(result.value.totalCount, 42);
      expect(
        calls,
        containsAllInOrder([
          'select(id)',
          'eq:horse_id=horse-1',
          'count',
          'select(*)',
          'eq:horse_id=horse-1',
          'order:date:asc=false',
          'range:0-19',
        ]),
      );
    });

    test('computes the correct offset for later pages', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('health_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAllByHorsePaginated(
        horseId: 'horse-1',
        page: 3,
        limit: 10,
      );

      expect(result.isSuccess, isTrue);
      expect(calls, contains('range:20-29'));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseHealthRepository(client: mockClient);
      final result = await repo.fetchAllByHorsePaginated(
        horseId: 'horse-1',
        page: 1,
        limit: 20,
      );

      expect(result.isFailure, isTrue);
    });
  });
}
