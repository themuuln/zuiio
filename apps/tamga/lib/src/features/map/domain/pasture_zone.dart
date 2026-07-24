/// Бэлчээрийн бүс — тойргийн хэлбэртэй газрын нэгж.
///
/// Нэг эзэн хэд хэдэн бэлчээр эзэмшиж болох бөгөөд
/// морь бүрийг нэг бэлчээрт хамааруулж болно.
class PastureZone {
  const PastureZone({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.centerLat,
    required this.centerLng,
    required this.radiusKm,
    this.assignedHorseIds = const [],
    this.lastRotationDate,
    this.maxOccupancyDuration = const Duration(days: 14),
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String ownerId;
  final double centerLat;
  final double centerLng;
  final double radiusKm;
  final List<String> assignedHorseIds;
  final DateTime? lastRotationDate;
  final Duration maxOccupancyDuration;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  /// Хугацаа дууссан эсэх — lastRotationDate-ээс хойшхи хугацаа
  /// maxOccupancyDuration-ээс их эсэх.
  bool get isOverdue {
    if (lastRotationDate == null) return true;
    return DateTime.now().difference(lastRotationDate!) > maxOccupancyDuration;
  }

  /// Хугацаа дуусахад үлдсэн өдрийн тоо. Хугацаа дууссан бол 0.
  int get remainingDays {
    if (lastRotationDate == null) return 0;
    final remaining =
        maxOccupancyDuration - DateTime.now().difference(lastRotationDate!);
    return remaining.inDays > 0 ? remaining.inDays : 0;
  }

  PastureZone copyWith({
    String? id,
    String? name,
    String? ownerId,
    double? centerLat,
    double? centerLng,
    double? radiusKm,
    List<String>? assignedHorseIds,
    DateTime? lastRotationDate,
    Duration? maxOccupancyDuration,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PastureZone(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      centerLat: centerLat ?? this.centerLat,
      centerLng: centerLng ?? this.centerLng,
      radiusKm: radiusKm ?? this.radiusKm,
      assignedHorseIds: assignedHorseIds ?? this.assignedHorseIds,
      lastRotationDate: lastRotationDate ?? this.lastRotationDate,
      maxOccupancyDuration: maxOccupancyDuration ?? this.maxOccupancyDuration,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'owner_id': ownerId,
    'center_lat': centerLat,
    'center_lng': centerLng,
    'radius_km': radiusKm,
    'assigned_horse_ids': assignedHorseIds,
    'last_rotation_date': lastRotationDate?.toIso8601String(),
    'max_occupancy_days': maxOccupancyDuration.inDays,
    'is_active': isActive,
    'created_at': createdAt?.toIso8601String(),
    'updated_at': updatedAt?.toIso8601String(),
  };

  factory PastureZone.fromJson(Map<String, dynamic> json) {
    return PastureZone(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerId: json['owner_id'] as String,
      centerLat: (json['center_lat'] as num).toDouble(),
      centerLng: (json['center_lng'] as num).toDouble(),
      radiusKm: (json['radius_km'] as num).toDouble(),
      assignedHorseIds:
          (json['assigned_horse_ids'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      lastRotationDate: json['last_rotation_date'] != null
          ? DateTime.parse(json['last_rotation_date'] as String)
          : null,
      maxOccupancyDuration: Duration(
        days: json['max_occupancy_days'] as int? ?? 14,
      ),
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }
}

/// Бэлчээрт морь хамааруулах мэдээлэл — Supabase-ийн холбох хүснэгт.
class PastureAssignment {
  const PastureAssignment({
    required this.id,
    required this.zoneId,
    required this.horseId,
    required this.assignedAt,
  });

  final String id;
  final String zoneId;
  final String horseId;
  final DateTime assignedAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'zone_id': zoneId,
    'horse_id': horseId,
    'assigned_at': assignedAt.toIso8601String(),
  };

  factory PastureAssignment.fromJson(Map<String, dynamic> json) {
    return PastureAssignment(
      id: json['id'] as String,
      zoneId: json['zone_id'] as String,
      horseId: json['horse_id'] as String,
      assignedAt: DateTime.parse(json['assigned_at'] as String),
    );
  }
}

/// Бэлчээрийн анхааруулга — хугацаа дуусах эсвэл хэтэрсэн.
class ZoneAlert {
  const ZoneAlert({
    required this.zoneId,
    required this.zoneName,
    required this.alertType,
    required this.horseCount,
    this.remainingDays,
  });

  final String zoneId;
  final String zoneName;
  final ZoneAlertType alertType;
  final int horseCount;
  final int? remainingDays;

  Map<String, dynamic> toJson() => {
    'zone_id': zoneId,
    'zone_name': zoneName,
    'alert_type': alertType.name,
    'horse_count': horseCount,
    'remaining_days': remainingDays,
  };

  factory ZoneAlert.fromJson(Map<String, dynamic> json) {
    return ZoneAlert(
      zoneId: json['zone_id'] as String,
      zoneName: json['zone_name'] as String,
      alertType: ZoneAlertType.values.firstWhere(
        (e) => e.name == json['alert_type'],
      ),
      horseCount: json['horse_count'] as int? ?? 0,
      remainingDays: json['remaining_days'] as int?,
    );
  }
}

enum ZoneAlertType { overdue, approaching, full }
