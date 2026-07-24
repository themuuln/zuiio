/// Үнийн саналын төлөв.
enum MarketOfferStatus {
  pending('Хүлээгдэж буй'),
  accepted('Зөвшөөрсөн'),
  declined('Татгалзсан'),
  countered('Саналын үнэ өөрчилсөн');

  const MarketOfferStatus(this.displayName);

  final String displayName;

  static MarketOfferStatus fromString(String value) {
    return MarketOfferStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => MarketOfferStatus.pending,
    );
  }
}

/// Үнийн санал (Offer) домэйн загвар.
///
/// Худалдан авагчаас зарын үнэд санал өгөх, худалдагч хүлээн авах/татгалзах/
/// хариу санал өгөх боломжийг бүрдүүлнэ.
class MarketOffer {
  const MarketOffer({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.sellerId,
    required this.amount,
    this.status = MarketOfferStatus.pending,
    this.counterAmount,
    this.message,
    required this.createdAt,
    this.respondedAt,
  });

  /// Саналын ID.
  final String id;

  /// Холбоотой зарын ID.
  final String listingId;

  /// Худалдан авагчийн ID.
  final String buyerId;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Санал болгож буй үнэ (MNT).
  final int amount;

  /// Саналын төлөв.
  final MarketOfferStatus status;

  /// Хэрэв status == countered бол шинэ үнэ.
  final int? counterAmount;

  /// Саналд хавсаргасан мессеж (optional).
  final String? message;

  /// Санал үүсгэсэн огноо.
  final DateTime createdAt;

  /// Хариу өгсөн огноо (optional).
  final DateTime? respondedAt;

  // ── Derived Properties ─────────────────────────────────────────

  /// Санал идэвхтэй эсэх (pending эсвэл countered).
  bool get isActive =>
      status == MarketOfferStatus.pending ||
      status == MarketOfferStatus.countered;

  /// Саналын харуулах текст.
  String get statusLabel => status.displayName;

  // ── CopyWith ──────────────────────────────────────────────────

  MarketOffer copyWith({
    String? id,
    String? listingId,
    String? buyerId,
    String? sellerId,
    int? amount,
    MarketOfferStatus? status,
    Object? counterAmount = _sentinel,
    Object? message = _sentinel,
    DateTime? createdAt,
    Object? respondedAt = _sentinel,
  }) {
    return MarketOffer(
      id: id ?? this.id,
      listingId: listingId ?? this.listingId,
      buyerId: buyerId ?? this.buyerId,
      sellerId: sellerId ?? this.sellerId,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      counterAmount: counterAmount == _sentinel
          ? this.counterAmount
          : counterAmount as int?,
      message: message == _sentinel ? this.message : message as String?,
      createdAt: createdAt ?? this.createdAt,
      respondedAt: respondedAt == _sentinel
          ? this.respondedAt
          : respondedAt as DateTime?,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory MarketOffer.fromJson(Map<String, dynamic> json) {
    return MarketOffer(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      amount: json['amount'] as int,
      status: MarketOfferStatus.fromString(json['status'] as String? ?? 'pending'),
      counterAmount: json['counterAmount'] as int?,
      message: json['message'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      respondedAt: json['respondedAt'] != null
          ? DateTime.parse(json['respondedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'amount': amount,
      'status': status.name,
      'counterAmount': counterAmount,
      'message': message,
      'createdAt': createdAt.toIso8601String(),
      'respondedAt': respondedAt?.toIso8601String(),
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MarketOffer &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          listingId == other.listingId &&
          buyerId == other.buyerId &&
          sellerId == other.sellerId &&
          amount == other.amount &&
          status == other.status &&
          counterAmount == other.counterAmount &&
          message == other.message &&
          createdAt == other.createdAt &&
          respondedAt == other.respondedAt;

  @override
  int get hashCode => Object.hash(
      id, listingId, buyerId, sellerId, amount, status,
      counterAmount, message, createdAt, respondedAt);

  @override
  String toString() =>
      'MarketOffer(id: $id, listingId: $listingId, amount: $amount, status: ${status.name})';
}

const _sentinel = Object();
