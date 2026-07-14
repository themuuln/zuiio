import 'package:isar/isar.dart';

import '../../../payments/domain/payment_request.dart';

part 'isar_payment_request.g.dart';

/// Isar collection for persistent storage of [PaymentRequest].
///
/// Used by [LocalPaymentRepository] to store payment requests locally
/// with offline-first support.
@collection
class IsarPaymentRequest {
  IsarPaymentRequest();

  Id id = Isar.autoIncrement;

  /// Unique domain identifier for the payment request.
  @Index(unique: true, replace: true)
  late String domainId;

  /// The user who owns this payment request.
  late String userId;

  /// Subscription tier name (matches [SubscriptionTier.name]).
  late String tier;

  /// Payment type name (matches [PaymentType.name]).
  late String paymentType;

  /// Payment verification code.
  late String code;

  /// Amount in Mongolian tugrik.
  late int amountMnt;

  /// Payment status name (matches [PaymentStatus.name]).
  late String status;

  /// When the request was created.
  DateTime? createdAt;

  /// When the request expires.
  DateTime? expiresAt;

  /// When the request was verified (if applicable).
  DateTime? verifiedAt;

  /// Admin notes (if any).
  String? adminNotes;

  factory IsarPaymentRequest.fromDomain(PaymentRequest request) {
    return IsarPaymentRequest()
      ..domainId = request.id
      ..userId = request.userId
      ..tier = request.tier.name
      ..paymentType = request.paymentType.name
      ..code = request.code
      ..amountMnt = request.amountMnt
      ..status = request.status.name
      ..createdAt = request.createdAt
      ..expiresAt = request.expiresAt
      ..verifiedAt = request.verifiedAt
      ..adminNotes = request.adminNotes;
  }

  PaymentRequest toDomain() {
    return PaymentRequest(
      id: domainId,
      userId: userId,
      tier: SubscriptionTier.fromString(tier),
      paymentType: PaymentType.values.byName(paymentType),
      code: code,
      amountMnt: amountMnt,
      status: PaymentStatus.fromString(status),
      createdAt: createdAt ?? DateTime.now(),
      expiresAt: expiresAt ?? DateTime.now(),
      verifiedAt: verifiedAt,
      adminNotes: adminNotes,
    );
  }
}
