/// Хэмжигдэхүүний төрөл.
///
/// Морины гүйцэтгэлийн үзүүлэлтүүд:
/// - speed (Хурд) — хурдны үзүүлэлт
/// - endurance (Тэвчээр) — тэвчээрийн үзүүлэлт
/// - weight (Жин) — биеийн жин
/// - condition (Биеийн байдал) — биеийн ерөнхий байдал
enum MetricType {
  speed,
  endurance,
  weight,
  condition;

  /// Монгол нэршил.
  String get displayName => switch (this) {
    MetricType.speed => 'Хурд',
    MetricType.endurance => 'Тэвчээр',
    MetricType.weight => 'Жин',
    MetricType.condition => 'Биеийн байдал',
  };
}

/// Гүйцэтгэлийн үзүүлэлтийн бүртгэл.
///
/// Морины хурд, тэвчээр, жин, биеийн байдлын үзүүлэлтүүдийг бүртгэнэ.
class PerformanceRecord {
  const PerformanceRecord({
    required this.id,
    required this.horseId,
    required this.metric,
    required this.value,
    this.date,
    this.unit,
    required this.createdAt,
    required this.updatedAt,
    this.notes = '',
  });

  /// Бүртгэлийн ID.
  final String id;

  /// Морины ID.
  final String horseId;

  /// Хэмжигдэхүүний төрөл.
  final MetricType metric;

  /// Хэмжигдэхүүний утга.
  final double value;

  /// Хэмжилтийн огноо. [null] бол одоогийн огноо.
  final DateTime? date;

  /// Хэмжих нэгж (жишээ нь: 'км/ц', 'кг', '1-10').
  final String? unit;

  /// Тэмдэглэл.
  final String notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── copyWith ────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  PerformanceRecord copyWith({
    String? id,
    String? horseId,
    MetricType? metric,
    double? value,
    Object? date = _sentinel,
    Object? unit = _sentinel,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PerformanceRecord(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      metric: metric ?? this.metric,
      value: value ?? this.value,
      date: date == _sentinel ? this.date : date as DateTime?,
      unit: unit == _sentinel ? this.unit : unit as String?,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── JSON Serialization ──────────────────────────────────────────

  /// JSON-оос сэргээх (local format).
  factory PerformanceRecord.fromJson(Map<String, dynamic> json) {
    return PerformanceRecord(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      metric: MetricType.values.byName(json['metric'] as String),
      value: (json['value'] as num).toDouble(),
      date: json['date'] != null ? DateTime.parse(json['date'] as String) : null,
      unit: json['unit'] as String?,
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
      'metric': metric.name,
      'value': value,
      'date': date?.toIso8601String(),
      'unit': unit,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Supabase snake_case JSON-оос сэргээх.
  factory PerformanceRecord.fromSupabaseJson(Map<String, dynamic> json) {
    return PerformanceRecord(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      metric: MetricType.values.byName(json['metric'] as String),
      value: (json['value'] as num).toDouble(),
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : (json['created_at'] != null
              ? DateTime.parse(json['created_at'] as String)
              : null),
      unit: json['unit'] as String?,
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
      'metric': metric.name,
      'value': value,
      'date': date?.toIso8601String(),
      'unit': unit,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ── Equality ────────────────────────────────────────────────────

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PerformanceRecord &&
          id == other.id &&
          horseId == other.horseId &&
          metric == other.metric &&
          value == other.value &&
          date == other.date &&
          unit == other.unit &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(id, horseId, metric, value, date, unit, notes);

  @override
  String toString() => 'PerformanceRecord(id: $id, metric: ${metric.name}, value: $value)';
}

/// Sentinel for nullable copyWith parameters.
const _sentinel = Object();
