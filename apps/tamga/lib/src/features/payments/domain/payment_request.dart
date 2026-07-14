/// Төлбөрийн түвшин (subscription tier).
enum SubscriptionTier {
  free('Үнэгүй', 0),
  pro('Pro', 9900),
  breeder('Breeder', 29900),
  stable('Stable', 49900);

  const SubscriptionTier(this.displayName, this.priceMnt);

  final String displayName;
  final int priceMnt;

  /// Хэрэглэгчид харуулах үнэ (₮ тэмдэгтэй).
  String get priceLabel => '₮${priceMnt.toStringAsFixed(0)}';

  /// MongoDB-style price format (₮9,900).
  String get formattedPrice {
    final formatted = priceMnt.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '₮$formatted';
  }

  static SubscriptionTier fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pro':
        return SubscriptionTier.pro;
      case 'breeder':
        return SubscriptionTier.breeder;
      case 'stable':
        return SubscriptionTier.stable;
      default:
        return SubscriptionTier.free;
    }
  }
}

/// Төлбөрийн төрөл (payment type).
enum PaymentType {
  subscription('Захиалга'),
  listingBoost('Сурталчилгаа'),
  sellerBadge('Дэлгүүрийн тэмдэг');

  const PaymentType(this.displayName);

  final String displayName;
}

/// Төлбөрийн хүсэлтийн төлөв.
enum PaymentStatus {
  pending('Хүлээгдэж байна'),
  verified('Баталгаажсан'),
  rejected('Татгалзсан'),
  expired('Хугацаа дууссан');

  const PaymentStatus(this.displayName);

  final String displayName;

  static PaymentStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'verified':
        return PaymentStatus.verified;
      case 'rejected':
        return PaymentStatus.rejected;
      case 'expired':
        return PaymentStatus.expired;
      default:
        return PaymentStatus.pending;
    }
  }
}

/// Төлбөрийн хүсэлтийн domain model.
class PaymentRequest {
  const PaymentRequest({
    required this.id,
    required this.userId,
    required this.tier,
    this.paymentType = PaymentType.subscription,
    required this.code,
    required this.amountMnt,
    required this.status,
    required this.createdAt,
    required this.expiresAt,
    this.verifiedAt,
    this.adminNotes,
  });

  final String id;
  final String userId;
  final SubscriptionTier tier;
  final PaymentType paymentType;
  final String code;
  final int amountMnt;
  final PaymentStatus status;
  final DateTime createdAt;
  final DateTime expiresAt;
  final DateTime? verifiedAt;
  final String? adminNotes;

  /// Хугацаа дуусахад үлдсэн хугацаа.
  Duration get remainingTime => expiresAt.difference(DateTime.now());

  /// Хугацаа дууссан эсэх.
  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// Хугацааны дүрсэн хэлбэр (цаг/минут).
  String get remainingTimeLabel {
    final remaining = remainingTime;
    if (remaining.isNegative) return 'Хугацаа дууссан';
    final hours = remaining.inHours;
    final minutes = remaining.inMinutes.remainder(60);
    if (hours > 0) return '$hours цаг $minutes минут';
    return '$minutes минут';
  }

  PaymentRequest copyWith({
    String? id,
    String? userId,
    SubscriptionTier? tier,
    PaymentType? paymentType,
    String? code,
    int? amountMnt,
    PaymentStatus? status,
    DateTime? createdAt,
    DateTime? expiresAt,
    DateTime? verifiedAt,
    String? adminNotes,
  }) {
    return PaymentRequest(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      tier: tier ?? this.tier,
      paymentType: paymentType ?? this.paymentType,
      code: code ?? this.code,
      amountMnt: amountMnt ?? this.amountMnt,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      adminNotes: adminNotes ?? this.adminNotes,
    );
  }

  // ── Serialization — Supabase (snake_case) ──────────────────

  factory PaymentRequest.fromSupabaseJson(Map<String, dynamic> json) {
    return PaymentRequest(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      tier: SubscriptionTier.fromString(json['tier'] as String),
      paymentType: PaymentType.values.byName(
        json['payment_type'] as String? ?? 'subscription',
      ),
      code: json['code'] as String,
      amountMnt: json['amount_mnt'] as int,
      status: PaymentStatus.fromString(json['status'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      expiresAt: DateTime.parse(json['expires_at'] as String),
      verifiedAt: json['verified_at'] != null
          ? DateTime.parse(json['verified_at'] as String)
          : null,
      adminNotes: json['admin_notes'] as String?,
    );
  }

  Map<String, dynamic> toSupabaseJson({required String userId}) {
    return {
      'user_id': userId,
      'tier': tier.name,
      'payment_type': paymentType.name,
      'code': code,
      'amount_mnt': amountMnt,
      'status': status.name,
      'expires_at': expiresAt.toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentRequest &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userId == other.userId &&
          tier == other.tier &&
          code == other.code &&
          amountMnt == other.amountMnt &&
          status == other.status;

  @override
  int get hashCode => Object.hash(id, userId, tier, code, amountMnt, status);

  @override
  String toString() =>
      'PaymentRequest(id: $id, tier: ${tier.name}, code: $code, status: ${status.name})';
}
