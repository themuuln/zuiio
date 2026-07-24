/// Тэжээлийн бүртгэл.
///
/// Морины өдөр тутмын тэжээлийн хэрэглээг бүртгэнэ.
class FeedLog {
  const FeedLog({
    required this.id,
    required this.scheduleId,
    required this.horseId,
    required this.date,
    required this.amountGiven,
    required this.skipped,
    required this.createdAt,
    required this.updatedAt,
    this.notes = '',
  });

  /// Бүртгэлийн ID.
  final String id;

  /// Тэжээлийн хуваарийн ID.
  final String scheduleId;

  /// Морины ID.
  final String horseId;

  /// Тэжээсэн огноо.
  final DateTime date;

  /// Өгсөн тэжээлийн хэмжээ (кг).
  final double amountGiven;

  /// Алгассан эсэх. [true] бол энэ өдөр тэжээгээгүй.
  final bool skipped;

  /// Тэмдэглэл.
  final String notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── copyWith ────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  FeedLog copyWith({
    String? id,
    String? scheduleId,
    String? horseId,
    DateTime? date,
    double? amountGiven,
    bool? skipped,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FeedLog(
      id: id ?? this.id,
      scheduleId: scheduleId ?? this.scheduleId,
      horseId: horseId ?? this.horseId,
      date: date ?? this.date,
      amountGiven: amountGiven ?? this.amountGiven,
      skipped: skipped ?? this.skipped,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── JSON Serialization ──────────────────────────────────────────

  /// JSON-оос сэргээх (local format).
  factory FeedLog.fromJson(Map<String, dynamic> json) {
    return FeedLog(
      id: json['id'] as String,
      scheduleId: json['scheduleId'] as String,
      horseId: json['horseId'] as String,
      date: DateTime.parse(json['date'] as String),
      amountGiven: (json['amountGiven'] as num).toDouble(),
      skipped: json['skipped'] as bool,
      notes: json['notes'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'scheduleId': scheduleId,
      'horseId': horseId,
      'date': date.toIso8601String(),
      'amountGiven': amountGiven,
      'skipped': skipped,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Supabase snake_case JSON-оос сэргээх.
  factory FeedLog.fromSupabaseJson(Map<String, dynamic> json) {
    return FeedLog(
      id: json['id'] as String,
      scheduleId: json['schedule_id'] as String,
      horseId: json['horse_id'] as String,
      date: DateTime.parse(json['date'] as String),
      amountGiven: (json['amount_given'] as num).toDouble(),
      skipped: json['skipped'] as bool,
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
      'schedule_id': scheduleId,
      'horse_id': horseId,
      'date': date.toIso8601String(),
      'amount_given': amountGiven,
      'skipped': skipped,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ── Equality ────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FeedLog &&
          id == other.id &&
          scheduleId == other.scheduleId &&
          horseId == other.horseId &&
          date == other.date &&
          amountGiven == other.amountGiven &&
          skipped == other.skipped &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(
    id,
    scheduleId,
    horseId,
    date,
    amountGiven,
    skipped,
    notes,
  );

  @override
  String toString() =>
      'FeedLog(id: $id, scheduleId: $scheduleId, skipped: $skipped)';
}
