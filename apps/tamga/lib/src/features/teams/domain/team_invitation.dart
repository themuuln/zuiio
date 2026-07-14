import 'team_member.dart';

/// Урилгын төлөв.
///
/// - `pending` — хүлээгдэж буй
/// - `accepted` — хүлээн зөвшөөрөгдсөн
/// - `declined` — татгалзсан
enum InvitationStatus {
  pending,
  accepted,
  declined;

  /// Монгол хэл дээрх төлөвийн нэр.
  String get displayName => switch (this) {
    InvitationStatus.pending => 'Хүлээгдэж буй',
    InvitationStatus.accepted => 'Хүлээн зөвшөөрөгдсөн',
    InvitationStatus.declined => 'Татгалзсан',
  };
}

/// Урилгын domain model.
///
/// - `id` — урилгын өвөрмөц ID
/// - `teamId` — багийн ID
/// - `teamName` — багийн нэр (denormalized, дэлгэцэнд харуулахад)
/// - `invitedUserId` — уригдсан хэрэглэгчийн ID (утас эсвэл имэйл)
/// - `invitedByUserId` — урьсан хэрэглэгчийн ID
/// - `role` — уригдсан гишүүний дүр
/// - `status` — урилгын төлөв
/// - `createdAt` — урилга илгээсэн огноо
class TeamInvitation {
  const TeamInvitation({
    required this.id,
    required this.teamId,
    required this.teamName,
    required this.invitedUserId,
    required this.invitedByUserId,
    required this.role,
    this.status = InvitationStatus.pending,
    required this.createdAt,
  });

  /// Урилгын ID.
  final String id;

  /// Багийн ID.
  final String teamId;

  /// Багийн нэр (дэлгэцэнд харуулахад).
  final String teamName;

  /// Уригдсан хэрэглэгчийн ID.
  final String invitedUserId;

  /// Урьсан хэрэглэгчийн ID.
  final String invitedByUserId;

  /// Уригдсан гишүүний дүр.
  final TeamRole role;

  /// Урилгын төлөв.
  final InvitationStatus status;

  /// Урилга илгээсэн огноо.
  final DateTime createdAt;

  // ── copyWith ──────────────────────────────────────────────────────

  /// Тодорхой талбаруудыг шинэчлэх.
  TeamInvitation copyWith({
    String? id,
    String? teamId,
    String? teamName,
    String? invitedUserId,
    String? invitedByUserId,
    TeamRole? role,
    InvitationStatus? status,
    DateTime? createdAt,
  }) {
    return TeamInvitation(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      teamName: teamName ?? this.teamName,
      invitedUserId: invitedUserId ?? this.invitedUserId,
      invitedByUserId: invitedByUserId ?? this.invitedByUserId,
      role: role ?? this.role,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // ================================================================
  // Local JSON (camelCase)
  // ================================================================

  /// JSON-оос сэргээх (local format).
  factory TeamInvitation.fromJson(Map<String, dynamic> json) {
    return TeamInvitation(
      id: json['id'] as String,
      teamId: json['teamId'] as String,
      teamName: json['teamName'] as String,
      invitedUserId: json['invitedUserId'] as String,
      invitedByUserId: json['invitedByUserId'] as String,
      role: TeamRole.values.byName(json['role'] as String),
      status: InvitationStatus.values.byName(json['status'] as String? ?? 'pending'),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// JSON хэлбэрт шилжүүлэх (local format).
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teamId': teamId,
      'teamName': teamName,
      'invitedUserId': invitedUserId,
      'invitedByUserId': invitedByUserId,
      'role': role.name,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ================================================================
  // Supabase JSON (snake_case)
  // ================================================================

  /// Supabase snake_case JSON-оос сэргээх.
  factory TeamInvitation.fromSupabaseJson(Map<String, dynamic> json) {
    return TeamInvitation(
      id: json['id'] as String,
      teamId: json['team_id'] as String,
      teamName: json['team_name'] as String,
      invitedUserId: json['invited_user_id'] as String,
      invitedByUserId: json['invited_by_user_id'] as String,
      role: TeamRole.values.byName(json['role'] as String),
      status: InvitationStatus.values.byName(json['status'] as String? ?? 'pending'),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Supabase snake_case JSON хэлбэрт шилжүүлэх.
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'team_id': teamId,
      'team_name': teamName,
      'invited_user_id': invitedUserId,
      'invited_by_user_id': invitedByUserId,
      'role': role.name,
      'status': status.name,
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
      other is TeamInvitation &&
          id == other.id &&
          teamId == other.teamId &&
          invitedUserId == other.invitedUserId &&
          status == other.status;

  @override
  int get hashCode => Object.hash(id, teamId, invitedUserId, status);

  @override
  String toString() =>
      'TeamInvitation(id: $id, teamId: $teamId, '
      'invitedUserId: $invitedUserId, status: ${status.name})';
}
