import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/payments/data/payment_repository.dart';
import 'package:tamga/src/features/payments/data/supabase_payment_repository.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';

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

Map<String, dynamic> paymentRow({
  String id = 'pr-1',
  String userId = 'user-1',
  String tier = 'pro',
  String paymentType = 'subscription',
  String code = 'PAY-001',
  int amountMnt = 9900,
  String status = 'pending',
  String? verifiedAt,
  String? adminNotes,
}) {
  return {
    'id': id,
    'user_id': userId,
    'tier': tier,
    'payment_type': paymentType,
    'code': code,
    'amount_mnt': amountMnt,
    'status': status,
    'created_at': '2026-01-01T00:00:00.000',
    'expires_at': '2026-01-02T00:00:00.000',
    'verified_at': verifiedAt,
    'admin_notes': adminNotes,
  };
}

PaymentRequest sampleRequest() {
  return PaymentRequest(
    id: 'pr-1',
    userId: 'user-1',
    tier: SubscriptionTier.pro,
    code: 'PAY-001',
    amountMnt: 9900,
    status: PaymentStatus.pending,
    createdAt: DateTime(2026, 1, 1),
    expiresAt: DateTime(2026, 1, 2),
  );
}

void main() {
  group('SupabasePaymentRepository implements PaymentRepository', () {
    test('class exists and implements PaymentRepository', () {
      final repo = SupabasePaymentRepository(client: null);
      expect(repo, isA<PaymentRepository>());
    });
  });

  group('createPaymentRequest', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabasePaymentRepository(client: null);
      final result = await repo.createPaymentRequest(sampleRequest());
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('inserts the request and maps the returned row', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('payment_requests'),
      ).thenAnswer((_) => FakeQueryBuilder([paymentRow()], calls));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.createPaymentRequest(sampleRequest());

      expect(result.isSuccess, isTrue);
      final payment = result.value;
      expect(payment.id, 'pr-1');
      expect(payment.userId, 'user-1');
      expect(payment.tier, SubscriptionTier.pro);
      expect(payment.paymentType, PaymentType.subscription);
      expect(payment.code, 'PAY-001');
      expect(payment.amountMnt, 9900);
      expect(payment.status, PaymentStatus.pending);
      expect(payment.createdAt, DateTime.parse('2026-01-01T00:00:00.000'));
      expect(payment.expiresAt, DateTime.parse('2026-01-02T00:00:00.000'));
      expect(payment.verifiedAt, isNull);
      expect(calls, containsAllInOrder(['insert', 'select(*)', 'single']));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.createPaymentRequest(sampleRequest());

      expect(result.isFailure, isTrue);
    });
  });

  group('getPaymentStatus', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabasePaymentRepository(client: null);
      final result = await repo.getPaymentStatus('pr-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('maps the single row when found', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('payment_requests')).thenAnswer(
        (_) => FakeQueryBuilder([
          paymentRow(status: 'verified', verifiedAt: '2026-01-01T12:00:00.000'),
        ], calls),
      );

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getPaymentStatus('pr-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.status, PaymentStatus.verified);
      expect(
        result.value.verifiedAt,
        DateTime.parse('2026-01-01T12:00:00.000'),
      );
      expect(
        calls,
        containsAllInOrder(['select(*)', 'eq:id=pr-1', 'maybeSingle']),
      );
    });

    test('returns PAYMENT_NOT_FOUND when no row matches', () async {
      final mockClient = MockSupabaseClient();
      when(
        () => mockClient.from('payment_requests'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], <String>[]));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getPaymentStatus('missing');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'PAYMENT_NOT_FOUND');
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getPaymentStatus('pr-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('listUserPayments', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabasePaymentRepository(client: null);
      final result = await repo.listUserPayments('user-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('maps rows for the user ordered by created_at desc', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      final rows = [
        paymentRow(id: 'pr-1', status: 'pending'),
        paymentRow(
          id: 'pr-2',
          tier: 'breeder',
          code: 'PAY-002',
          amountMnt: 29900,
        ),
      ];
      when(
        () => mockClient.from('payment_requests'),
      ).thenAnswer((_) => FakeQueryBuilder(rows, calls));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.listUserPayments('user-1');

      expect(result.isSuccess, isTrue);
      final payments = result.value;
      expect(payments, hasLength(2));
      expect(payments[0].id, 'pr-1');
      expect(payments[1].tier, SubscriptionTier.breeder);
      expect(payments[1].amountMnt, 29900);
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:user_id=user-1',
          'order:created_at:asc=false',
        ]),
      );
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.listUserPayments('user-1');

      expect(result.isFailure, isTrue);
    });
  });

  group('updatePaymentStatus', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabasePaymentRepository(client: null);
      final result = await repo.updatePaymentStatus(
        requestId: 'pr-1',
        newStatus: PaymentStatus.verified,
      );
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('updates status and verified_at for verified payments', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('payment_requests')).thenAnswer(
        (_) => FakeQueryBuilder([
          paymentRow(status: 'verified', verifiedAt: '2026-01-01T12:00:00.000'),
        ], calls),
      );

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.updatePaymentStatus(
        requestId: 'pr-1',
        newStatus: PaymentStatus.verified,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.status, PaymentStatus.verified);
      expect(calls, contains('update:status,verified_at'));
      expect(calls, containsAllInOrder(['select(*)', 'single']));
    });

    test('includes admin notes when provided', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(() => mockClient.from('payment_requests')).thenAnswer(
        (_) => FakeQueryBuilder([paymentRow(status: 'rejected')], calls),
      );

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.updatePaymentStatus(
        requestId: 'pr-1',
        newStatus: PaymentStatus.rejected,
        adminNotes: 'Invalid transfer reference',
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.status, PaymentStatus.rejected);
      expect(calls, contains('update:status,admin_notes'));
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.updatePaymentStatus(
        requestId: 'pr-1',
        newStatus: PaymentStatus.verified,
      );

      expect(result.isFailure, isTrue);
    });
  });

  group('getActivePaymentRequest', () {
    test('returns SUPABASE_NOT_CONFIGURED when client is null', () async {
      final repo = SupabasePaymentRepository(client: null);
      final result = await repo.getActivePaymentRequest('user-1');
      expect(result.isFailure, isTrue);
      expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
    });

    test('returns the pending request when one exists', () async {
      final mockClient = MockSupabaseClient();
      final calls = <String>[];
      when(
        () => mockClient.from('payment_requests'),
      ).thenAnswer((_) => FakeQueryBuilder([paymentRow()], calls));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getActivePaymentRequest('user-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isNotNull);
      expect(result.value!.id, 'pr-1');
      expect(result.value!.status, PaymentStatus.pending);
      expect(
        calls,
        containsAllInOrder([
          'select(*)',
          'eq:user_id=user-1',
          'eq:status=pending',
          'order:created_at:asc=false',
          'maybeSingle',
        ]),
      );
      // The expires_at threshold is a UTC timestamp generated at call time.
      expect(calls.any((c) => c.startsWith('gt:expires_at=')), isTrue);
    });

    test('returns null when no active request exists', () async {
      final mockClient = MockSupabaseClient();
      when(
        () => mockClient.from('payment_requests'),
      ).thenAnswer((_) => FakeQueryBuilder(const [], <String>[]));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getActivePaymentRequest('user-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isNull);
    });

    test('returns failure when the query throws', () async {
      final mockClient = MockSupabaseClient();
      when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

      final repo = SupabasePaymentRepository(client: mockClient);
      final result = await repo.getActivePaymentRequest('user-1');

      expect(result.isFailure, isTrue);
    });
  });
}
