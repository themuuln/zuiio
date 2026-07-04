/// Багийн domain model.
///
/// - `id` — багийн өвөрмөц ID
/// - `name` — багийн нэр
/// - `ownerUserId` — баг эзэмшигчийн ID
/// - `memberCount` — гишүүдийн тоо
/// - `horseCount` — морины тоо
/// - `createdAt` — баг үүсгэсэн огноо
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class Team {
  const Team({
    required this.id,
    required this.name,
    required this.ownerUserId,
    this.memberCount = 1,
    this.horseCount = 0,
    required this.createdAt,
  });

  /// Багийн ID.
  final String id;

  /// Багийн нэр.
  final String name;

  /// Баг эзэмшигчийн ID.
  final String ownerUserId;

  /// Гишүүдийн тоо.
  final int memberCount;

  /// Морины тоо.
  final int horseCount;

  /// Баг үүсгэсэн огноо.
  final DateTime createdAt;

  /// Морины тоог нэмэгдүүлсэн шинэ Team буцаах.
  Team incrementHorseCount() =>
      copyWith(horseCount: horseCount + 1);

  /// Морины тоог бууруулсан шинэ Team буцаах.
  Team decrementHorseCount() =>
      copyWith(horseCount: (horseCount - 1).clamp(0, 999999));

  // ── copyWith ──────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  Team copyWith({
    String? id,
    String? name,
    String? ownerUserId,
    int? memberCount,
    int? horseCount,
    DateTime? createdAt,
  }) {
    return Team(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerUserId: ownerUserId ?? this.ownerUserId,
      memberCount: memberCount ?? this.memberCount,
      horseCount: horseCount ?? this.horseCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // ================================================================
  // Local JSON (camelCase)
  // ================================================================

  /// JSON-оос сэргээх (local format).
  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerUserId: json['ownerUserId'] as String,
      memberCount: json['memberCount'] as int? ?? 1,
      horseCount: json['horseCount'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ownerUserId': ownerUserId,
      'memberCount': memberCount,
      'horseCount': horseCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ================================================================
  // Supabase JSON (snake_case)
  // ================================================================

  /// Supabase snake_case JSON-оос сэргээх.
  factory Team.fromSupabaseJson(Map<String, dynamic> json) {
    return Team(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerUserId: json['owner_user_id'] as String,
      memberCount: 0, // member_count column was removed; count via API
      horseCount: json['horse_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'name': name,
      'owner_user_id': ownerUserId,
      // member_count was dropped — do not include
      'horse_count': horseCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ================================================================
  // Equality
  // ================================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Team &&
          id == other.id &&
          name == other.name &&
          ownerUserId == other.ownerUserId;

  @override
  int get hashCode => Object.hash(id, name, ownerUserId);

  @override
  String toString() => 'Team(id: $id, name: $name, memberCount: $memberCount)';
}
