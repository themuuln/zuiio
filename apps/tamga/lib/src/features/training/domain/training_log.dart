/// Дасгалжуулалтын төрөл.
///
/// Монгол морьдын уламжлалт дасгалжуулалтын төрлүүд:
/// - gallop (Хурдалгаа) — хурдан давхилт
/// - sprint (Спринт) — богино зайн хурд
/// - endurance (Тэвчээр) — алсын зайн тэвчээр
/// - rest (Амралт) — амралт, сэргэлт
enum TrainingLogType {
  gallop,
  sprint,
  endurance,
  rest;

  /// Монгол нэршил.
  String get displayName => switch (this) {
    TrainingLogType.gallop => 'Хурдалгаа',
    TrainingLogType.sprint => 'Спринт',
    TrainingLogType.endurance => 'Тэвчээр',
    TrainingLogType.rest => 'Амралт',
  };
}

/// Дасгалжуулалтын бүртгэл.
///
/// Морины өдөр тутмын дасгалжуулалтыг бүртгэнэ.
class TrainingLog {
  const TrainingLog({
    required this.id,
    required this.horseId,
    required this.type,
    required this.date,
    required this.durationMinutes,
    this.distanceKm,
    this.notes = '',
    required this.createdAt,
    required this.updatedAt,
    this.handlerName,
    this.weather,
  });

  /// Бүртгэлийн ID.
  final String id;

  /// Морины ID.
  final String horseId;

  /// Дасгалжуулалтын төрөл.
  final TrainingLogType type;

  /// Дасгалжуулалтын огноо.
  final DateTime date;

  /// Дасгалжуулалтын үргэлжлэх хугацаа (минут).
  final int durationMinutes;

  /// Дасгалжуулалтын зай (км). [null] бол зай тодорхойгүй.
  final double? distanceKm;

  /// Тэмдэглэл.
  final String notes;

  /// Дааганч (морин дээр сууж буй хүн) нэр.
  final String? handlerName;

  /// Цаг агаарын нөхцөл.
  final String? weather;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── copyWith ────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  TrainingLog copyWith({
    String? id,
    String? horseId,
    TrainingLogType? type,
    DateTime? date,
    int? durationMinutes,
    Object? distanceKm = _sentinel,
    String? notes,
    Object? handlerName = _sentinel,
    Object? weather = _sentinel,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TrainingLog(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      type: type ?? this.type,
      date: date ?? this.date,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      distanceKm: distanceKm == _sentinel ? this.distanceKm : distanceKm as double?,
      notes: notes ?? this.notes,
      handlerName: handlerName == _sentinel ? this.handlerName : handlerName as String?,
      weather: weather == _sentinel ? this.weather : weather as String?,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── JSON Serialization ──────────────────────────────────────────

  /// JSON-оос сэргээх (local format).
  factory TrainingLog.fromJson(Map<String, dynamic> json) {
    return TrainingLog(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      type: TrainingLogType.values.byName(json['type'] as String),
      date: DateTime.parse(json['date'] as String),
      durationMinutes: json['durationMinutes'] as int,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      notes: json['notes'] as String? ?? '',
      handlerName: json['handlerName'] as String?,
      weather: json['weather'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'type': type.name,
      'date': date.toIso8601String(),
      'durationMinutes': durationMinutes,
      'distanceKm': distanceKm,
      'notes': notes,
      'handlerName': handlerName,
      'weather': weather,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Supabase snake_case JSON-оос сэргээх.
  factory TrainingLog.fromSupabaseJson(Map<String, dynamic> json) {
    return TrainingLog(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      type: TrainingLogType.values.byName(json['type'] as String),
      date: DateTime.parse(json['date'] as String),
      durationMinutes: json['duration_minutes'] as int,
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
      notes: json['notes'] as String? ?? '',
      handlerName: json['handler_name'] as String?,
      weather: json['weather'] as String?,
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
      'type': type.name,
      'date': date.toIso8601String(),
      'duration_minutes': durationMinutes,
      'distance_km': distanceKm,
      'notes': notes,
      'handler_name': handlerName,
      'weather': weather,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ── Equality ────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrainingLog &&
          id == other.id &&
          horseId == other.horseId &&
          type == other.type &&
          date == other.date &&
          durationMinutes == other.durationMinutes &&
          distanceKm == other.distanceKm &&
          notes == other.notes &&
          handlerName == other.handlerName &&
          weather == other.weather;

  @override
  int get hashCode => Object.hash(id, horseId, type, date, durationMinutes, distanceKm, notes, handlerName, weather);

  @override
  String toString() => 'TrainingLog(id: $id, type: ${type.name}, date: $date)';
}

/// Sentinel for nullable copyWith parameters.
const _sentinel = Object();
