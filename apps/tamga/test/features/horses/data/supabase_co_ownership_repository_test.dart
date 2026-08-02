import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/horses/data/co_ownership_repository.dart';
import 'package:tamga/src/features/horses/data/supabase_co_ownership_repository.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';

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

  @override
  _FakeStreamFilter stream({
    required List<String> primaryKey,
    bool private = false,
  }) {
    capture.lastPrimaryKey = primaryKey;
    // The realtime stream always emits the initial fetch result as its first
    // event (an empty list when the table is empty).
    return _FakeStreamFilter(events: [rows]);
  }

  Object? get lastInsert => capture.lastInsert;
  Object? get lastUpsert => capture.lastUpsert;
  Map<dynamic, dynamic>? get lastUpdate => capture.lastUpdate;
  bool get lastDelete => capture.lastDelete;
  List<String>? get lastPrimaryKey => capture.lastPrimaryKey;
  _FakeFilter? get lastFilter => capture.lastFilter;
}

class _FakeQueryCapture {
  Object? lastInsert;
  Object? lastUpsert;
  Map<dynamic, dynamic>? lastUpdate;
  bool lastDelete = false;
  List<String>? lastPrimaryKey;
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
  _FakeFilter or(String filters, {String? referencedTable}) => this;

  @override
  _FakeFilter order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  _FakeFilter limit(int count, {String? referencedTable}) => this;

  @override
  _FakeFilter range(int from, int to, {String? referencedTable}) => this;

  @override
  _FakeFilter select([String columns = '*']) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) => Future<PostgrestList>.value(rows).then(onValue, onError: onError);
}

class _FakeStreamFilter extends Fake implements SupabaseStreamFilterBuilder {
  _FakeStreamFilter({required this.events});

  final List<List<Map<String, dynamic>>> events;

  @override
  _FakeStreamFilter eq(String column, Object value) => this;

  @override
  _FakeStreamFilter order(String column, {bool ascending = false}) => this;

  @override
  Stream<R> map<R>(R Function(SupabaseStreamEvent) convert) =>
      Stream.fromIterable(events).map(convert);
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> coOwnerRow({
  String id = 'co-1',
  String horseId = 'horse-1',
  String name = 'Хамтран эзэмшигч',
  String phone = '99112233',
  String role = 'Туслах уяач',
  List<String> permissions = const ['read', 'all'],
  String createdAt = '2026-01-01T00:00:00.000',
  String updatedAt = '2026-01-02T00:00:00.000',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'co_owner_name': name,
    'phone': phone,
    'role': role,
    'permissions': permissions,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

void main() {
  // The factory reads Supabase.instance.client, so the global instance must
  // be initialized once; each test then swaps in a fresh mock client.
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: 'https://test.supabase.co',
      publishableKey: 'test-key',
      authOptions: const FlutterAuthClientOptions(
        autoRefreshToken: false,
        detectSessionInUri: false,
        localStorage: EmptyLocalStorage(),
      ),
    );
  });

