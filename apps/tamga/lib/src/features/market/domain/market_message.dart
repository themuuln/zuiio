/// Мессенжерийн нэгж зурвас.
///
/// [MarketConversation]-д хамаарах нэг мессежийг илэрхийлнэ.
class MarketMessage {
  const MarketMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.listingId,
    this.reportId,
    required this.text,
    required this.timestamp,
    this.read = false,
  });

  /// Зурвасын ID.
  final String id;

  /// Харьяалагдах conversation-ийн ID.
  final String conversationId;

  /// Илгээгчийн ID.
  final String senderId;

  /// Холбоотой зарын ID (listing), хэрэв market conversation бол.
  final String? listingId;

  /// Холбоотой хаяж морины мэдээний ID, хэрэв lost horse report conversation бол.
  final String? reportId;

  /// Зурвасын текст.
  final String text;

  /// Илгээсэн огноо.
  final DateTime timestamp;

  /// Уншсан эсэх.
  final bool read;

  // ── CopyWith ──────────────────────────────────────────────────────

  MarketMessage copyWith({
    String? id,
    String? conversationId,
    String? senderId,
    Object? listingId = _sentinel,
    Object? reportId = _sentinel,
    String? text,
    DateTime? timestamp,
    bool? read,
  }) {
    return MarketMessage(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      listingId: listingId == _sentinel ? this.listingId : listingId as String?,
      reportId: reportId == _sentinel ? this.reportId : reportId as String?,
      text: text ?? this.text,
      timestamp: timestamp ?? this.timestamp,
      read: read ?? this.read,
    );
  }

  // ── Serialization ──────────────────────────────────────────────────

  factory MarketMessage.fromJson(Map<String, dynamic> json) {
    return MarketMessage(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      listingId: json['listingId'] as String?,
      reportId: json['reportId'] as String?,
      text: json['text'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      read: json['read'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      if (listingId != null) 'listingId': listingId,
      if (reportId != null) 'reportId': reportId,
      'text': text,
      'timestamp': timestamp.toIso8601String(),
      'read': read,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MarketMessage &&
          id == other.id &&
          conversationId == other.conversationId &&
          senderId == other.senderId &&
          listingId == other.listingId &&
          reportId == other.reportId &&
          text == other.text &&
          timestamp == other.timestamp &&
          read == other.read;

  @override
  int get hashCode =>
      Object.hash(id, conversationId, senderId, listingId, reportId, text, timestamp, read);

  @override
  String toString() =>
      'MarketMessage(id: $id, conversationId: $conversationId, senderId: $senderId, text: $text, read: $read)';
}

const _sentinel = Object();
