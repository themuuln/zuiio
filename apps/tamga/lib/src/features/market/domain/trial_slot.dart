/// Туршилтын цагийн төлөв.
enum TrialSlotStatus {
  available('Чөлөөтэй'),
  booked('Захиалсан'),
  completed('Дууссан'),
  cancelled('Цуцлагдсан');

  const TrialSlotStatus(this.displayName);

  final String displayName;

  static TrialSlotStatus fromString(String value) {
    return TrialSlotStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TrialSlotStatus.available,
    );
  }
}

/// Зарын туршилтын цагийн цонх.
///
/// Худалдагч тодорхой өдөр/цагт морь үзүүлэх боломжтой цагийг тэмдэглэнэ.
class TrialSlot {
  const TrialSlot({
    required this.id,
    required this.listingId,
    required this.sellerId,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.status = TrialSlotStatus.available,
    this.buyerId,
    this.notes,
    required this.createdAt,
  });

  /// Цагийн цонхны ID.
  final String id;

  /// Зарын ID.
  final String listingId;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Туршилтын өдөр.
  final DateTime date;

  /// Эхлэх цаг (HH:mm формат).
  final String startTime;

  /// Дуусах цаг (HH:mm формат).
  final String endTime;

  /// Цагийн цонхны төлөв.
  final TrialSlotStatus status;

  /// Захиалсан худалдан авагчийн ID (хэрэв байгаа бол).
  final String? buyerId;

  /// Нэмэлт тэмдэглэл.
  final String? notes;

  /// Үүсгэсэн огноо.
  final DateTime createdAt;

  /// Цагийн харуулах текст.
  String get timeDisplay => '$startTime - $endTime';

  /// Өдрийн харуулах текст.
  String get dateDisplay =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  // ── CopyWith ──────────────────────────────────────────────────

  TrialSlot copyWith({
    String? id,
    String? listingId,
    String? sellerId,
    DateTime? date,
    String? startTime,
    String? endTime,
    TrialSlotStatus? status,
    Object? buyerId = _sentinel,
    Object? notes = _sentinel,
    DateTime? createdAt,
  }) {
    return TrialSlot(
      id: id ?? this.id,
      listingId: listingId ?? this.listingId,
      sellerId: sellerId ?? this.sellerId,
      date: date ?? this.date,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      buyerId: buyerId == _sentinel ? this.buyerId : buyerId as String?,
      notes: notes == _sentinel ? this.notes : notes as String?,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // ── Serialization ────────────────────────────────────────────

  factory TrialSlot.fromJson(Map<String, dynamic> json) {
    return TrialSlot(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      sellerId: json['sellerId'] as String,
      date: DateTime.parse(json['date'] as String),
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      status: TrialSlotStatus.fromString(
        json['status'] as String? ?? 'available',
      ),
      buyerId: json['buyerId'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'sellerId': sellerId,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'status': status.name,
      'buyerId': buyerId,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ── Equality ─────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrialSlot &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          listingId == other.listingId &&
          sellerId == other.sellerId &&
          date == other.date &&
          startTime == other.startTime &&
          endTime == other.endTime &&
          status == other.status &&
          buyerId == other.buyerId &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(
    id,
    listingId,
    sellerId,
    date,
    startTime,
    endTime,
    status,
    buyerId,
    notes,
  );

  @override
  String toString() =>
      'TrialSlot(id: $id, date: $dateDisplay, time: $timeDisplay, status: ${status.name})';
}

const _sentinel = Object();
