class ProfileSettings {
  const ProfileSettings({
    required this.autoSyncEnabled,
    this.lastSyncCheckAt,
    this.role = 'casual',
    this.rank = 'no_rank',
  });

  final bool autoSyncEnabled;
  final DateTime? lastSyncCheckAt;
  final String role;
  final String rank;

  ProfileSettings copyWith({
    bool? autoSyncEnabled,
    DateTime? lastSyncCheckAt,
    bool clearLastSyncCheckAt = false,
    String? role,
    String? rank,
  }) {
    return ProfileSettings(
      autoSyncEnabled: autoSyncEnabled ?? this.autoSyncEnabled,
      lastSyncCheckAt: clearLastSyncCheckAt
          ? null
          : lastSyncCheckAt ?? this.lastSyncCheckAt,
      role: role ?? this.role,
      rank: rank ?? this.rank,
    );
  }

  factory ProfileSettings.fromJson(Map<String, dynamic> json) {
    return ProfileSettings(
      autoSyncEnabled: json['autoSyncEnabled'] as bool? ?? false,
      lastSyncCheckAt: json['lastSyncCheckAt'] == null
          ? null
          : DateTime.tryParse(json['lastSyncCheckAt'] as String),
      role: json['role'] as String? ?? 'casual',
      rank: json['rank'] as String? ?? 'no_rank',
    );
  }

  factory ProfileSettings.fromSupabaseJson(Map<String, dynamic> json) {
    return ProfileSettings(
      autoSyncEnabled: json['auto_sync_enabled'] as bool? ?? false,
      lastSyncCheckAt: json['last_sync_check_at'] == null
          ? null
          : DateTime.tryParse(json['last_sync_check_at'] as String),
      role: json['role'] as String? ?? 'casual',
      rank: json['rank'] as String? ?? 'no_rank',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'autoSyncEnabled': autoSyncEnabled,
      'lastSyncCheckAt': lastSyncCheckAt?.toIso8601String(),
      'role': role,
      'rank': rank,
    };
  }

  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'auto_sync_enabled': autoSyncEnabled,
      'last_sync_check_at': lastSyncCheckAt?.toIso8601String(),
      'role': role,
      'rank': rank,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
