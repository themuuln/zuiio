import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/payments/data/local_payment_repository.dart';
import 'package:tamga/src/features/payments/data/payment_repository.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('LocalPaymentRepository sync enqueue', () {
    late SyncQueue syncQueue;
    late LocalPaymentRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalPaymentRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('constructor accepts SyncQueue parameter', () {
      expect(repository, isA<PaymentRepository>());
    });

    test(
      'createPaymentRequest enqueues SyncQueueItem with entityType payment (create)',
      () async {
        final now = DateTime.now().toUtc();
        final expiresAt = now.add(const Duration(hours: 72));

        final request = PaymentRequest(
          id: '',
          userId: 'test-user-1',
          tier: SubscriptionTier.pro,
          code: 'TG-ABCD-1234',
          amountMnt: SubscriptionTier.pro.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now,
          expiresAt: expiresAt,
        );

        final result = await repository.createPaymentRequest(request);

        expect(result.isSuccess, true);
        final payment = result.value;
        expect(payment.userId, 'test-user-1');
        expect(payment.tier, SubscriptionTier.pro);
        expect(payment.status, PaymentStatus.pending);
        expect(payment.code, 'TG-ABCD-1234');
        expect(payment.amountMnt, SubscriptionTier.pro.priceMnt);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'payment');
        expect(item.entityId, payment.id);
        expect(item.action, SyncAction.create);
        expect(item.data, containsPair('user_id', 'test-user-1'));
        expect(item.data, containsPair('tier', 'pro'));
        expect(item.data, containsPair('status', 'pending'));
      },
    );

    test(
      'updatePaymentStatus enqueues SyncQueueItem with entityType payment (update)',
      () async {
        // First create a payment request
        final now = DateTime.now().toUtc();
        final expiresAt = now.add(const Duration(hours: 72));

        final request = PaymentRequest(
          id: '',
          userId: 'test-user-2',
          tier: SubscriptionTier.breeder,
          code: 'TG-EFGH-5678',
          amountMnt: SubscriptionTier.breeder.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now,
          expiresAt: expiresAt,
        );

        final createResult = await repository.createPaymentRequest(request);
        expect(createResult.isSuccess, true);
        final paymentId = createResult.value.id;
        syncQueue.clear();

        // Now update the status
        final updateResult = await repository.updatePaymentStatus(
          requestId: paymentId,
          newStatus: PaymentStatus.verified,
        );

        expect(updateResult.isSuccess, true);
        final updated = updateResult.value;
        expect(updated.status, PaymentStatus.verified);
        expect(updated.id, paymentId);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'payment');
        expect(item.entityId, paymentId);
        expect(item.action, SyncAction.update);
        expect(item.data, containsPair('status', 'verified'));
        expect(item.data.keys, contains('verified_at'));
      },
    );

    test(
      'updatePaymentStatus enqueues with adminNotes when provided',
      () async {
        final now = DateTime.now().toUtc();
        final expiresAt = now.add(const Duration(hours: 72));

        final request = PaymentRequest(
          id: '',
          userId: 'test-user-3',
          tier: SubscriptionTier.stable,
          code: 'TG-IJKL-9012',
          amountMnt: SubscriptionTier.stable.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now,
          expiresAt: expiresAt,
        );

        final createResult = await repository.createPaymentRequest(request);
        expect(createResult.isSuccess, true);
        final paymentId = createResult.value.id;
        syncQueue.clear();

        final updateResult = await repository.updatePaymentStatus(
          requestId: paymentId,
          newStatus: PaymentStatus.rejected,
          adminNotes: 'Төлбөрийн баримт тохирохгүй байна',
        );

        expect(updateResult.isSuccess, true);
        expect(updateResult.value.status, PaymentStatus.rejected);

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(
          item!.data,
          containsPair('admin_notes', 'Төлбөрийн баримт тохирохгүй байна'),
        );
      },
    );

    test('getPaymentStatus returns payment by id', () async {
      final now = DateTime.now().toUtc();
      final expiresAt = now.add(const Duration(hours: 72));

      final request = PaymentRequest(
        id: '',
        userId: 'test-user-status',
        tier: SubscriptionTier.pro,
        code: 'TG-STATUS-001',
        amountMnt: SubscriptionTier.pro.priceMnt,
        status: PaymentStatus.pending,
        createdAt: now,
        expiresAt: expiresAt,
      );

      final createResult = await repository.createPaymentRequest(request);
      expect(createResult.isSuccess, true);
      final paymentId = createResult.value.id;

      final result = await repository.getPaymentStatus(paymentId);
      expect(result.isSuccess, true);
      expect(result.value.id, paymentId);
      expect(result.value.userId, 'test-user-status');
    });

    test('getPaymentStatus returns fail for non-existent id', () async {
      final result = await repository.getPaymentStatus('non-existent');
      expect(result.isSuccess, false);
    });

    test('listUserPayments returns payments for user', () async {
      final now = DateTime.now().toUtc();
      final expiresAt = now.add(const Duration(hours: 72));

      // Create two payments
      await repository.createPaymentRequest(
        PaymentRequest(
          id: '',
          userId: 'user-payments',
          tier: SubscriptionTier.pro,
          code: 'TG-LIST-001',
          amountMnt: SubscriptionTier.pro.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now,
          expiresAt: expiresAt,
        ),
      );

      await repository.createPaymentRequest(
        PaymentRequest(
          id: '',
          userId: 'user-payments',
          tier: SubscriptionTier.breeder,
          code: 'TG-LIST-002',
          amountMnt: SubscriptionTier.breeder.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now.add(const Duration(hours: 1)),
          expiresAt: expiresAt.add(const Duration(hours: 1)),
        ),
      );

      final result = await repository.listUserPayments('user-payments');
      expect(result.isSuccess, true);
      expect(result.value.length, greaterThanOrEqualTo(2));
      expect(result.value.every((p) => p.userId == 'user-payments'), true);
      // Should be sorted newest first
      expect(
        result.value[0].createdAt.isAfter(result.value[1].createdAt) ||
            result.value[0].createdAt == result.value[1].createdAt,
        true,
      );
    });

    test(
      'listUserPayments returns empty list for user with no payments',
      () async {
        final result = await repository.listUserPayments('user-no-payments');
        expect(result.isSuccess, true);
        expect(result.value, isEmpty);
      },
    );

    test('getActivePaymentRequest returns active pending payment', () async {
      final now = DateTime.now().toUtc();
      final expiresAt = now.add(const Duration(hours: 72));

      await repository.createPaymentRequest(
        PaymentRequest(
          id: '',
          userId: 'user-active',
          tier: SubscriptionTier.pro,
          code: 'TG-ACTIVE-001',
          amountMnt: SubscriptionTier.pro.priceMnt,
          status: PaymentStatus.pending,
          createdAt: now,
          expiresAt: expiresAt,
        ),
      );

      final result = await repository.getActivePaymentRequest('user-active');
      expect(result.isSuccess, true);
      expect(result.value, isNotNull);
      expect(result.value!.status, PaymentStatus.pending);
      expect(result.value!.userId, 'user-active');
    });

    test(
      'getActivePaymentRequest returns null for user with no active requests',
      () async {
        final result = await repository.getActivePaymentRequest(
          'user-no-active',
        );
        expect(result.isSuccess, true);
        expect(result.value, isNull);
      },
    );

    test('updatePaymentStatus returns fail for non-existent payment', () async {
      final result = await repository.updatePaymentStatus(
        requestId: 'non-existent',
        newStatus: PaymentStatus.verified,
      );
      expect(result.isSuccess, false);
    });
  });
}
