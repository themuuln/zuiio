/// Зурвас явуулах контейнер.
///
/// Худалдан авагч ба худалдагчийн хооронд, тодорхой зар эсвэл
/// хаяж морины мэдээтэй холбоотой явагдах харилцааг илэрхийлнэ.
///
/// Polymorphic reference: listingId нь market зарын, reportId нь
/// хаяж морины мэдээтэй холбоотой.
class MarketConversation {
  const MarketConversation({
    required this.id,
    this.listingId,
    this.reportId,
    required this.buyerId,
    required this.sellerId,
    this.lastMessage = '',
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  /// Conversation-ийн ID.
  final String id;

  /// Холбоотой зарын ID (market listing).
  ///
  /// [reportId]-тэй хамт аль нэг нь байх ёстой.
  final String? listingId;

  /// Холбоотой хаяж морины мэдээний ID (lost horse report).
  ///
  /// [listingId]-тэй хамт аль нэг нь байх ёстой.
  final String? reportId;

  /// Худалдан авагчийн ID.
  final String buyerId;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Сүүлийн зурвас.
  final String lastMessage;

  /// Сүүлийн зурвасын огноо.
  final DateTime? lastMessageAt;

  /// Уншаагүй зурвасын тоо.
  final int unreadCount;

  // ── CopyWith ──────────────────────────────────────────────────────

  MarketConversation copyWith({
    String? id,
    Object? listingId = _sentinel,
    Object? reportId = _sentinel,
    String? buyerId,
    String? sellerId,
    String? lastMessage,
    Object? lastMessageAt = _sentinel,
    int? unreadCount,
  }) {
    return MarketConversation(
      id: id ?? this.id,
      listingId: listingId == _sentinel ? this.listingId : listingId as String?,
      reportId: reportId == _sentinel ? this.reportId : reportId as String?,
      buyerId: buyerId ?? this.buyerId,
      sellerId: sellerId ?? this.sellerId,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt == _sentinel
          ? this.lastMessageAt
          : lastMessageAt as DateTime?,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }

  // ── Serialization ──────────────────────────────────────────────────

  factory MarketConversation.fromJson(Map<String, dynamic> json) {
    return MarketConversation(
      id: json['id'] as String,
      listingId: json['listingId'] as String?,
      reportId: json['reportId'] as String?,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      lastMessage: json['lastMessage'] as String? ?? '',
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'] as String)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (listingId != null) 'listingId': listingId,
      if (reportId != null) 'reportId': reportId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt?.toIso8601String(),
      'unreadCount': unreadCount,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MarketConversation &&
          id == other.id &&
          listingId == other.listingId &&
          reportId == other.reportId &&
          buyerId == other.buyerId &&
          sellerId == other.sellerId &&
          lastMessage == other.lastMessage &&
          lastMessageAt == other.lastMessageAt &&
          unreadCount == other.unreadCount;

  @override
  int get hashCode => Object.hash(
    id,
    listingId,
    reportId,
    buyerId,
    sellerId,
    lastMessage,
    lastMessageAt,
    unreadCount,
  );

  @override
  String toString() =>
      'MarketConversation(id: $id, listingId: $listingId, reportId: $reportId, buyerId: $buyerId, sellerId: $sellerId, unreadCount: $unreadCount)';
}

const _sentinel = Object();
