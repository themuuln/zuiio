import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/horses/data/horse_transfer_repository.dart';
import 'package:tamga/src/features/horses/data/supabase_horse_transfer_repository.dart';
import 'package:tamga/src/features/horses/domain/horse_transfer.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// PostgrestFilterBuilder / SupabaseQueryBuilder implement Future<T>, so
// mocktail's thenReturn cannot be used on the terminal link of a chain.
// These fakes model the chain with real method bodies; the terminal await
// resolves to the configured rows via an explicit `then` override.

class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({this.rows = const [], this.singleRow})
    : capture = _FakeQueryCapture();

  /// Rows yielded when a chain built from this builder is awaited directly.
  final List<Map<String, dynamic>> rows;

  /// Row yielded by the `maybeSingle` terminal of a chain.
  final Map<String, dynamic>? singleRow;

  final _FakeQueryCapture capture;

  _FakeFilter _newFilter() {
    final filter = _FakeFilter(rows: rows, singleRow: singleRow);
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
  _FakeFilter({required this.rows, this.singleRow});

  final List<Map<String, dynamic>> rows;
  final Map<String, dynamic>? singleRow;

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
  _FakeMaybeSingle maybeSingle() => _FakeMaybeSingle(singleRow);

  @override
  _FakeSingle single() => _FakeSingle(singleRow ?? const <String, dynamic>{});

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) => Future<PostgrestList>.value(rows).then(onValue, onError: onError);
}

class _FakeMaybeSingle extends Fake
    implements PostgrestTransformBuilder<PostgrestMap?> {
  _FakeMaybeSingle(this.row);

  final Map<String, dynamic>? row;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestMap?) onValue, {
    Function? onError,
  }) => Future<PostgrestMap?>.value(row).then(onValue, onError: onError);
}

class _FakeSingle extends Fake
    implements PostgrestTransformBuilder<PostgrestMap> {
  _FakeSingle(this.row);

  final Map<String, dynamic> row;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestMap) onValue, {
    Function? onError,
  }) => Future<PostgrestMap>.value(row).then(onValue, onError: onError);
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> transferRow({
  String id = 't-1',
  String horseId = 'horse-1',
  String fromOwnerId = 'owner-1',
  String fromOwnerName = 'Өмнөх эзэн',
  String toOwnerId = 'owner-2',
  String toOwnerName = 'Шинэ эзэн',
  String transferDate = '2026-01-01T00:00:00.000',
  double? price = 1500000,
  String notes = 'Гэрээгээр',
  bool isVerified = true,
  String? verifiedAt = '2026-01-02T00:00:00.000',
  String? verifiedBy = 'official-1',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'from_owner_id': fromOwnerId,
    'from_owner_name': fromOwnerName,
    'to_owner_id': toOwnerId,
    'to_owner_name': toOwnerName,
    'transfer_date': transferDate,
    'price': price,
    'notes': notes,
    'is_verified': isVerified,
    'verified_at': verifiedAt,
    'verified_by': verifiedBy,
  };
}

