import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:tamga/src/features/map/data/sighting_repository.dart';
import 'package:tamga/src/features/map/data/supabase_sighting_repository.dart';
import 'package:tamga/src/features/map/domain/sighting_report.dart';

// ── Mocks ────────────────────────────────────────────────────────────────

class _MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Fake Supabase builders ───────────────────────────────────────────────
//
// PostgrestBuilder implements Future<T>, so awaiting a builder resolves
// through its `then`. These fakes let a whole query chain resolve to a
// preset value without touching mocktail's builder state.

class _FakeListFilter extends Fake
    implements PostgrestFilterBuilder<List<Map<String, dynamic>>> {
  _FakeListFilter({
    required List<Map<String, dynamic>> rows,
    Map<String, dynamic>? singleRow,
  }) : _rows = rows,
       _singleRow = singleRow ?? const <String, dynamic>{};

  final List<Map<String, dynamic>> _rows;
  final Map<String, dynamic> _singleRow;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> eq(
    String column,
    Object value,
  ) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> limit(
    int count, {
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> inFilter(
    String column,
    List values,
  ) => this;

  @override
  PostgrestTransformBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => this;

  @override
  PostgrestTransformBuilder<Map<String, dynamic>> single() =>
      _FakeMapFilter(row: _singleRow);

  @override
  PostgrestTransformBuilder<Map<String, dynamic>?> maybeSingle() =>
      _FakeMapFilter(row: _singleRow);

  @override
  Future<R> then<R>(
    FutureOr<R> Function(List<Map<String, dynamic>> value) onValue, {
    Function? onError,
  }) => Future.value(_rows).then(onValue, onError: onError);

  @override
  Future<List<Map<String, dynamic>>> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) => Future.value(_rows).catchError(onError, test: test);

  @override
  Future<List<Map<String, dynamic>>> whenComplete(
    FutureOr<void> Function() action,
  ) => Future.value(_rows).whenComplete(action);

  @override
  Stream<List<Map<String, dynamic>>> asStream() => Stream.value(_rows);

  @override
  Future<List<Map<String, dynamic>>> timeout(
    Duration timeLimit, {
    FutureOr<List<Map<String, dynamic>>> Function()? onTimeout,
  }) => Future.value(_rows).timeout(timeLimit, onTimeout: onTimeout);
}

class _FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>> {
  _FakeMapFilter({Map<String, dynamic>? row})
    : _row = row ?? const <String, dynamic>{};

  final Map<String, dynamic> _row;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> eq(
    String column,
    Object value,
  ) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> limit(
    int count, {
    String? referencedTable,
  }) => this;

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> inFilter(
    String column,
    List values,
  ) => this;

  @override
  PostgrestTransformBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => _FakeListFilter(rows: const [], singleRow: _row);

  @override
  PostgrestTransformBuilder<Map<String, dynamic>> single() => this;

  @override
  PostgrestTransformBuilder<Map<String, dynamic>?> maybeSingle() => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic> value) onValue, {
    Function? onError,
  }) => Future.value(_row).then(onValue, onError: onError);

  @override
  Future<Map<String, dynamic>> catchError(
    Function onError, {
    bool Function(Object error)? test,
  }) => Future.value(_row).catchError(onError, test: test);

  @override
  Future<Map<String, dynamic>> whenComplete(FutureOr<void> Function() action) =>
      Future.value(_row).whenComplete(action);

  @override
  Stream<Map<String, dynamic>> asStream() => Stream.value(_row);

  @override
  Future<Map<String, dynamic>> timeout(
    Duration timeLimit, {
    FutureOr<Map<String, dynamic>> Function()? onTimeout,
  }) => Future.value(_row).timeout(timeLimit, onTimeout: onTimeout);
}

class _FakeStreamBuilder extends Fake implements SupabaseStreamFilterBuilder {
  _FakeStreamBuilder(this.rows);

  final List<Map<String, dynamic>> rows;

  @override
  SupabaseStreamBuilder eq(String column, Object value) => this;

  @override
  SupabaseStreamBuilder order(String column, {bool ascending = false}) => this;

  @override
  Stream<R> map<R>(R Function(List<Map<String, dynamic>> event) convert) =>
      Stream.value(convert(rows));
}

// ignore: must_be_immutable
class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({
    this.rows = const [],
    Map<String, dynamic>? singleRow,
    this.streamRows = const [],
  }) : singleRow = singleRow ?? const <String, dynamic>{};

  final List<Map<String, dynamic>> rows;
  Map<String, dynamic> singleRow;
  final List<Map<String, dynamic>> streamRows;

  /// Payload captured from the last [insert]/[update]/[delete] call.
  Object? lastInsert;
  Object? lastUpdate;

  @override
  PostgrestFilterBuilder<List<Map<String, dynamic>>> select([
    String columns = '*',
  ]) => _FakeListFilter(rows: rows, singleRow: singleRow);

  @override
  PostgrestFilterBuilder<dynamic> insert(
    Object values, {
    bool defaultToNull = true,
  }) {
    lastInsert = values;
    return _FakeMapFilter(row: singleRow);
  }

  @override
  PostgrestFilterBuilder<dynamic> update(Map values) {
    lastUpdate = values;
    return _FakeMapFilter(row: singleRow);
  }

  @override
  PostgrestFilterBuilder<dynamic> delete() => _FakeMapFilter(row: singleRow);

  @override
  PostgrestFilterBuilder<dynamic> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) => _FakeMapFilter(row: singleRow);

  @override
  SupabaseStreamFilterBuilder stream({
    required List<String> primaryKey,
    bool private = false,
  }) => _FakeStreamBuilder(streamRows);
}

// ── Row fixture ──────────────────────────────────────────────────────────

