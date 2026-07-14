/// Жүчээний багийн гишүүн (ажилтан, үйлчлүүлэгч).
library;

/// Жүчээний багийн гишүүний үүрэг.
enum StableRole {
  /// Эзэмшигч / менежер.
  owner,

  /// Ажилтан (уяач, тэжээвэр).
  staff,

  /// Үйлчлүүлэгч (морио байрлуулсан эзэн).
  client,
}

/// Жүчээний багийн гишүүн.
class StableMember {
  const StableMember({
    required this.id,
    required this.stableId,
    required this.displayName,
    required this.phone,
    this.email,
    required this.role,
    required this.joinedAt,
    this.isActive = true,
    this.horseIds = const [],
  });

  final String id;
  final String stableId;
  final String displayName;
  final String phone;
  final String? email;
  final StableRole role;
  final DateTime joinedAt;
  final bool isActive;
  final List<String> horseIds;

  StableMember copyWith({
    String? id,
    String? stableId,
    String? displayName,
    String? phone,
    String? email,
    StableRole? role,
    DateTime? joinedAt,
    bool? isActive,
    List<String>? horseIds,
  }) {
    return StableMember(
      id: id ?? this.id,
      stableId: stableId ?? this.stableId,
      displayName: displayName ?? this.displayName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      role: role ?? this.role,
      joinedAt: joinedAt ?? this.joinedAt,
      isActive: isActive ?? this.isActive,
      horseIds: horseIds ?? this.horseIds,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'stableId': stableId,
    'displayName': displayName,
    'phone': phone,
    'email': email,
    'role': role.name,
    'joinedAt': joinedAt.toIso8601String(),
    'isActive': isActive,
    'horseIds': horseIds,
  };

  factory StableMember.fromJson(Map<String, dynamic> json) => StableMember(
    id: json['id'] as String,
    stableId: json['stableId'] as String,
    displayName: json['displayName'] as String,
    phone: json['phone'] as String,
    email: json['email'] as String?,
    role: StableRole.values.byName(json['role'] as String),
    joinedAt: DateTime.parse(json['joinedAt'] as String),
    isActive: json['isActive'] as bool? ?? true,
    horseIds: List<String>.from(json['horseIds'] as List? ?? []),
  );

  String get roleLabel {
    switch (role) {
      case StableRole.owner:
        return 'Эзэмшигч';
      case StableRole.staff:
        return 'Ажилтан';
      case StableRole.client:
        return 'Үйлчлүүлэгч';
    }
  }
}