HorseTransfer sampleTransfer({
  String id = 't-1',
  String horseId = 'horse-1',
  String fromOwnerId = 'owner-1',
  String fromOwnerName = 'Өмнөх эзэн',
  String toOwnerId = 'owner-2',
  String toOwnerName = 'Шинэ эзэн',
  DateTime? transferDate,
  double? price = 1500000,
  String notes = 'Гэрээгээр',
  bool isVerified = false,
}) {
  return HorseTransfer(
    id: id,
    horseId: horseId,
    fromOwnerId: fromOwnerId,
    fromOwnerName: fromOwnerName,
    toOwnerId: toOwnerId,
    toOwnerName: toOwnerName,
    transferDate: transferDate ?? DateTime(2026, 1, 1),
    price: price,
    notes: notes,
    isVerified: isVerified,
  );
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
  late SupabaseHorseTransferRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    Supabase.instance.client = mockClient;
    repository = SupabaseHorseTransferRepository();
  });

  group(
    'SupabaseHorseTransferRepository implements HorseTransferRepository',
    () {
      test('class exists and implements HorseTransferRepository', () {
        expect(repository, isA<HorseTransferRepository>());
      });
    },
  );

  group('fetchTransferHistory', () {
    test('maps rows to HorseTransfer field-by-field on success', () async {
      final qb = _FakeQueryBuilder(
        rows: [
          transferRow(
            id: 't-1',
            fromOwnerId: 'owner-1',
            fromOwnerName: 'Өмнөх эзэн',
            toOwnerId: 'owner-2',
            toOwnerName: 'Шинэ эзэн',
            transferDate: '2025-06-01T00:00:00.000',
            price: 2500000.5,
            notes: 'Гэрээгээр шилжүүлсэн',
            isVerified: true,
            verifiedAt: '2025-06-15T00:00:00.000',
            verifiedBy: 'official-7',
          ),
          transferRow(
            id: 't-2',
            fromOwnerId: 'owner-2',
            toOwnerId: 'owner-3',
            transferDate: '2026-03-01T00:00:00.000',
            price: null,
            notes: '',
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
          ),
        ],
      );
      when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);

      final result = await repository.fetchTransferHistory('horse-1');

      expect(result.isSuccess, isTrue);
      final history = result.value;
      expect(history.horseId, 'horse-1');
      expect(history.transfers, hasLength(2));

      final first = history.transfers[0];
      expect(first.id, 't-1');
      expect(first.horseId, 'horse-1');
      expect(first.fromOwnerId, 'owner-1');
      expect(first.fromOwnerName, 'Өмнөх эзэн');
      expect(first.toOwnerId, 'owner-2');
      expect(first.toOwnerName, 'Шинэ эзэн');
      expect(first.transferDate, DateTime(2025, 6, 1));
      expect(first.price, 2500000.5);
      expect(first.notes, 'Гэрээгээр шилжүүлсэн');
      expect(first.isVerified, isTrue);
      expect(first.verifiedAt, DateTime(2025, 6, 15));
      expect(first.verifiedBy, 'official-7');

      final second = history.transfers[1];
      expect(second.price, isNull);
      expect(second.verifiedAt, isNull);
      expect(second.verifiedBy, isNull);
      expect(second.isVerified, isFalse);
    });

    test('returns empty history for empty rows', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);

      final result = await repository.fetchTransferHistory('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.horseId, 'horse-1');
      expect(result.value.transfers, isEmpty);
      expect(result.value.transferCount, 0);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('horse_transfers'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.fetchTransferHistory('horse-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'FETCH_TRANSFER_HISTORY_ERROR');
    });
  });

  group('createTransfer', () {
    test('inserts the row and returns the transfer on success', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);
      final transfer = sampleTransfer(price: 3000000, notes: 'Бэлнээр');

      final result = await repository.createTransfer(transfer);

      expect(result.isSuccess, isTrue);
      expect(result.value, same(transfer));

      final data = qb.lastInsert as Map<String, dynamic>;
      expect(data['id'], 't-1');
      expect(data['horse_id'], 'horse-1');
      expect(data['from_owner_id'], 'owner-1');
      expect(data['from_owner_name'], 'Өмнөх эзэн');
      expect(data['to_owner_id'], 'owner-2');
      expect(data['to_owner_name'], 'Шинэ эзэн');
      expect(data['transfer_date'], '2026-01-01T00:00:00.000');
      expect(data['price'], 3000000);
      expect(data['notes'], 'Бэлнээр');
      expect(data['is_verified'], isFalse);
    });

    test('returns failure when the insert throws', () async {
      when(
        () => mockClient.from('horse_transfers'),
      ).thenThrow(Exception('DB error'));

      final result = await repository.createTransfer(sampleTransfer());

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'CREATE_TRANSFER_ERROR');
    });
  });

  group('verifyTransfer', () {
    test(
      'updates the row and returns a verified transfer on success',
      () async {
        final qb = _FakeQueryBuilder(rows: const []);
        when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);

        final result = await repository.verifyTransfer(
          transferId: 't-1',
          verifiedBy: 'verifier-1',
        );

        expect(result.isSuccess, isTrue);
        final transfer = result.value;
        expect(transfer.id, 't-1');
        expect(transfer.isVerified, isTrue);
        expect(transfer.verifiedBy, 'verifier-1');
        expect(transfer.verifiedAt, isNotNull);

        final data = qb.lastUpdate!;
        expect(data['is_verified'], isTrue);
        expect(data['verified_by'], 'verifier-1');
        expect(data['verified_at'], isA<String>());
        expect(qb.lastFilter!.eqCalls, contains(('id', 't-1')));
      },
    );

    test('returns failure when the update throws', () async {
      when(
        () => mockClient.from('horse_transfers'),
      ).thenThrow(Exception('DB error'));

      final result = await repository.verifyTransfer(
        transferId: 't-1',
        verifiedBy: 'verifier-1',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'VERIFY_TRANSFER_ERROR');
    });
  });

  group('getCurrentOwnerId', () {
    test('returns the latest to_owner_id on success', () async {
      final qb = _FakeQueryBuilder(singleRow: {'to_owner_id': 'owner-3'});
      when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);

      final result = await repository.getCurrentOwnerId('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, 'owner-3');
      expect(qb.lastFilter!.eqCalls, contains(('horse_id', 'horse-1')));
    });

    test('returns null when no transfer row exists', () async {
      final qb = _FakeQueryBuilder(singleRow: null);
      when(() => mockClient.from('horse_transfers')).thenAnswer((_) => qb);

      final result = await repository.getCurrentOwnerId('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isNull);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('horse_transfers'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.getCurrentOwnerId('horse-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'GET_CURRENT_OWNER_ERROR');
    });
  });
}
