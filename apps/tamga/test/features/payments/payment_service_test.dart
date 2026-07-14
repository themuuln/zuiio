import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/payments/data/payment_repository.dart';
import 'package:tamga/src/features/payments/data/payment_service.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';

// ── Mock ──────────────────────────────────────────────────────────

class MockPaymentRepository extends Mock implements PaymentRepository {}

void main() {
  setUpAll(() {
    registerFallbackValue(
      PaymentRequest(
        id: '',
        userId: '',
        tier: SubscriptionTier.free,
        code: '',
        amountMnt: 0,
        status: PaymentStatus.pending,
        createdAt: DateTime.utc(2026),
        expiresAt: DateTime.utc(2026),
      ),
    );
  });

  late MockPaymentRepository mockRepository;
  late PaymentService service;

  setUp(() {
    mockRepository = MockPaymentRepository();
    service = PaymentService(mockRepository);
  });

  // ── Payment Code Generation ─────────────────────────────────────

  group('generatePaymentCode', () {
    test('produces correct format TG-XXXX-XXXX', () {
      final code = PaymentService.generatePaymentCode();
      expect(code.startsWith('TG-'), isTrue);
      expect(code.length, 12); // TG + - + 4 + - + 4
      expect(code.split('-').length, 3);
    });

    test('code segments are 4 characters each', () {
      final code = PaymentService.generatePaymentCode();
      final parts = code.split('-');
      expect(parts[0], 'TG');
      expect(parts[1].length, 4);
      expect(parts[2].length, 4);
    });

    test('does not contain ambiguous characters (0, O, I, 1)', () {
      for (var i = 0; i < 50; i++) {
        final code = PaymentService.generatePaymentCode();
        final body = code.substring(3); // skip "TG-"
        expect(body.contains('0'), isFalse, reason: 'Code: $code');
        expect(body.contains('O'), isFalse, reason: 'Code: $code');
        expect(body.contains('I'), isFalse, reason: 'Code: $code');
        expect(body.contains('1'), isFalse, reason: 'Code: $code');
      }
    });

    test('generates unique codes across multiple calls', () {
      final codes = <String>{};
      for (var i = 0; i < 100; i++) {
        codes.add(PaymentService.generatePaymentCode());
      }
      // 4 unique codes out of 4 attempts
      expect(codes.length, 100);
    });
  });

  // ── SubscriptionTier ────────────────────────────────────────────

  group('SubscriptionTier', () {
    test('tier names and prices', () {
      expect(SubscriptionTier.free.priceMnt, 0);
      expect(SubscriptionTier.pro.priceMnt, 9900);
      expect(SubscriptionTier.breeder.priceMnt, 29900);
      expect(SubscriptionTier.stable.priceMnt, 49900);
    });

    test('displayName', () {
      expect(SubscriptionTier.free.displayName, 'Үнэгүй');
      expect(SubscriptionTier.pro.displayName, 'Pro');
      expect(SubscriptionTier.breeder.displayName, 'Breeder');
      expect(SubscriptionTier.stable.displayName, 'Stable');
    });

    test('formattedPrice includes comma separator and ₮', () {
      expect(SubscriptionTier.pro.formattedPrice, '₮9,900');
      expect(SubscriptionTier.breeder.formattedPrice, '₮29,900');
      expect(SubscriptionTier.stable.formattedPrice, '₮49,900');
    });

    test('priceLabel uses ₮ prefix', () {
      expect(SubscriptionTier.pro.priceLabel, '₮9900');
    });

    test('fromString parses known tiers', () {
      expect(SubscriptionTier.fromString('free'), SubscriptionTier.free);
      expect(SubscriptionTier.fromString('pro'), SubscriptionTier.pro);
      expect(SubscriptionTier.fromString('breeder'), SubscriptionTier.breeder);
      expect(SubscriptionTier.fromString('stable'), SubscriptionTier.stable);
    });

    test('fromString is case-insensitive', () {
      expect(SubscriptionTier.fromString('Pro'), SubscriptionTier.pro);
      expect(SubscriptionTier.fromString('BREEDER'), SubscriptionTier.breeder);
    });

    test('fromString defaults to free for unknown values', () {
      expect(SubscriptionTier.fromString('unknown'), SubscriptionTier.free);
      expect(SubscriptionTier.fromString(''), SubscriptionTier.free);
    });
  });

  // ── PaymentStatus ───────────────────────────────────────────────

  group('PaymentStatus', () {
    test('fromString parses known statuses', () {
      expect(PaymentStatus.fromString('pending'), PaymentStatus.pending);
      expect(PaymentStatus.fromString('verified'), PaymentStatus.verified);
      expect(PaymentStatus.fromString('rejected'), PaymentStatus.rejected);
      expect(PaymentStatus.fromString('expired'), PaymentStatus.expired);
    });

    test('fromString defaults to pending for unknown', () {
      expect(PaymentStatus.fromString('unknown'), PaymentStatus.pending);
    });

    test('displayName', () {
      expect(PaymentStatus.pending.displayName, 'Хүлээгдэж байна');
      expect(PaymentStatus.verified.displayName, 'Баталгаажсан');
      expect(PaymentStatus.rejected.displayName, 'Татгалзсан');
      expect(PaymentStatus.expired.displayName, 'Хугацаа дууссан');
    });
  });

  // ── createPaymentRequest ────────────────────────────────────────

  group('createPaymentRequest', () {
    test('returns fail for free tier', () async {
      final result = await service.createPaymentRequest(
        userId: 'user-1',
        tier: SubscriptionTier.free,
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'FREE_TIER_NO_PAYMENT');
    });

    test('creates payment request for paid tier', () async {
      when(
        () => mockRepository.createPaymentRequest(any()),
      ).thenAnswer((_) async => Result.ok(_dummyRequest()));

      final result = await service.createPaymentRequest(
        userId: 'user-1',
        tier: SubscriptionTier.pro,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.tier, SubscriptionTier.pro);
      expect(result.value.amountMnt, 9900);
      expect(result.value.status, PaymentStatus.pending);
      expect(result.value.code.startsWith('TG-'), isTrue);
    });

    test('sets 72 hour expiry', () async {
      when(
        () => mockRepository.createPaymentRequest(any()),
      ).thenAnswer((_) async => Result.ok(_dummyRequest()));

      final result = await service.createPaymentRequest(
        userId: 'user-1',
        tier: SubscriptionTier.breeder,
      );

      final created = result.value;
      final diff = created.expiresAt.difference(created.createdAt);
      expect(diff.inHours, 72);
    });

    test('delegates to repository', () async {
      when(
        () => mockRepository.createPaymentRequest(any()),
      ).thenAnswer((_) async => Result.ok(_dummyRequest()));

      await service.createPaymentRequest(
        userId: 'user-1',
        tier: SubscriptionTier.stable,
      );

      verify(() => mockRepository.createPaymentRequest(any())).called(1);
    });

    test('propagates repository failure', () async {
      when(() => mockRepository.createPaymentRequest(any())).thenAnswer(
        (_) async => const Result.fail(
          AppException(message: 'DB error', code: 'DB_ERROR'),
        ),
      );

      final result = await service.createPaymentRequest(
        userId: 'user-1',
        tier: SubscriptionTier.pro,
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'DB_ERROR');
    });
  });

  // ── getPaymentStatus ────────────────────────────────────────────

  group('getPaymentStatus', () {
    test('delegates to repository', () async {
      when(
        () => mockRepository.getPaymentStatus('req-1'),
      ).thenAnswer((_) async => Result.ok(_dummyRequest(id: 'req-1')));

      final result = await service.getPaymentStatus('req-1');

      expect(result.isSuccess, isTrue);
      verify(() => mockRepository.getPaymentStatus('req-1')).called(1);
    });
  });

  // ── listUserPayments ────────────────────────────────────────────

  group('listUserPayments', () {
    test('returns list from repository', () async {
      when(() => mockRepository.listUserPayments('user-1')).thenAnswer(
        (_) async => Result.ok([_dummyRequest(), _dummyRequest(id: 'req-2')]),
      );

      final result = await service.listUserPayments('user-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.length, 2);
    });
  });

  // ── getActivePaymentRequest ─────────────────────────────────────

  group('getActivePaymentRequest', () {
    test('returns null when no active request', () async {
      when(
        () => mockRepository.getActivePaymentRequest('user-1'),
      ).thenAnswer((_) async => const Result.ok(null));

      final result = await service.getActivePaymentRequest('user-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isNull);
    });
  });

  // ── PaymentRequest model ────────────────────────────────────────

  group('PaymentRequest model', () {
    test('fromSupabaseJson round-trips', () {
      final now = DateTime.utc(2026, 5, 1, 12);
      final expires = now.add(const Duration(hours: 72));
      final json = {
        'id': 'pr-1',
        'user_id': 'u1',
        'tier': 'pro',
        'code': 'TG-AB3F-7K2X',
        'amount_mnt': 9900,
        'status': 'pending',
        'created_at': now.toIso8601String(),
        'expires_at': expires.toIso8601String(),
        'verified_at': null,
        'admin_notes': null,
      };

      final request = PaymentRequest.fromSupabaseJson(json);

      expect(request.id, 'pr-1');
      expect(request.userId, 'u1');
      expect(request.tier, SubscriptionTier.pro);
      expect(request.code, 'TG-AB3F-7K2X');
      expect(request.amountMnt, 9900);
      expect(request.status, PaymentStatus.pending);
      expect(request.createdAt, now);
      expect(request.expiresAt, expires);
      expect(request.verifiedAt, isNull);
      expect(request.adminNotes, isNull);
    });

    test('fromSupabaseJson parses verified_at', () {
      final json = {
        'id': 'pr-1',
        'user_id': 'u1',
        'tier': 'breeder',
        'code': 'TG-X',
        'amount_mnt': 29900,
        'status': 'verified',
        'created_at': '2026-05-01T12:00:00Z',
        'expires_at': '2026-05-04T12:00:00Z',
        'verified_at': '2026-05-01T14:00:00Z',
        'admin_notes': 'Verified',
      };

      final request = PaymentRequest.fromSupabaseJson(json);
      expect(request.verifiedAt, isNotNull);
      expect(request.adminNotes, 'Verified');
    });

    test('toSupabaseJson produces correct fields', () {
      final request = _dummyRequest();
      final json = request.toSupabaseJson(userId: 'user-x');

      expect(json['user_id'], 'user-x');
      expect(json['tier'], 'pro');
      expect(json['code'], 'TG-ABCD-EFGH');
      expect(json['amount_mnt'], 9900);
      expect(json['status'], 'pending');
    });

    test('equality based on id, userId, tier, code, amount, status', () {
      final a = _dummyRequest();
      final b = _dummyRequest();
      expect(a, equals(b));

      final c = _dummyRequest(id: 'different');
      expect(a == c, isFalse);
    });

    test('toString includes key fields', () {
      final request = _dummyRequest();
      final str = request.toString();
      expect(str, contains('pr-1'));
      expect(str, contains('pro'));
      expect(str, contains('TG-ABCD-EFGH'));
      expect(str, contains('pending'));
    });
  });
}

// ── Helpers ─────────────────────────────────────────────────────

PaymentRequest _dummyRequest({
  String id = 'pr-1',
  SubscriptionTier tier = SubscriptionTier.pro,
}) {
  final now = DateTime.utc(2026, 5, 1);
  return PaymentRequest(
    id: id,
    userId: 'user-1',
    tier: tier,
    code: 'TG-ABCD-EFGH',
    amountMnt: tier.priceMnt,
    status: PaymentStatus.pending,
    createdAt: now,
    expiresAt: now.add(const Duration(hours: 72)),
  );
}
