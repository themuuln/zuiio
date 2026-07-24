/// Багийн гишүүний эрх.
///
/// - `owner` — бүх эрхтэй
/// - `manager` — ихэнх эрхтэй
/// - `vet` — эрүүл мэндийн эрхтэй
/// - `groom` — тэжээвэр, сургалтын эрхтэй
/// - `viewer` — зөвхөн харах эрхтэй
enum TeamRole {
  owner,
  manager,
  vet,
  groom,
  viewer;

  /// Монгол хэл дээрх дүрийн нэр.
  String get displayName => switch (this) {
    TeamRole.owner => 'Эзэмшигч',
    TeamRole.manager => 'Менежер',
    TeamRole.vet => 'Эмч',
    TeamRole.groom => 'Тэжээвэр',
    TeamRole.viewer => 'Үзэгч',
  };

  /// Тухайн дүрийн анхдагч зөвшөөрлүүд.
  List<TeamPermission> get defaultPermissions => switch (this) {
    TeamRole.owner => TeamPermission.values.toList(),
    TeamRole.manager => [
      TeamPermission.inviteMembers,
      TeamPermission.removeMembers,
      TeamPermission.updateRoles,
      TeamPermission.manageHorses,
      TeamPermission.viewHealth,
      TeamPermission.manageHealth,
      TeamPermission.viewTraining,
      TeamPermission.manageTraining,
      TeamPermission.viewFinancial,
    ],
    TeamRole.vet => [
      TeamPermission.viewHealth,
      TeamPermission.manageHealth,
      TeamPermission.viewTraining,
    ],
    TeamRole.groom => [
      TeamPermission.viewHealth,
      TeamPermission.viewTraining,
      TeamPermission.manageTraining,
    ],
    TeamRole.viewer => [TeamPermission.viewHealth, TeamPermission.viewTraining],
  };
}

/// Багийн гишүүний зөвшөөрлийн төрөл.
enum TeamPermission {
  inviteMembers,
  removeMembers,
  updateRoles,
  manageHorses,
  viewHealth,
  manageHealth,
  viewTraining,
  manageTraining,
  viewFinancial;

  /// Монгол хэл дээрх зөвшөөрлийн нэр.
  String get displayName => switch (this) {
    TeamPermission.inviteMembers => 'Гишүүд урих',
    TeamPermission.removeMembers => 'Гишүүд хасах',
    TeamPermission.updateRoles => 'Дүр өөрчлөх',
    TeamPermission.manageHorses => 'Морь удирдах',
    TeamPermission.viewHealth => 'Эрүүл мэнд харах',
    TeamPermission.manageHealth => 'Эрүүл мэнд удирдах',
    TeamPermission.viewTraining => 'Сургалт харах',
    TeamPermission.manageTraining => 'Сургалт удирдах',
    TeamPermission.viewFinancial => 'Санхүү харах',
  };
}

/// Багийн гишүүний domain model.
///
/// - `id` — гишүүний өвөрмөц ID
/// - `teamId` — багийн ID
/// - `userId` — хэрэглэгчийн ID
/// - `role` — гишүүний дүр
/// - `permissions` — гишүүний зөвшөөрлүүд (хоосон бол дүрийн анхдагч зөвшөөрлүүд)
/// - `joinedAt` — нэгдсэн огноо
///
/// Бүх serialization-ийг нэг дор:
/// - `toJson()` / `fromJson()` — локал хадгалалтад (camelCase)
/// - `toSupabaseJson()` / `fromSupabaseJson()` — Supabase-д (snake_case)
class TeamMember {
  const TeamMember({
    required this.id,
    required this.teamId,
    required this.userId,
    required this.role,
    this.permissions = const [],
    required this.joinedAt,
  });

  /// Гишүүний ID.
  final String id;

  /// Багийн ID.
  final String teamId;

  /// Хэрэглэгчийн ID.
  final String userId;

  /// Гишүүний дүр.
  final TeamRole role;

  /// Гишүүний зөвшөөрлүүд (хоосон бол дүрийн анхдагч зөвшөөрлүүд).
  final List<TeamPermission> permissions;

  /// Нэгдсэн огноо.
  final DateTime joinedAt;

  /// Энэ гишүүний идэвхтэй зөвшөөрлүүд.
  /// permissions жагсаалт хоосон бол дүрийн анхдагч зөвшөөрлүүдийг буцаана.
  List<TeamPermission> get effectivePermissions =>
      permissions.isEmpty ? role.defaultPermissions : permissions;

  /// Гишүүн тодорхой зөвшөөрөлтэй эсэх.
  bool hasPermission(TeamPermission permission) =>
      effectivePermissions.contains(permission);

  // ── copyWith ──────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  TeamMember copyWith({
    String? id,
    String? teamId,
    String? userId,
    TeamRole? role,
    List<TeamPermission>? permissions,
    DateTime? joinedAt,
  }) {
    return TeamMember(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      permissions: permissions ?? this.permissions,
      joinedAt: joinedAt ?? this.joinedAt,
    );
  }

  // ================================================================
  // Local JSON (camelCase)
  // ================================================================

  /// JSON-оос сэргээх (local format).
  factory TeamMember.fromJson(Map<String, dynamic> json) {
    return TeamMember(
      id: json['id'] as String,
      teamId: json['teamId'] as String,
      userId: json['userId'] as String,
      role: TeamRole.values.byName(json['role'] as String),
      permissions:
          (json['permissions'] as List<dynamic>?)
              ?.map((e) => TeamPermission.values.byName(e as String))
              .toList() ??
          [],
      joinedAt: DateTime.parse(json['joinedAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teamId': teamId,
      'userId': userId,
      'role': role.name,
      'permissions': permissions.map((p) => p.name).toList(),
      'joinedAt': joinedAt.toIso8601String(),
    };
  }

  // ================================================================
  // Supabase JSON (snake_case)
  // ================================================================

  /// Supabase snake_case JSON-оос сэргээх.
  factory TeamMember.fromSupabaseJson(Map<String, dynamic> json) {
    return TeamMember(
      id: json['id'] as String,
      teamId: json['team_id'] as String,
      userId: json['user_id'] as String,
      role: TeamRole.values.byName(json['role'] as String),
      permissions:
          (json['permissions'] as List<dynamic>?)
              ?.map((e) => TeamPermission.values.byName(e as String))
              .toList() ??
          [],
      joinedAt: DateTime.parse(json['joined_at'] as String),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'team_id': teamId,
      'user_id': userId,
      'role': role.name,
      'permissions': permissions.map((p) => p.name).toList(),
      'joined_at': joinedAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  // ================================================================
  // Equality
  // ================================================================

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TeamMember &&
          id == other.id &&
          teamId == other.teamId &&
          userId == other.userId &&
          role == other.role;

  @override
  int get hashCode => Object.hash(id, teamId, userId, role);

  @override
  String toString() =>
      'TeamMember(id: $id, teamId: $teamId, role: ${role.name})';
}
