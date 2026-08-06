import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:isar/isar.dart';
import 'package:uuid/uuid.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_sync_storage.dart';
import '../../shared/data/isar_schemas/isar_payment_request.dart';
import '../domain/payment_request.dart';
import 'payment_repository.dart';

/// Local-first [PaymentRepository] implementation backed by Isar.
///
/// All mutations write to Isar immediately (offline-first), then enqueue a
/// [SyncQueueItem] with `entityType: 'payment'` so [CloudSyncCoordinator]
/// can push the change to Supabase when connectivity is available.
class LocalPaymentRepository implements PaymentRepository {
  LocalPaymentRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
    IsarSyncStorage? syncStorage,
  }) : _storage = storage,
       _syncQueue = syncQueue,
       _syncStorage = syncStorage;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;
  final IsarSyncStorage? _syncStorage;

  /// Persist the sync intent to the durable queue (no-op when not wired).
  void _enqueueAndPersist(SyncQueueItem item) {
    _syncQueue.enqueue(item);
    final store = _syncStorage;
    if (store == null) return;
    unawaited(() async {
      try {
        await store.enqueue(item);
      } catch (e) {
        debugPrint('[payment] Failed to persist queue item: $e');
      }
    }());
  }

  // ── Helpers ──────────────────────────────────────────────

  AppException _wrap(Object e) {
    return AppException(
      message: 'Төлбөрийн сангийн алдаа: ${e.toString()}',
      code: 'LOCAL_PAYMENT_ERROR',
    );
  }

  // ── CRUD ─────────────────────────────────────────────────

  @override
  Future<Result<PaymentRequest>> createPaymentRequest(
    PaymentRequest request,
  ) async {
    try {
      final id = const Uuid().v4();
      final now = DateTime.now().toUtc();

      final payment = PaymentRequest(
        id: id,
        userId: request.userId,
        tier: request.tier,
        paymentType: request.paymentType,
        code: request.code,
        amountMnt: request.amountMnt,
        status: PaymentStatus.pending,
        createdAt: now,
        expiresAt: request.expiresAt,
      );

      final isarPayment = IsarPaymentRequest.fromDomain(payment);
      await _storage.paymentRequests.isar.writeTxn(() async {
        await _storage.paymentRequests.put(isarPayment);
      });

      // Enqueue sync item for payment creation
      _enqueueAndPersist(
        SyncQueueItem(
          entityType: 'payment',
          entityId: id,
          action: SyncAction.create,
          data: _syncData(payment),
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(payment);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<PaymentRequest>> getPaymentStatus(String requestId) async {
    try {
      final isarPayment = await _storage.paymentRequests
          .filter()
          .domainIdEqualTo(requestId)
          .findFirst();

      if (isarPayment == null) {
        return Result.fail(
          const AppException(
            message: 'Төлбөрийн хүсэлт олдсонгүй',
            code: 'PAYMENT_NOT_FOUND',
          ),
        );
      }

      return Result.ok(isarPayment.toDomain());
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<List<PaymentRequest>>> listUserPayments(String userId) async {
    try {
      final isarPayments = await _storage.paymentRequests
          .filter()
          .userIdEqualTo(userId)
          .findAll();

      isarPayments.sort(
        (a, b) => (b.createdAt ?? DateTime(2000)).compareTo(
          a.createdAt ?? DateTime(2000),
        ),
      );

      return Result.ok(isarPayments.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<PaymentRequest?>> getActivePaymentRequest(String userId) async {
    try {
      final now = DateTime.now().toUtc();
      final isarPayments = await _storage.paymentRequests
          .filter()
          .userIdEqualTo(userId)
          .statusEqualTo('pending')
          .findAll();

      // Filter by expiration in Dart since Isar doesn't support gt on DateTime? natively
      final active = isarPayments.where((p) {
        final expiresAt = p.expiresAt;
        return expiresAt != null && expiresAt.isAfter(now);
      }).toList();

      active.sort(
        (a, b) => (b.createdAt ?? DateTime(2000)).compareTo(
          a.createdAt ?? DateTime(2000),
        ),
      );

      return Result.ok(active.isNotEmpty ? active.first.toDomain() : null);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  @override
  Future<Result<PaymentRequest>> updatePaymentStatus({
    required String requestId,
    required PaymentStatus newStatus,
    String? adminNotes,
  }) async {
    try {
      // Find the existing payment
      final isarPayment = await _storage.paymentRequests
          .filter()
          .domainIdEqualTo(requestId)
          .findFirst();

      if (isarPayment == null) {
        return Result.fail(
          const AppException(
            message: 'Төлбөрийн хүсэлт олдсонгүй',
            code: 'PAYMENT_NOT_FOUND',
          ),
        );
      }

      // Update in Isar
      await _storage.paymentRequests.isar.writeTxn(() async {
        isarPayment.status = newStatus.name;
        if (newStatus == PaymentStatus.verified) {
          isarPayment.verifiedAt = DateTime.now().toUtc();
        }
        if (adminNotes != null) {
          isarPayment.adminNotes = adminNotes;
        }
        await _storage.paymentRequests.put(isarPayment);
      });

      final updated = isarPayment.toDomain();

      // Enqueue sync item for status update
      _enqueueAndPersist(
        SyncQueueItem(
          entityType: 'payment',
          entityId: requestId,
          action: SyncAction.update,
          data: {
            'status': newStatus.name,
            if (newStatus == PaymentStatus.verified)
              'verified_at': DateTime.now().toUtc().toIso8601String(),
            'admin_notes': adminNotes,
          },
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(updated);
    } catch (e) {
      return Result.fail(_wrap(e));
    }
  }

  // ── Private helpers ──────────────────────────────────────

  /// Prepare data for sync queue in Supabase-compatible format.
  Map<String, dynamic> _syncData(PaymentRequest payment) {
    return payment.toSupabaseJson(userId: payment.userId)..['id'] = payment.id;
  }
}
