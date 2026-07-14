import '../../../core/error/result.dart';
import '../domain/payment_request.dart';

/// Төлбөрийн үйлдлийн интерфейс.
abstract interface class PaymentRepository {
  /// Төлбөрийн хүсэлт үүсгэх.
  Future<Result<PaymentRequest>> createPaymentRequest(PaymentRequest request);

  /// Төлбөрийн төлөв шалгах.
  Future<Result<PaymentRequest>> getPaymentStatus(String requestId);

  /// Хэрэглэгчийн бүх төлбөрийн хүсэлтүүд.
  Future<Result<List<PaymentRequest>>> listUserPayments(String userId);

  /// Хэрэглэгчийн идэвхтэй (pending) хүсэлтийг авах.
  Future<Result<PaymentRequest?>> getActivePaymentRequest(String userId);

  /// Төлбөрийн хүсэлтийн төлөвийг шинэчлэх.
  ///
  /// [requestId] — хүсэлтийн ID
  /// [newStatus] — шинэ төлөв
  /// [adminNotes] — админы тэмдэглэл (optional)
  Future<Result<PaymentRequest>> updatePaymentStatus({
    required String requestId,
    required PaymentStatus newStatus,
    String? adminNotes,
  });
}
