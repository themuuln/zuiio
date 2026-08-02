import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/nutrition/data/nutrition_repository.dart';
import 'package:tamga/src/features/nutrition/data/supabase_nutrition_repository.dart';
import 'package:tamga/src/features/nutrition/domain/feed_log.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';

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

Map<String, dynamic> feedScheduleRow({
  String id = 'fs-1',
  String horseId = 'horse-1',
  String feedType = 'hay',
  double quantityKg = 8.5,
  String frequency = 'Өдөр бүр',
  String startDate = '2026-01-01T08:00:00.000',
  String? endDate,
  String notes = 'Morning hay',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'feed_type': feedType,
    'quantity_kg': quantityKg,
    'frequency': frequency,
    'start_date': startDate,
    'end_date': endDate,
    'notes': notes,
    'created_at': '2026-01-01T08:00:00.000',
    'updated_at': '2026-01-01T08:00:00.000',
  };
}

Map<String, dynamic> feedLogRow({
  String id = 'fl-1',
  String scheduleId = 'fs-1',
  String horseId = 'horse-1',
  String date = '2026-01-15T08:00:00.000',
  double amountGiven = 6.0,
  bool skipped = false,
  String notes = '',
}) {
  return {
    'id': id,
    'schedule_id': scheduleId,
    'horse_id': horseId,
    'date': date,
    'amount_given': amountGiven,
    'skipped': skipped,
    'notes': notes,
    'created_at': '2026-01-15T08:00:00.000',
    'updated_at': '2026-01-15T08:00:00.000',
  };
}

FeedSchedule sampleFeedSchedule() {
  return FeedSchedule(
    id: 'fs-1',
    horseId: 'horse-1',
    feedType: FeedType.hay,
    quantityKg: 8.5,
    frequency: 'Өдөр бүр',
    startDate: DateTime(2026, 1, 1, 8),
    createdAt: DateTime(2026, 1, 1, 8),
    updatedAt: DateTime(2026, 1, 1, 8),
  );
}

FeedLog sampleFeedLog() {
  return FeedLog(
    id: 'fl-1',
    scheduleId: 'fs-1',
    horseId: 'horse-1',
    date: DateTime(2026, 1, 15, 8),
    amountGiven: 6.0,
    skipped: false,
    createdAt: DateTime(2026, 1, 15, 8),
    updatedAt: DateTime(2026, 1, 15, 8),
  );
}

void main() {
  group('SupabaseNutritionRepository implements NutritionRepository', () {
    test('class exists and implements NutritionRepository', () {
      final repo = SupabaseNutritionRepository(client: null);
      expect(repo, isA<NutritionRepository>());
    });
  });

  group('fetchSchedules', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.fetchSchedules('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('maps rows to FeedSchedule domain models field by field', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        feedScheduleRow(),
        feedScheduleRow(
          id: 'fs-2',
          feedType: 'grain',
          quantityKg: 2.0,
          frequency: 'Өдөрт 2 удаа',
          endDate: '2026-03-01T08:00:00.000',
          notes: 'Evening grain',
        ),
      ];
      when(
        () => mockClient.from('feed_schedules'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchSchedules('horse-1');

      expect(result.isSuccess, isTrue);
      final schedules = result.value;
      expect(schedules, hasLength(2));

      final first = schedules[0];
      expect(first.id, 'fs-1');
      expect(first.horseId, 'horse-1');
      expect(first.feedType, FeedType.hay);
      expect(first.quantityKg, 8.5);
      expect(first.frequency, 'Өдөр бүр');
      expect(first.startDate, DateTime.parse('2026-01-01T08:00:00.000'));
      expect(first.endDate, isNull);
      expect(first.notes, 'Morning hay');

      final second = schedules[1];
      expect(second.feedType, FeedType.grain);
      expect(second.quantityKg, 2.0);
      expect(second.endDate, DateTime.parse('2026-03-01T08:00:00.000'));

      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:horse_id=horse-1',
          'order:start_date:asc=false',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchSchedules('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('saveSchedule', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.saveSchedule(sampleFeedSchedule());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('refuses to save without an authenticated user', () async {
      // In the unit-test environment no Supabase session exists, so
      // currentUserId is null and the repository bails out before querying.
      final mockClient = MockSupabaseClient();
      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.saveSchedule(sampleFeedSchedule());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });
  });

  group('deleteSchedule', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.deleteSchedule('fs-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('feed_schedules'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.deleteSchedule('fs-1');

      expect(result.isSuccess, isTrue);
      expect(calls, containsAllInOrder(['delete', 'eq:id=fs-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.deleteSchedule('fs-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchLogs', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.fetchLogs('horse-1');
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('maps rows to FeedLog domain models field by field', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        feedLogRow(),
        feedLogRow(
          id: 'fl-2',
          amountGiven: 0,
          skipped: true,
          notes: 'Морины гэдэс өвдсөн',
        ),
      ];
      when(
        () => mockClient.from('feed_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchLogs('horse-1');

      expect(result.isSuccess, isTrue);
      final logs = result.value;
      expect(logs, hasLength(2));

      final first = logs[0];
      expect(first.id, 'fl-1');
      expect(first.scheduleId, 'fs-1');
      expect(first.horseId, 'horse-1');
      expect(first.date, DateTime.parse('2026-01-15T08:00:00.000'));
      expect(first.amountGiven, 6.0);
      expect(first.skipped, isFalse);
      expect(first.notes, isEmpty);

      final second = logs[1];
      expect(second.skipped, isTrue);
      expect(second.amountGiven, 0.0);
      expect(second.notes, 'Морины гэдэс өвдсөн');

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

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchLogs('horse-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('fetchLogsByDateRange', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.fetchLogsByDateRange(
        'horse-1',
        DateTime(2026, 1, 1),
        DateTime(2026, 1, 31),
      );
      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('filters by horse id and date range with ascending order', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('feed_logs'),
      ).thenAnswer((_) => FakeQueryBuilder([feedLogRow()], calls));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchLogsByDateRange(
        'horse-1',
        DateTime(2026, 1, 1, 8),
        DateTime(2026, 1, 31, 8),
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.first.id, 'fl-1');
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:horse_id=horse-1',
          'gte:date=2026-01-01T08:00:00.000',
          'lte:date=2026-01-31T08:00:00.000',
          'order:date:asc=true',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.fetchLogsByDateRange(
        'horse-1',
        DateTime(2026, 1, 1),
        DateTime(2026, 1, 31),
      );

      expect(result.isFailure, isTrue);
    });
  });

  group('saveLog', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.saveLog(sampleFeedLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('refuses to save without an authenticated user', () async {
      final mockClient = MockSupabaseClient();
      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.saveLog(sampleFeedLog());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });
  });

  group('deleteLog', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabaseNutritionRepository(client: null);
      final result = await repo.deleteLog('fl-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('deletes the matching row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('feed_logs'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], calls));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.deleteLog('fl-1');

      expect(result.isSuccess, isTrue);
      expect(calls, containsAllInOrder(['delete', 'eq:id=fl-1']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabaseNutritionRepository(client: mockClient);
      final result = await repo.deleteLog('fl-1');

      expect(result.isFailure, isTrue);
    });
  });
}
