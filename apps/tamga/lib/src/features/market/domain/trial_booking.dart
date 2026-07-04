/// Туршилтын захиалгын төлөв.
enum TrialBookingStatus {
  requested('Хүсэлт илгээсэн'),
  confirmed('Баталгаажсан'),
  completed('Дууссан'),
  cancelled('Цуцлагдсан');

  const TrialBookingStatus(this.displayName);

  final String displayName;

  static TrialBookingStatus fromString(String value) {
    return TrialBookingStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TrialBookingStatus.requested,
    );
  }
}

/// Туршилтын захиалга.
///
/// Худалдан авагч тодорхой цагийн цонхонд туршилт хийх хүсэлт илгээж,
/// худалдагч баталгаажуулах, дуусгах эсвэл цуцлах боломжтой.
class TrialBooking {
  const TrialBooking({
    required this.id,
    required this.listingId,
    required this.slotId,
    required this.buyerId,
    required this.sellerId,
    this.status = TrialBookingStatus.requested,
    this.notes,
    required this.requestedAt,
    this.respondedAt,
  });

  /// Захиалгын ID.
  final String id;

  /// Зарын ID.
  final String listingId;

  /// Цагийн цонхны ID.
  final String slotId;

  /// Худалдан авагчийн ID.
  final String buyerId;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Захиалгын төлөв.
  final TrialBookingStatus status;

  /// Нэмэлт тэмдэглэл.
  final String? notes;

  /// Хүсэлт илгээсэн огноо.
  final DateTime requestedAt;

  /// Хариу өгсөн огноо (баталгаажуулах/цуцлах үед).
  final DateTime? respondedAt;

  /// Төлөвийн харуулах текст.
  String get statusLabel => status.displayName;

  /// Захиалга идэвхтэй эсэх (requested эсвэл confirmed).
  bool get isActive =>
      status == TrialBookingStatus.requested ||
      status == TrialBookingStatus.confirmed;

  // ── CopyWith ──────────────────────────────────────────────────

  TrialBooking copyWith({
    String? id,
    String? listingId,
    String? slotId,
    String? buyerId,
    String? sellerId,
    TrialBookingStatus? status,
    Object? notes = _sentinel,
    DateTime? requestedAt,
    Object? respondedAt = _sentinel,
  }) {
    return TrialBooking(
      id: id ?? this.id,
      listingId: listingId ?? this.listingId,
      slotId: slotId ?? this.slotId,
      buyerId: buyerId ?? this.buyerId,
      sellerId: sellerId ?? this.sellerId,
      status: status ?? this.status,
      notes: notes == _sentinel ? this.notes : notes as String?,
      requestedAt: requestedAt ?? this.requestedAt,
      respondedAt: respondedAt == _sentinel
          ? this.respondedAt
          : respondedAt as DateTime?,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory TrialBooking.fromJson(Map<String, dynamic> json) {
    return TrialBooking(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      slotId: json['slotId'] as String,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      status: TrialBookingStatus.fromString(
        json['status'] as String? ?? 'requested',
      ),
      notes: json['notes'] as String?,
      requestedAt: DateTime.parse(json['requestedAt'] as String),
      respondedAt: json['respondedAt'] != null
          ? DateTime.parse(json['respondedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'slotId': slotId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'status': status.name,
      'notes': notes,
      'requestedAt': requestedAt.toIso8601String(),
      'respondedAt': respondedAt?.toIso8601String(),
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrialBooking &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          listingId == other.listingId &&
          slotId == other.slotId &&
          buyerId == other.buyerId &&
          sellerId == other.sellerId &&
          status == other.status &&
          notes == other.notes &&
          requestedAt == other.requestedAt &&
          respondedAt == other.respondedAt;

  @override
  int get hashCode => Object.hash(
      id, listingId, slotId, buyerId, sellerId,
      status, notes, requestedAt, respondedAt);

  @override
  String toString() =>
      'TrialBooking(id: $id, listingId: $listingId, status: ${status.name})';
}

const _sentinel = Object();
