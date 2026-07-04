/// Breeding record domain model with gestation tracking and foal information.
class BreedingRecord {
  const BreedingRecord({
    required this.id,
    required this.sireId,
    required this.sireName,
    required this.damId,
    required this.damName,
    required this.breedingDate,
    required this.expectedFoalingDate,
    required this.status,
    required this.herdLabel,
    required this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.actualFoalingDate,
    this.foalId,
    this.foalName,
    this.foalGender,
    this.foalColor,
  });

  final String id;
  final String sireId;
  final String sireName;
  final String damId;
  final String damName;
  final DateTime breedingDate;
  final DateTime expectedFoalingDate;

  /// 'Хээлтсэн' (Pending/Confirmed), 'Төллөсөн' (Foaled), 'Хээл хаясан' (Aborted)
  final String status;
  final String herdLabel;
  final String notes;

  /// Actual date when the foal was born (null until foaled).
  final DateTime? actualFoalingDate;

  /// Reference to the foal's horse record (null until foaled).
  final String? foalId;

  /// Foal information (populated after foaling).
  final String? foalName;
  final String? foalGender;
  final String? foalColor;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── Computed properties ──────────────────────────────────────

  /// Total gestation period for horses (~340 days).
  static const int gestationDays = 340;

  /// Days elapsed since breeding.
  int get daysElapsed => DateTime.now().difference(breedingDate).inDays;

  /// Days remaining until expected due date.
  int get daysRemaining =>
      expectedFoalingDate.difference(DateTime.now()).inDays;

  /// Gestation progress as a fraction (0.0 to 1.0+).
  double get gestationProgress => (daysElapsed / gestationDays).clamp(0.0, 1.5);

  /// Whether the due date has passed.
  bool get isOverdue => DateTime.now().isAfter(expectedFoalingDate);

  /// Whether the mare is in the final 30 days of gestation.
  bool get isApproaching => daysRemaining <= 30 && daysRemaining > 0;

  /// Status color category for UI.
  GestationStatusCategory get statusCategory {
    if (status == 'Төллөсөн') return GestationStatusCategory.foaled;
    if (status == 'Хээл хаясан') return GestationStatusCategory.aborted;
    if (isOverdue) return GestationStatusCategory.overdue;
    if (isApproaching) return GestationStatusCategory.approaching;
    return GestationStatusCategory.healthy;
  }

  // ── Copy with ────────────────────────────────────────────────

  BreedingRecord copyWith({
    String? id,
    String? sireId,
    String? sireName,
    String? damId,
    String? damName,
    DateTime? breedingDate,
    DateTime? expectedFoalingDate,
    String? status,
    String? herdLabel,
    String? notes,
    DateTime? actualFoalingDate,
    String? foalId,
    String? foalName,
    String? foalGender,
    String? foalColor,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool clearFoalId = false,
    bool clearActualFoalingDate = false,
    bool clearFoalInfo = false,
  }) {
    return BreedingRecord(
      id: id ?? this.id,
      sireId: sireId ?? this.sireId,
      sireName: sireName ?? this.sireName,
      damId: damId ?? this.damId,
      damName: damName ?? this.damName,
      breedingDate: breedingDate ?? this.breedingDate,
      expectedFoalingDate: expectedFoalingDate ?? this.expectedFoalingDate,
      status: status ?? this.status,
      herdLabel: herdLabel ?? this.herdLabel,
      notes: notes ?? this.notes,
      actualFoalingDate: clearActualFoalingDate
          ? null
          : actualFoalingDate ?? this.actualFoalingDate,
      foalId: clearFoalId ? null : foalId ?? this.foalId,
      foalName: clearFoalInfo ? null : foalName ?? this.foalName,
      foalGender: clearFoalInfo ? null : foalGender ?? this.foalGender,
      foalColor: clearFoalInfo ? null : foalColor ?? this.foalColor,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── JSON serialization ───────────────────────────────────────

  /// Create from Supabase row (snake_case keys).
  factory BreedingRecord.fromSupabaseJson(Map<String, dynamic> row) {
    return BreedingRecord(
      id: row['id'] as String,
      sireId: row['sire_id'] as String,
      sireName: row['sire_name'] as String? ?? '',
      damId: row['dam_id'] as String,
      damName: row['dam_name'] as String? ?? '',
      breedingDate:
          DateTime.tryParse(row['breeding_date'] as String? ?? '') ??
          DateTime.now(),
      expectedFoalingDate:
          DateTime.tryParse(row['expected_foaling_date'] as String? ?? '') ??
          DateTime.now(),
      status: row['status'] as String? ?? 'Хээлтсэн',
      herdLabel: row['herd_label'] as String? ?? '',
      notes: row['notes'] as String? ?? '',
      actualFoalingDate: row['actual_foaling_date'] != null
          ? DateTime.tryParse(row['actual_foaling_date'] as String)
          : null,
      foalId: row['foal_id'] as String?,
      foalName: row['foal_name'] as String?,
      foalGender: row['foal_gender'] as String?,
      foalColor: row['foal_color'] as String?,
      createdAt:
          DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(row['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  /// Serialize to Supabase row (snake_case keys).
  Map<String, dynamic> toSupabaseJson({String? ownerId}) {
    return {
      'id': id,
      'owner_id': ?ownerId,
      'sire_id': sireId,
      'sire_name': sireName,
      'dam_id': damId,
      'dam_name': damName,
      'breeding_date': breedingDate.toIso8601String(),
      'expected_foaling_date': expectedFoalingDate.toIso8601String(),
      'status': status,
      'herd_label': herdLabel,
      'notes': notes,
      if (actualFoalingDate != null)
        'actual_foaling_date': actualFoalingDate!.toIso8601String(),
      if (foalId != null) 'foal_id': foalId,
      if (foalName != null) 'foal_name': foalName,
      if (foalGender != null) 'foal_gender': foalGender,
      if (foalColor != null) 'foal_color': foalColor,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  factory BreedingRecord.fromJson(Map<String, dynamic> json) {
    return BreedingRecord(
      id: json['id'] as String,
      sireId: json['sireId'] as String,
      sireName: json['sireName'] as String,
      damId: json['damId'] as String,
      damName: json['damName'] as String,
      breedingDate: DateTime.parse(json['breedingDate'] as String),
      expectedFoalingDate: DateTime.parse(
        json['expectedFoalingDate'] as String,
      ),
      status: json['status'] as String,
      herdLabel: json['herdLabel'] as String,
      notes: json['notes'] as String,
      actualFoalingDate: json['actualFoalingDate'] != null
          ? DateTime.parse(json['actualFoalingDate'] as String)
          : null,
      foalId: json['foalId'] as String?,
      foalName: json['foalName'] as String?,
      foalGender: json['foalGender'] as String?,
      foalColor: json['foalColor'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sireId': sireId,
      'sireName': sireName,
      'damId': damId,
      'damName': damName,
      'breedingDate': breedingDate.toIso8601String(),
      'expectedFoalingDate': expectedFoalingDate.toIso8601String(),
      'status': status,
      'herdLabel': herdLabel,
      'notes': notes,
      'actualFoalingDate': actualFoalingDate?.toIso8601String(),
      'foalId': foalId,
      'foalName': foalName,
      'foalGender': foalGender,
      'foalColor': foalColor,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

/// Visual status categories for gestation tracking UI.
enum GestationStatusCategory {
  /// Healthy gestation (green).
  healthy,

  /// Approaching due date within 30 days (yellow).
  approaching,

  /// Overdue (red).
  overdue,

  /// Successfully foaled.
  foaled,

  /// Aborted/failed pregnancy.
  aborted,
}
