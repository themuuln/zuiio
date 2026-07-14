/// Тэжээлийн төрөл.
///
/// Морины тэжээлийн үндсэн төрлүүд:
/// - hay (Өвс) — өвс, сүрэл
/// - grain (Тэжээл) — нэмэлт тэжээл
/// - supplement (Нэмэлт) — витамин, эрдэс бодис
enum FeedType {
  hay,
  grain,
  supplement;

  /// Монгол нэршил.
  String get displayName => switch (this) {
    FeedType.hay => 'Өвс',
    FeedType.grain => 'Тэжээл',
    FeedType.supplement => 'Нэмэлт',
  };
}

/// Тэжээлийн хуваарь.
///
/// Морины тэжээлийн хуваарийг бүртгэнэ.
class FeedSchedule {
  const FeedSchedule({
    required this.id,
    required this.horseId,
    required this.feedType,
    required this.quantityKg,
    required this.frequency,
    required this.startDate,
    required this.createdAt,
    required this.updatedAt,
    this.endDate,
    this.notes = '',
  });

  /// Хуваарийн ID.
  final String id;

  /// Морины ID.
  final String horseId;

  /// Тэжээлийн төрөл.
  final FeedType feedType;

  /// Тэжээлийн жин (кг).
  final double quantityKg;

  /// Тэжээх давтамж (жишээ нь: 'Өдөр бүр', 'Өдөрт 2 удаа').
  final String frequency;

  /// Эхлэх огноо.
  final DateTime startDate;

  /// Дуусах огноо. [null] бол үргэлжлэх хугацаа тодорхойгүй.
  final DateTime? endDate;

  /// Тэмдэглэл.
  final String notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── copyWith ────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  FeedSchedule copyWith({
    String? id,
    String? horseId,
    FeedType? feedType,
    double? quantityKg,
    String? frequency,
    DateTime? startDate,
    Object? endDate = _sentinel,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FeedSchedule(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      feedType: feedType ?? this.feedType,
      quantityKg: quantityKg ?? this.quantityKg,
      frequency: frequency ?? this.frequency,
      startDate: startDate ?? this.startDate,
      endDate: endDate == _sentinel ? this.endDate : endDate as DateTime?,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── JSON Serialization ──────────────────────────────────────────

  /// JSON-оос сэргээх (local format).
  factory FeedSchedule.fromJson(Map<String, dynamic> json) {
    return FeedSchedule(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      feedType: FeedType.values.byName(json['feedType'] as String),
      quantityKg: (json['quantityKg'] as num).toDouble(),
      frequency: json['frequency'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'] as String)
          : null,
      notes: json['notes'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'feedType': feedType.name,
      'quantityKg': quantityKg,
      'frequency': frequency,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Supabase snake_case JSON-оос сэргээх.
  factory FeedSchedule.fromSupabaseJson(Map<String, dynamic> json) {
    return FeedSchedule(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      feedType: FeedType.values.byName(json['feed_type'] as String),
      quantityKg: (json['quantity_kg'] as num).toDouble(),
      frequency: json['frequency'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'] as String)
          : null,
      notes: json['notes'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'id': id,
      'horse_id': horseId,
      'feed_type': feedType.name,
      'quantity_kg': quantityKg,
      'frequency': frequency,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ── Equality ────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FeedSchedule &&
          id == other.id &&
          horseId == other.horseId &&
          feedType == other.feedType &&
          quantityKg == other.quantityKg &&
          frequency == other.frequency &&
          startDate == other.startDate &&
          endDate == other.endDate &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(
    id,
    horseId,
    feedType,
    quantityKg,
    frequency,
    startDate,
    endDate,
    notes,
  );

  @override
  String toString() =>
      'FeedSchedule(id: $id, feedType: ${feedType.name}, quantityKg: $quantityKg)';
}

/// Sentinel for nullable copyWith parameters.
const _sentinel = Object();
