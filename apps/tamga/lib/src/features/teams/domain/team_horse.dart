/// Баг-морины холбооны domain model.
///
/// - `id` — холбооны өвөрмөц ID
/// - `teamId` — багийн ID
/// - `horseId` — морины ID
/// - `addedBy` — нэмсэн хэрэглэгчийн ID
/// - `addedAt` — нэмсэн огноо
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class TeamHorse {
  const TeamHorse({
    required this.id,
    required this.teamId,
    required this.horseId,
    this.addedBy,
    required this.addedAt,
  });

  /// Холбооны ID.
  final String id;

  /// Багийн ID.
  final String teamId;

  /// Морины ID.
  final String horseId;

  /// Нэмсэн хэрэглэгчийн ID.
  final String? addedBy;

  /// Нэмсэн огноо.
  final DateTime addedAt;

  // ── copyWith ──────────────────────────────────────────────────

  TeamHorse copyWith({
    String? id,
    String? teamId,
    String? horseId,
    String? addedBy,
    DateTime? addedAt,
  }) {
    return TeamHorse(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      horseId: horseId ?? this.horseId,
      addedBy: addedBy ?? this.addedBy,
      addedAt: addedAt ?? this.addedAt,
    );
  }

  // ================================================================
  // Local JSON (camelCase)
  // ================================================================

  /// JSON-оос сэргээх (local format).
  factory TeamHorse.fromJson(Map<String, dynamic> json) {
    return TeamHorse(
      id: json['id'] as String,
      teamId: json['teamId'] as String,
      horseId: json['horseId'] as String,
      addedBy: json['addedBy'] as String?,
      addedAt: DateTime.parse(json['addedAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teamId': teamId,
      'horseId': horseId,
      'addedBy': addedBy,
      'addedAt': addedAt.toIso8601String(),
    };
  }

  // ================================================================
  // Supabase JSON (snake_case)
  // ================================================================

  /// Supabase snake_case JSON-оос сэргээх.
  factory TeamHorse.fromSupabaseJson(Map<String, dynamic> json) {
    return TeamHorse(
      id: json['id'] as String,
      teamId: json['team_id'] as String,
      horseId: json['horse_id'] as String,
      addedBy: json['added_by'] as String?,
      addedAt: DateTime.parse(json['added_at'] as String),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'team_id': teamId,
      'horse_id': horseId,
      'added_by': addedBy,
      'added_at': addedAt.toIso8601String(),
    };
  }

  // ================================================================
  // Equality
  // ================================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TeamHorse &&
          id == other.id &&
          teamId == other.teamId &&
          horseId == other.horseId;

  @override
  int get hashCode => Object.hash(id, teamId, horseId);

  @override
  String toString() => 'TeamHorse(id: $id, teamId: $teamId, horseId: $horseId)';
}
