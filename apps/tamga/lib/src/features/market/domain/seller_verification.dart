/// Худалдагчийн баталгаажуулалтын загварууд.
///
/// Утас болон E-Mongolia ID баталгаажуулалтын мэдээллийг хадгална.
library;

/// Утасны дугаар баталгаажуулалтын төлөв.
class SellerPhoneVerification {
  const SellerPhoneVerification({
    required this.id,
    required this.sellerId,
    required this.phone,
    this.isVerified = false,
    this.verifiedAt,
  });

  /// Өвөрмөц ID.
  final String id;

  /// Худалдагчийн ID.
  final String sellerId;

  /// Утасны дугаар (+976...).
  final String phone;

  /// Баталгаажуулсан эсэх.
  final bool isVerified;

  /// Баталгаажуулсан огноо.
  final DateTime? verifiedAt;

  // ── Copy ─────────────────────────────────────────────────────────

  SellerPhoneVerification copyWith({
    String? id,
    String? sellerId,
    String? phone,
    bool? isVerified,
    DateTime? verifiedAt,
    bool clearVerifiedAt = false,
  }) {
    return SellerPhoneVerification(
      id: id ?? this.id,
      sellerId: sellerId ?? this.sellerId,
      phone: phone ?? this.phone,
      isVerified: isVerified ?? this.isVerified,
      verifiedAt:
          clearVerifiedAt ? null : (verifiedAt ?? this.verifiedAt),
    );
  }

  // ── Serialization ────────────────────────────────────────────────

  factory SellerPhoneVerification.fromJson(Map<String, dynamic> json) {
    return SellerPhoneVerification(
      id: json['id'] as String,
      sellerId: json['sellerId'] as String,
      phone: json['phone'] as String,
      isVerified: json['isVerified'] as bool? ?? false,
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.parse(json['verifiedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'phone': phone,
      'isVerified': isVerified,
      'verifiedAt': verifiedAt?.toIso8601String(),
    };
  }
}

/// E-Mongolia ID баталгаажуулалтын загвар.
///
/// Монгол Улсын E-Mongolia системээр иргэний үнэмлэх
/// баталгаажуулахад ашиглагдана.
class EMongoliaVerification {
  const EMongoliaVerification({
    required this.id,
    required this.sellerId,
    this.eMongoliaId,
    this.fullName,
    this.isVerified = false,
    this.verifiedAt,
    this.submittedAt,
    this.documentUrls = const [],
    this.errorMessage,
  });

  /// Өвөрмөц ID.
  final String id;

  /// Худалдагчийн ID.
  final String sellerId;

  /// E-Mongolia системийн ID (E-Mongolia-аас буцаах).
  final String? eMongoliaId;

  /// Иргэний бүтэн нэр (E-Mongolia-аас буцаах).
  final String? fullName;

  /// E-Mongolia-аар баталгаажуулсан эсэх.
  final bool isVerified;

  /// Баталгаажуулсан огноо.
  final DateTime? verifiedAt;

  /// Баталгаажуулах хүсэлт илгээсэн огноо.
  final DateTime? submittedAt;

  /// Хавсаргасан баримт бичгийн URL-ууд.
  final List<String> documentUrls;

  /// Баталгаажуулалтад гарсан алдааны мэдээлэл.
  final String? errorMessage;

  // ── Derived ──────────────────────────────────────────────────────

  bool get hasSubmitted => submittedAt != null;

  bool get hasError => errorMessage != null && errorMessage!.isNotEmpty;

  // ── Copy ─────────────────────────────────────────────────────────

  EMongoliaVerification copyWith({
    String? id,
    String? sellerId,
    String? eMongoliaId,
    bool clearEMongoliaId = false,
    String? fullName,
    bool clearFullName = false,
    bool? isVerified,
    DateTime? verifiedAt,
    bool clearVerifiedAt = false,
    DateTime? submittedAt,
    bool clearSubmittedAt = false,
    List<String>? documentUrls,
    String? errorMessage,
    bool clearError = false,
  }) {
    return EMongoliaVerification(
      id: id ?? this.id,
      sellerId: sellerId ?? this.sellerId,
      eMongoliaId: clearEMongoliaId
          ? null
          : (eMongoliaId ?? this.eMongoliaId),
      fullName:
          clearFullName ? null : (fullName ?? this.fullName),
      isVerified: isVerified ?? this.isVerified,
      verifiedAt:
          clearVerifiedAt ? null : (verifiedAt ?? this.verifiedAt),
      submittedAt:
          clearSubmittedAt ? null : (submittedAt ?? this.submittedAt),
      documentUrls: documentUrls ?? this.documentUrls,
      errorMessage:
          clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  // ── Serialization ────────────────────────────────────────────────

  factory EMongoliaVerification.fromJson(Map<String, dynamic> json) {
    return EMongoliaVerification(
      id: json['id'] as String,
      sellerId: json['sellerId'] as String,
      eMongoliaId: json['eMongoliaId'] as String?,
      fullName: json['fullName'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.parse(json['verifiedAt'] as String)
          : null,
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'] as String)
          : null,
      documentUrls:
          (json['documentUrls'] as List<dynamic>?)
                  ?.cast<String>() ??
              [],
      errorMessage: json['errorMessage'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'eMongoliaId': eMongoliaId,
      'fullName': fullName,
      'isVerified': isVerified,
      'verifiedAt': verifiedAt?.toIso8601String(),
      'submittedAt': submittedAt?.toIso8601String(),
      'documentUrls': documentUrls,
      'errorMessage': errorMessage,
    };
  }
}

/// Худалдагчийн баталгаажуулалтын хураангуй төлөв.
class SellerVerificationStatusSummary {
  const SellerVerificationStatusSummary({
    this.phoneVerified = false,
    this.eMongoliaVerified = false,
    this.phone,
    this.eMongoliaVerification,
  });

  /// Утасны дугаар баталгаажуулсан эсэх.
  final bool phoneVerified;

  /// E-Mongolia ID баталгаажуулсан эсэх.
  final bool eMongoliaVerified;

  /// Баталгаажуулсан утасны дугаар.
  final String? phone;

  /// E-Mongolia баталгаажуулалтын мэдээлэл.
  final EMongoliaVerification? eMongoliaVerification;

  /// Ямар нэгэн баталгаажуулалт хийгдсэн эсэх.
  bool get isVerified => phoneVerified || eMongoliaVerified;
}
