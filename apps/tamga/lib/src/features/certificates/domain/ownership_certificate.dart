/// Гэрчилгээний итгэлцлийн түвшин.
enum TrustLevel {
  selfDeclared('Өөрийн мэдэгдсэн'),
  tamgaVerified('Tamga баталгаажуулсан'),
  stateVerified('Төрийн баталгаажуулсан');

  const TrustLevel(this.displayName);
  final String displayName;
}

/// Дижитал эзэмшлийн гэрчилгээний төлөв.
enum CertificateStatus {
  active('Идэвхтэй'),
  transferred('Шилжүүлсэн'),
  revoked('Цуцалсан');

  const CertificateStatus(this.displayName);

  final String displayName;

  static CertificateStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'transferred':
        return CertificateStatus.transferred;
      case 'revoked':
        return CertificateStatus.revoked;
      default:
        return CertificateStatus.active;
    }
  }
}

/// Дижитал эзэмшлийн гэрчилгээний domain model.
///
/// Морины эзэмшил, шилжүүлэлтийг баталгаажуулах зориулалттай.
class OwnershipCertificate {
  const OwnershipCertificate({
    required this.id,
    required this.horseId,
    required this.ownerId,
    required this.ownerName,
    required this.issueDate,
    required this.status,
    required this.qrCode,
    this.expiryDate,
    this.horseName,
    this.previousOwnerId,
    this.trustLevel = TrustLevel.selfDeclared,
    this.registrationDate,
    this.dataAgeDays,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String horseId;
  final String ownerId;
  final String ownerName;
  final DateTime issueDate;
  final DateTime? expiryDate;
  final CertificateStatus status;
  final String qrCode;
  final String? horseName;
  final String? previousOwnerId;

  /// Итгэлцлийн түвшин.
  final TrustLevel trustLevel;

  /// Морь бүртгэгдсэн огноо.
  final DateTime? registrationDate;

  /// Өгөгдлийн нас (хоногоор) — хэрэглэгчид харуулах.
  final int? dataAgeDays;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Хугацаа дууссан эсэх.
  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  /// Идэвхтэй эсэх (төлөв active + хугацаа дуусаагүй).
  bool get isActive => status == CertificateStatus.active && !isExpired;

  OwnershipCertificate copyWith({
    String? id,
    String? horseId,
    String? ownerId,
    String? ownerName,
    DateTime? issueDate,
    DateTime? expiryDate,
    CertificateStatus? status,
    String? qrCode,
    String? horseName,
    String? previousOwnerId,
    TrustLevel? trustLevel,
    DateTime? registrationDate,
    int? dataAgeDays,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool clearExpiryDate = false,
    bool clearHorseName = false,
    bool clearPreviousOwnerId = false,
    bool clearRegistrationDate = false,
  }) {
    return OwnershipCertificate(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      issueDate: issueDate ?? this.issueDate,
      expiryDate: clearExpiryDate ? null : expiryDate ?? this.expiryDate,
      status: status ?? this.status,
      qrCode: qrCode ?? this.qrCode,
      horseName: clearHorseName ? null : horseName ?? this.horseName,
      previousOwnerId: clearPreviousOwnerId
          ? null
          : previousOwnerId ?? this.previousOwnerId,
      trustLevel: trustLevel ?? this.trustLevel,
      registrationDate: clearRegistrationDate
          ? null
          : (registrationDate ?? this.registrationDate),
      dataAgeDays: dataAgeDays ?? this.dataAgeDays,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── Serialization — Supabase (snake_case) ──────────────────

  factory OwnershipCertificate.fromSupabaseJson(Map<String, dynamic> json) {
    return OwnershipCertificate(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      ownerId: json['owner_id'] as String,
      ownerName: json['owner_name'] as String,
      issueDate: DateTime.parse(json['issue_date'] as String),
      expiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'] as String)
          : null,
      status: CertificateStatus.fromString(json['status'] as String),
      qrCode: json['qr_code'] as String,
      horseName: json['horse_name'] as String?,
      previousOwnerId: json['previous_owner_id'] as String?,
      trustLevel: TrustLevel.values.firstWhere(
        (t) => t.name == json['trust_level'],
        orElse: () => TrustLevel.selfDeclared,
      ),
      registrationDate: json['registration_date'] != null
          ? DateTime.tryParse(json['registration_date'] as String)
          : null,
      dataAgeDays: json['data_age_days'] as int?,
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson({required String userId}) {
    return {
      'horse_id': horseId,
      'owner_id': userId,
      'owner_name': ownerName,
      'issue_date': issueDate.toIso8601String(),
      'expiry_date': expiryDate?.toIso8601String(),
      'status': status.name,
      'qr_code': qrCode,
      'previous_owner_id': previousOwnerId,
      'trust_level': trustLevel.name,
      'registration_date': registrationDate?.toIso8601String(),
      'data_age_days': dataAgeDays,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OwnershipCertificate &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          horseId == other.horseId &&
          ownerId == other.ownerId &&
          status == other.status;

  @override
  int get hashCode => Object.hash(id, horseId, ownerId, status);

  @override
  String toString() =>
      'OwnershipCertificate(id: $id, horse: $horseId, status: ${status.name})';
}

/// Гэрчилгээ шалгалтын үр дүн.
class CertificateVerification {
  const CertificateVerification({
    required this.isValid,
    required this.certificate,
    required this.message,
  });

  final bool isValid;
  final OwnershipCertificate certificate;
  final String message;
}
