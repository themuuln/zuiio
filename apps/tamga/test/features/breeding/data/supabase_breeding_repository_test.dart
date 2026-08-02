import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/breeding/data/supabase_breeding_repository.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// PostgrestFilterBuilder / SupabaseQueryBuilder implement Future<T>, so
// mocktail's thenReturn cannot be used on the terminal link of a chain.
// These fakes model the chain with real method bodies; the terminal await
// resolves to the configured rows via an explicit `then` override.

class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({this.rows = const []}) : capture = _FakeQueryCapture();

  /// Rows yielded when a chain built from this builder is awaited directly.
  final List<Map<String, dynamic>> rows;

  final _FakeQueryCapture capture;

  _FakeFilter _newFilter() {
    final filter = _FakeFilter(rows: rows);
    capture.lastFilter = filter;
    return filter;
  }

  @override
  _FakeFilter select([String columns = '*']) => _newFilter();

  @override
  _FakeFilter insert(Object values, {bool defaultToNull = true}) {
    capture.lastInsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    capture.lastUpsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter update(Map values) {
    capture.lastUpdate = values;
    return _newFilter();
  }

  @override
  _FakeFilter delete() {
    capture.lastDelete = true;
    return _newFilter();
  }

  Object? get lastInsert => capture.lastInsert;
  Object? get lastUpsert => capture.lastUpsert;
  Map<dynamic, dynamic>? get lastUpdate => capture.lastUpdate;
  bool get lastDelete => capture.lastDelete;
  _FakeFilter? get lastFilter => capture.lastFilter;
}

class _FakeQueryCapture {
  Object? lastInsert;
  Object? lastUpsert;
  Map<dynamic, dynamic>? lastUpdate;
  bool lastDelete = false;
  _FakeFilter? lastFilter;
}

class _FakeFilter extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  _FakeFilter({required this.rows});

  final List<Map<String, dynamic>> rows;

  final List<(String, Object)> eqCalls = [];

  @override
  _FakeFilter eq(String column, Object value) {
    eqCalls.add((column, value));
    return this;
  }

  @override
  _FakeFilter order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) => Future<PostgrestList>.value(rows).then(onValue, onError: onError);
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> breedingRow({
  String id = 'br-1',
  String sireId = 'sire-1',
  String sireName = 'Азарга',
  String damId = 'dam-1',
  String damName = 'Гүү',
  String breedingDate = '2025-06-01T00:00:00.000',
  String expectedFoalingDate = '2026-05-07T00:00:00.000',
  String status = 'Хээлтсэн',
  String herdLabel = 'Test Herd',
  String notes = 'Тэмдэглэл',
  String? actualFoalingDate,
  String? foalId,
  String? foalName,
  String? foalGender,
  String? foalColor,
}) {
  return {
    'id': id,
    'sire_id': sireId,
    'sire_name': sireName,
    'dam_id': damId,
    'dam_name': damName,
    'breeding_date': breedingDate,
    'expected_foaling_date': expectedFoalingDate,
    'status': status,
    'herd_label': herdLabel,
    'notes': notes,
    'actual_foaling_date': actualFoalingDate,
    'foal_id': foalId,
    'foal_name': foalName,
    'foal_gender': foalGender,
    'foal_color': foalColor,
    'created_at': '2025-06-01T00:00:00.000',
    'updated_at': '2025-06-01T00:00:00.000',
  };
}

BreedingRecord sampleRecord() {
  return BreedingRecord(
    id: 'br-1',
    sireId: 'sire-1',
    sireName: 'Азарга',
    damId: 'dam-1',
    damName: 'Гүү',
    breedingDate: DateTime(2025, 6, 1),
    expectedFoalingDate: DateTime(2026, 5, 7),
    status: 'Хээлтсэн',
    herdLabel: 'Test Herd',
    notes: 'Тэмдэглэл',
    createdAt: DateTime(2025, 6, 1),
    updatedAt: DateTime(2025, 6, 1),
  );
}

