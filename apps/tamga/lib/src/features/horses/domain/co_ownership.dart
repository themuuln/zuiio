class CoOwnershipRecord {
  const CoOwnershipRecord({
    required this.id,
    required this.horseId,
    required this.coOwnerName,
    required this.phone,
    required this.role,
    required this.permissions,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String horseId;
  final String coOwnerName;
  final String phone;
  final String
  role; // 'Эзэмшигч' (Owner), 'Туслах уяач' (Assistant Trainer), 'Холбоотон уяач' (Associate Trainer)
  final List<String>
  permissions; // ['read', 'write_health', 'write_events', 'all']
  final DateTime createdAt;
  final DateTime updatedAt;

  CoOwnershipRecord copyWith({
    String? id,
    String? horseId,
    String? coOwnerName,
    String? phone,
    String? role,
    List<String>? permissions,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CoOwnershipRecord(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      coOwnerName: coOwnerName ?? this.coOwnerName,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      permissions: permissions ?? this.permissions,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory CoOwnershipRecord.fromJson(Map<String, dynamic> json) {
    return CoOwnershipRecord(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      coOwnerName: json['coOwnerName'] as String,
      phone: json['phone'] as String,
      role: json['role'] as String,
      permissions: List<String>.from(json['permissions'] as List),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'coOwnerName': coOwnerName,
      'phone': phone,
      'role': role,
      'permissions': permissions,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
