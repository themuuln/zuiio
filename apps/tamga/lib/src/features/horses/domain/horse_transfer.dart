/// Морины эзэмшил шилжүүлэх бүртгэл.
///
/// Эзэмшил шилжүүлэх нь морины бүрэн түүхийг шинэ эзэнд дамжуулна.
/// Энэ нь аппликейшний итгэлцэл, зах зээлийн үнэ цэнийг нэмэгдүүлдэг.
library;

/// Морины эзэмшил шилжүүлэх бүртгэл.
class HorseTransfer {
  const HorseTransfer({
    required this.id,
    required this.horseId,
    required this.fromOwnerId,
    required this.fromOwnerName,
    required this.toOwnerId,
    required this.toOwnerName,
    required this.transferDate,
    this.price,
    this.notes = '',
    this.isVerified = false,
    this.verifiedAt,
    this.verifiedBy,
  });

  /// Бүртгэлийн дугаар.
  final String id;

  /// Морины ID.
  final String horseId;

  /// Өмнөх эзний ID.
  final String fromOwnerId;

  /// Өмнөх эзний нэр.
  final String fromOwnerName;

  /// Шинэ эзний ID.
  final String toOwnerId;

  /// Шинэ эзний нэр.
  final String toOwnerName;

  /// Шилжүүлсэн огноо.
  final DateTime transferDate;

  /// Үнэ (хэрэв борлуулалт бол).
  final double? price;

  /// Нэмэлт тэмдэглэл.
  final String notes;

  /// Баталгаажсан эсэх (албан ёсны шалгалт).
  final bool isVerified;

  /// Баталгаажсан огноо.
  final DateTime? verifiedAt;

  /// Хэн баталгаажуулсан.
  final String? verifiedBy;

  HorseTransfer copyWith({
    String? id,
    String? horseId,
    String? fromOwnerId,
    String? fromOwnerName,
    String? toOwnerId,
    String? toOwnerName,
    DateTime? transferDate,
    double? price,
    String? notes,
    bool? isVerified,
    DateTime? verifiedAt,
    String? verifiedBy,
    bool clearPrice = false,
    bool clearVerifiedAt = false,
    bool clearVerifiedBy = false,
  }) {
    return HorseTransfer(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      fromOwnerId: fromOwnerId ?? this.fromOwnerId,
      fromOwnerName: fromOwnerName ?? this.fromOwnerName,
      toOwnerId: toOwnerId ?? this.toOwnerId,
      toOwnerName: toOwnerName ?? this.toOwnerName,
      transferDate: transferDate ?? this.transferDate,
      price: clearPrice ? null : price ?? this.price,
      notes: notes ?? this.notes,
      isVerified: isVerified ?? this.isVerified,
      verifiedAt: clearVerifiedAt ? null : verifiedAt ?? this.verifiedAt,
      verifiedBy: clearVerifiedBy ? null : verifiedBy ?? this.verifiedBy,
    );
  }

  factory HorseTransfer.fromJson(Map<String, dynamic> json) {
    return HorseTransfer(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      fromOwnerId: json['from_owner_id'] as String,
      fromOwnerName: json['from_owner_name'] as String? ?? '',
      toOwnerId: json['to_owner_id'] as String,
      toOwnerName: json['to_owner_name'] as String? ?? '',
      transferDate: DateTime.parse(json['transfer_date'] as String),
      price: (json['price'] as num?)?.toDouble(),
      notes: json['notes'] as String? ?? '',
      isVerified: json['is_verified'] as bool? ?? false,
      verifiedAt: json['verified_at'] != null
          ? DateTime.parse(json['verified_at'] as String)
          : null,
      verifiedBy: json['verified_by'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horse_id': horseId,
      'from_owner_id': fromOwnerId,
      'from_owner_name': fromOwnerName,
      'to_owner_id': toOwnerId,
      'to_owner_name': toOwnerName,
      'transfer_date': transferDate.toIso8601String(),
      'price': price,
      'notes': notes,
      'is_verified': isVerified,
      'verified_at': verifiedAt?.toIso8601String(),
      'verified_by': verifiedBy,
    };
  }

  /// Баталгаажсан шилжүүлэг эсэх.
  bool get isCertified => isVerified && verifiedAt != null;
}

/// Морины эзэмшил шилжүүлэх түүх.
class HorseTransferHistory {
  const HorseTransferHistory({required this.horseId, required this.transfers});

  /// Морины ID.
  final String horseId;

  /// Шилжүүлгүүдийн жагсаалт (хугацааны дарааллаар).
  final List<HorseTransfer> transfers;

  /// Одоогийн эзэн.
  HorseTransfer? get currentOwner =>
      transfers.isNotEmpty ? transfers.last : null;

  /// Эхний эзэн.
  HorseTransfer? get firstOwner =>
      transfers.isNotEmpty ? transfers.first : null;

  /// Нийт шилжүүлгийн тоо.
  int get transferCount => transfers.length;

  /// Шилжүүлгийн түүхийг харуулах текст.
  String get summaryText {
    if (transfers.isEmpty) {
      return 'Шилжүүлгийн түүх байхгүй';
    }
    return '$transferCount удаа шилжүүлсэн';
  }
}