Map<String, dynamic> sightingRow({
  String id = 's1',
  String reportId = 'r1',
  String reporterId = 'u1',
  String status = 'pending',
}) {
  return {
    'id': id,
    'report_id': reportId,
    'reporter_id': reporterId,
    'lat': 47.85,
    'lng': 106.92,
    'location_name': 'Bridge area',
    'description': 'Saw a bay horse',
    'photo_url': null,
    'client_id': null,
    'reviewed_at': null,
    'reviewed_by': null,
    'is_anonymous': false,
    'status': status,
    'created_at': '2026-06-02T08:00:00.000',
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

void main() {
  late _MockSupabaseClient client;

  setUp(() {
    client = _MockSupabaseClient();
  });

  SupabaseSightingRepository repo() =>
      SupabaseSightingRepository(client: client);

  _FakeQueryBuilder stubSightingsTable({
    List<Map<String, dynamic>> rows = const [],
    Map<String, dynamic>? singleRow,
    List<Map<String, dynamic>> streamRows = const [],
  }) {
    final table = _FakeQueryBuilder(
      rows: rows,
      singleRow: singleRow,
      streamRows: streamRows,
    );
    when(() => client.from('lost_horse_sightings')).thenAnswer((_) => table);
    return table;
  }

  group('SupabaseSightingRepository', () {
    test('implements SightingRepository', () {
      expect(repo(), isA<SightingRepository>());
    });

    // ── reportSighting ────────────────────────────────────────────

    group('reportSighting', () {
      test(
        'inserts the sighting without an id and returns the saved row',
        () async {
          final row = sightingRow();
          final table = stubSightingsTable(rows: [row], singleRow: row);

          final result = await repo().reportSighting(
            SightingReport.fromJson(row),
          );

          expect(result.isSuccess, isTrue);
          final saved = result.value;
          expect(saved.id, 's1');
          expect(saved.reportId, 'r1');
          expect(saved.reporterId, 'u1');
          expect(saved.lat, 47.85);
          expect(saved.lng, 106.92);
          expect(saved.locationName, 'Bridge area');
          expect(saved.description, 'Saw a bay horse');
          expect(saved.status, SightingStatus.pending);
          expect(saved.createdAt, DateTime.parse('2026-06-02T08:00:00.000'));

          final payload = table.lastInsert! as Map<String, dynamic>;
          expect(payload.containsKey('id'), isFalse);
          expect(payload['report_id'], 'r1');
          expect(payload['reporter_id'], 'u1');
        },
      );

      test('returns SIGHTING_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().reportSighting(
          SightingReport.fromJson(sightingRow()),
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_FAILED');
      });
    });

    // ── getSightingsForReport ─────────────────────────────────────

    group('getSightingsForReport', () {
      test('maps rows to sightings', () async {
        final s1 = sightingRow(id: 's1');
        final s2 = sightingRow(id: 's2', reporterId: 'u2');
        stubSightingsTable(rows: [s1, s2], singleRow: s1);

        final result = await repo().getSightingsForReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value[0].id, 's1');
        expect(result.value[0].reportId, 'r1');
        expect(result.value[0].lat, 47.85);
        expect(result.value[1].id, 's2');
        expect(result.value[1].reporterId, 'u2');
      });

      test('returns an empty list when there are no rows', () async {
        stubSightingsTable();

        final result = await repo().getSightingsForReport('r1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns FETCH_SIGHTINGS_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getSightingsForReport('r1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_SIGHTINGS_FAILED');
      });
    });

    // ── getMySightings ────────────────────────────────────────────

    group('getMySightings', () {
      test('maps rows to sightings', () async {
        final s1 = sightingRow(id: 's1');
        stubSightingsTable(rows: [s1], singleRow: s1);

        final result = await repo().getMySightings('u1');

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(1));
        expect(result.value.single.id, 's1');
        expect(result.value.single.reporterId, 'u1');
      });

      test('returns an empty list when there are no rows', () async {
        stubSightingsTable();

        final result = await repo().getMySightings('u1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('returns FETCH_MY_SIGHTINGS_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().getMySightings('u1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'FETCH_MY_SIGHTINGS_FAILED');
      });
    });

    // ── updateSightingStatus ──────────────────────────────────────

    group('updateSightingStatus', () {
      test('updates the status column', () async {
        final table = stubSightingsTable();

        final result = await repo().updateSightingStatus('s1', 'confirmed');

        expect(result.isSuccess, isTrue);
        expect(table.lastUpdate, {'status': 'confirmed'});
      });

      test('returns SIGHTING_STATUS_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().updateSightingStatus('s1', 'confirmed');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SIGHTING_STATUS_FAILED');
      });
    });

    // ── deleteSighting ────────────────────────────────────────────

    group('deleteSighting', () {
      test('deletes the sighting row', () async {
        stubSightingsTable();

        final result = await repo().deleteSighting('s1');

        expect(result.isSuccess, isTrue);
      });

      test('returns DELETE_SIGHTING_FAILED when the query throws', () async {
        when(() => client.from(any())).thenThrow(Exception('boom'));

        final result = await repo().deleteSighting('s1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'DELETE_SIGHTING_FAILED');
      });
    });

    // ── watchSightingsForReport ───────────────────────────────────

    group('watchSightingsForReport', () {
      test('emits mapped sightings from the realtime stream', () async {
        final s1 = sightingRow(id: 's1');
        stubSightingsTable(streamRows: [s1]);

        final stream = repo().watchSightingsForReport('r1');

        final first = await stream.first.timeout(const Duration(seconds: 3));
        expect(first, hasLength(1));
        expect(first.single.id, 's1');
        expect(first.single.reportId, 'r1');
        expect(first.single.lat, 47.85);
      });
    });
  });
}