void main() {
  // ── Testability note ─────────────────────────────────────────────────
  //
  // list/create/update gate on `currentUserId` (SupabaseRepositoryMixin),
  // which resolves the user from the GLOBAL Supabase bootstrap and ignores
  // the injected client. Under plain `flutter test` the global client is
  // unconfigured (the runtime `.env` asset is not bundled with tests), so
  // those methods hit their early-return branches and their query chains are
  // unreachable here.
  // delete() does not gate on the user and is fully exercised below.

  group('SupabaseBreedingRepository', () {
    test('class exists', () {
      final repo = SupabaseBreedingRepository(client: null);
      expect(repo, isNotNull);
    });
  });

  group('list', () {
    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseBreedingRepository(client: null);

      final result = await repo.list();

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test(
      'returns empty list without querying when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseBreedingRepository(client: mockClient);

        final result = await repo.list();

        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
        verifyNever(() => mockClient.from('breeding_records'));
      },
    );
  });

  group('create', () {
    test(
      'returns SUPABASE_NOT_CONFIGURED when Supabase client is null',
      () async {
        final repo = SupabaseBreedingRepository(client: null);

        final result = await repo.create(sampleRecord());

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      'returns SUPABASE_NOT_CONFIGURED when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseBreedingRepository(client: mockClient);

        final result = await repo.create(sampleRecord());

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
        verifyNever(() => mockClient.from('breeding_records'));
      },
    );
  });

  group('update', () {
    test(
      'returns SUPABASE_NOT_CONFIGURED when Supabase client is null',
      () async {
        final repo = SupabaseBreedingRepository(client: null);

        final result = await repo.update(sampleRecord());

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test(
      'returns SUPABASE_NOT_CONFIGURED when no user session is resolvable',
      () async {
        final mockClient = MockSupabaseClient();
        final repo = SupabaseBreedingRepository(client: mockClient);

        final result = await repo.update(sampleRecord());

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
        verifyNever(() => mockClient.from('breeding_records'));
      },
    );
  });

  group('delete', () {
    test('deletes the row and returns success', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from('breeding_records')).thenAnswer((_) => qb);
      final repo = SupabaseBreedingRepository(client: mockClient);

      final result = await repo.delete('br-1');

      expect(result.isSuccess, isTrue);
      expect(qb.lastDelete, isTrue);
      expect(qb.lastFilter!.eqCalls, contains(('id', 'br-1')));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(
        () => mockClient.from('breeding_records'),
      ).thenThrow(Exception('Network error'));
      final repo = SupabaseBreedingRepository(client: mockClient);

      final result = await repo.delete('br-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  // ── Data mapping ────────────────────────────────────────────────────
  //
  // list() maps Supabase rows through BreedingRecord.fromSupabaseJson; the
  // query path is unreachable under plain `flutter test` (see note above),
  // so the mapping contract the repository relies on is pinned directly.

  group('BreedingRecord.fromSupabaseJson mapping', () {
    test('maps a Supabase row field-by-field', () {
      final record = BreedingRecord.fromSupabaseJson(
        breedingRow(
          id: 'br-2',
          sireName: 'Хурдны Азарга',
          status: 'Төллөсөн',
          actualFoalingDate: '2026-04-20T00:00:00.000',
          foalId: 'foal-1',
          foalName: 'Унага',
          foalGender: 'mare',
          foalColor: 'Хээр',
        ),
      );

      expect(record.id, 'br-2');
      expect(record.sireId, 'sire-1');
      expect(record.sireName, 'Хурдны Азарга');
      expect(record.damId, 'dam-1');
      expect(record.damName, 'Гүү');
      expect(record.breedingDate, DateTime(2025, 6, 1));
      expect(record.expectedFoalingDate, DateTime(2026, 5, 7));
      expect(record.status, 'Төллөсөн');
      expect(record.herdLabel, 'Test Herd');
      expect(record.notes, 'Тэмдэглэл');
      expect(record.actualFoalingDate, DateTime(2026, 4, 20));
      expect(record.foalId, 'foal-1');
      expect(record.foalName, 'Унага');
      expect(record.foalGender, 'mare');
      expect(record.foalColor, 'Хээр');
    });

    test('applies defaults for missing optional fields', () {
      // `sire_id` / `dam_id` are required by the model; optional fields default.
      final record = BreedingRecord.fromSupabaseJson({
        'id': 'min-1',
        'sire_id': 's-1',
        'dam_id': 'd-1',
      });

      expect(record.id, 'min-1');
      expect(record.sireId, 's-1');
      expect(record.sireName, '');
      expect(record.damId, 'd-1');
      expect(record.damName, '');
      expect(record.status, 'Хээлтсэн');
      expect(record.actualFoalingDate, isNull);
      expect(record.foalId, isNull);
    });
  });
}
