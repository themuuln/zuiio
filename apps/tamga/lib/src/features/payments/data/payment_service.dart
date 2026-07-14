import 'dart:math';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/payment_request.dart';
import 'payment_repository.dart';

/// Төлбөрийн үйлчилгээ — төлбөрийн код үүсгэх, хүсэлт илгээх.
class PaymentService {
  PaymentService(this._repository);

  final PaymentRepository _repository;

  /// Төлбөрийн код үүсгэх (жишээ: "TG-AB3F-7K2X").
  static String generatePaymentCode() {
    final rng = Random.secure();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O/I/1 агуулахгүй
    final part1 = List.generate(
      4,
      (_) => chars[rng.nextInt(chars.length)],
    ).join();
    final part2 = List.generate(
      4,
      (_) => chars[rng.nextInt(chars.length)],
    ).join();
    return 'TG-$part1-$part2';
  }

  /// Шинэ төлбөрийн хүсэлт үүсгэх.
  Future<Result<PaymentRequest>> createPaymentRequest({
    required String userId,
    required SubscriptionTier tier,
  }) async {
    if (tier == SubscriptionTier.free) {
      return const Result.fail(
        AppException(
          message: 'Үнэгүй түвшинг сонгох шаардлагагүй',
          code: 'FREE_TIER_NO_PAYMENT',
        ),
      );
    }

    final code = generatePaymentCode();
    final now = DateTime.now().toUtc();
    final expiresAt = now.add(const Duration(hours: 72));

    final request = PaymentRequest(
      id: '',
      userId: userId,
      tier: tier,
      code: code,
      amountMnt: tier.priceMnt,
      status: PaymentStatus.pending,
      createdAt: now,
      expiresAt: expiresAt,
    );

    return _repository.createPaymentRequest(request);
  }

  /// Төлбөрийн төлөв шалгах.
  Future<Result<PaymentRequest>> getPaymentStatus(String requestId) {
    return _repository.getPaymentStatus(requestId);
  }

  /// Хэрэглэгчийн бүх төлбөрийн хүсэлтүүд.
  Future<Result<List<PaymentRequest>>> listUserPayments(String userId) {
    return _repository.listUserPayments(userId);
  }

  /// Хэрэглэгчийн идэвхтэй (pending) хүсэлтийг авах.
  Future<Result<PaymentRequest?>> getActivePaymentRequest(String userId) {
    return _repository.getActivePaymentRequest(userId);
  }
}
