/// Багийн үйлдлийн түүхийн domain model (audit trail).
///
/// - `id` — бүртгэлийн өвөрмөц ID
/// - `teamId` — багийн ID
/// - `userId` — үйлдэл хийсэн хэрэглэгчийн ID
/// - `action` — үйлдлийн төрөл ('member_joined', 'horse_added', 'role_changed', г.м.)
/// - `details` — нэмэлт мэдээлэл (JSON)
/// - `createdAt` — үйлдэл хийсэн огноо
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class TeamActivity {
  const TeamActivity({
    required this.id,
    required this.teamId,
    this.userId,
    required this.action,
    this.details = const {},
    required this.createdAt,
  });

  /// Бүртгэлийн ID.
  final String id;

  /// Багийн ID.
  final String teamId;

  /// Үйлдэл хийсэн хэрэглэгчийн ID.
  final String? userId;

  /// Үйлдлийн төрөл.
  ///
  /// Түгээмэл утгууд:
  /// - `member_joined` — шинэ гишүүн нэгдсэн
  /// - `member_left` — гишүүн гарсан
  /// - `horse_added` — морь нэмсэн
  /// - `horse_removed` — морь хассан
  /// - `role_changed` — дүр өөрчилсөн
  /// - `team_created` — баг үүсгэсэн
  final String action;

  /// Нэмэлт мэдээлэл.
  final Map<String, dynamic> details;

  /// Үйлдэл хийсэн огноо.
  final DateTime createdAt;

  // ── copyWith ──────────────────────────────────────────────────

  TeamActivity copyWith({
    String? id,
    String? teamId,
    String? userId,
    String? action,
    Map<String, dynamic>? details,
    DateTime? createdAt,
  }) {
    return TeamActivity(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      userId: userId ?? this.userId,
      action: action ?? this.action,
      details: details ?? this.details,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // ================================================================
  // Local JSON (camelCase)
  // ================================================================

  /// JSON-оос сэргээх (local format).
  factory TeamActivity.fromJson(Map<String, dynamic> json) {
    return TeamActivity(
      id: json['id'] as String,
      teamId: json['teamId'] as String,
      userId: json['userId'] as String?,
      action: json['action'] as String,
      details: (json['details'] as Map<String, dynamic>?) ?? const {},
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teamId': teamId,
      'userId': userId,
      'action': action,
      'details': details,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ================================================================
  // Supabase JSON (snake_case)
  // ================================================================

  /// Supabase snake_case JSON-оос сэргээх.
  factory TeamActivity.fromSupabaseJson(Map<String, dynamic> json) {
    return TeamActivity(
      id: json['id'] as String,
      teamId: json['team_id'] as String,
      userId: json['user_id'] as String?,
      action: json['action'] as String,
      details: (json['details'] as Map<String, dynamic>?) ?? const {},
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'team_id': teamId,
      'user_id': userId,
      'action': action,
      'details': details,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // ================================================================
  // Equality
  // ================================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TeamActivity &&
          id == other.id &&
          teamId == other.teamId &&
          action == other.action;

  @override
  int get hashCode => Object.hash(id, teamId, action);

  @override
  String toString() =>
      'TeamActivity(id: $id, teamId: $teamId, action: $action)';
}