  late MockSupabaseClient mockClient;
  late SupabaseCoOwnershipRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    Supabase.instance.client = mockClient;
    repository = SupabaseCoOwnershipRepository();
  });

  group('SupabaseCoOwnershipRepository implements CoOwnershipRepository', () {
    test('class exists and implements CoOwnershipRepository', () {
      expect(repository, isA<CoOwnershipRepository>());
    });
  });

  group('fetchCoOwners', () {
    test('maps rows to CoOwnershipRecord field-by-field on success', () async {
      final qb = _FakeQueryBuilder(
        rows: [
          coOwnerRow(
            id: 'co-1',
            horseId: 'horse-1',
            name: 'Хамтран эзэмшигч',
            phone: '99112233',
            role: 'Эзэмшигч',
            permissions: ['read', 'write_health'],
          ),
          coOwnerRow(
            id: 'co-2',
            horseId: 'horse-1',
            name: 'Хоёр дахь эзэмшигч',
            phone: '88112233',
            role: 'Туслах уяач',
            permissions: ['read'],
            createdAt: '2026-02-01T00:00:00.000',
            updatedAt: '2026-02-02T00:00:00.000',
          ),
        ],
      );
      when(() => mockClient.from('co_ownerships')).thenAnswer((_) => qb);

      final result = await repository.fetchCoOwners('horse-1');

      expect(result.isSuccess, isTrue);
      final records = result.value;
      expect(records, hasLength(2));

      expect(records[0].id, 'co-1');
      expect(records[0].horseId, 'horse-1');
      expect(records[0].coOwnerName, 'Хамтран эзэмшигч');
      expect(records[0].phone, '99112233');
      expect(records[0].role, 'Эзэмшигч');
      expect(records[0].permissions, ['read', 'write_health']);
      expect(records[0].createdAt, DateTime(2026, 1, 1));
      expect(records[0].updatedAt, DateTime(2026, 1, 2));

      expect(records[1].id, 'co-2');
      expect(records[1].role, 'Туслах уяач');
      expect(records[1].permissions, ['read']);
    });

    test('returns empty list for empty rows', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('co_ownerships')).thenAnswer((_) => qb);

      final result = await repository.fetchCoOwners('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('co_ownerships'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.fetchCoOwners('horse-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'FETCH_CO_OWNERS_ERROR');
    });
  });

  group('saveCoOwner', () {
    test('returns NO_SUPABASE_USER without querying when no user session is '
        'resolvable', () async {
      // saveCoOwner calls ensureSupabaseUserId(), which resolves the user
      // from the global bootstrap (unconfigured under plain `flutter test`),
      // so the upsert path is unreachable here.
      final record = CoOwnershipRecord(
        id: 'co-1',
        horseId: 'horse-1',
        coOwnerName: 'Хамтран эзэмшигч',
        phone: '99112233',
        role: 'Туслах уяач',
        permissions: const ['read'],
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 1),
      );

      final result = await repository.saveCoOwner(record);

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'NO_SUPABASE_USER');
      verifyNever(() => mockClient.from('co_ownerships'));
    });
  });

  group('deleteCoOwner', () {
    test('deletes the row and returns an empty list on success', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('co_ownerships')).thenAnswer((_) => qb);

      final result = await repository.deleteCoOwner('co-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
      expect(qb.lastDelete, isTrue);
      expect(qb.lastFilter!.eqCalls, contains(('id', 'co-1')));
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('co_ownerships'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.deleteCoOwner('co-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'DELETE_CO_OWNER_ERROR');
    });
  });

  group('syncCoOwnership', () {
    test('returns 0 — cloud repo is the source of truth', () async {
      final result = await repository.syncCoOwnership();

      expect(result.isSuccess, isTrue);
      expect(result.value, 0);
    });
  });

  group('watchCoOwners', () {
    test('emits mapped CoOwnershipRecords from the realtime stream', () async {
      final qb = _FakeQueryBuilder(
        rows: [
          coOwnerRow(id: 'co-1'),
          coOwnerRow(id: 'co-2', name: 'Гурав'),
        ],
      );
      when(() => mockClient.from('co_ownerships')).thenAnswer((_) => qb);

      final events = await repository.watchCoOwners('horse-1').toList();

      expect(qb.lastPrimaryKey, ['id']);
      expect(events, hasLength(1));
      final records = events.single;
      expect(records, hasLength(2));
      expect(records[0].id, 'co-1');
      expect(records[0].horseId, 'horse-1');
      expect(records[0].coOwnerName, 'Хамтран эзэмшигч');
      expect(records[1].coOwnerName, 'Гурав');
    });

    test('emits an empty list for an empty stream payload', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('co_ownerships')).thenAnswer((_) => qb);

      final events = await repository.watchCoOwners('horse-1').toList();

      expect(events, hasLength(1));
      expect(events.single, isEmpty);
    });
  });
}
