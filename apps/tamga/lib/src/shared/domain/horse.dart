import 'package:freezed_annotation/freezed_annotation.dart';

part 'horse.freezed.dart';

// ── Enums ──

/// Морины хүйс.
///
/// [HorseRecord] (horses feature) болон [LineageHorse] (lineage feature)-ийг
/// нэгтгэсний дараа энэ нь цорын ганц эх сурвалж болсон.
enum HorseGender {
  stallion,
  mare,
  gelding,
  foal;

  String get displayName {
    switch (this) {
      case HorseGender.stallion:
        return 'Азарга';
      case HorseGender.mare:
        return 'Гүү';
      case HorseGender.gelding:
        return 'Морь';
      case HorseGender.foal:
        return 'Унага';
    }
  }

  static HorseGender fromString(String value) {
    switch (value.toLowerCase()) {
      case 'stallion':
        return HorseGender.stallion;
      case 'mare':
        return HorseGender.mare;
      case 'gelding':
        return HorseGender.gelding;
      case 'foal':
        return HorseGender.foal;
      default:
        return HorseGender.gelding;
    }
  }
}

// ── Main Model ──

/// Нэгдсэн морьдын domain model.
///
/// [HorseRecord] (horses feature) болон [LineageHorse] (lineage feature)-ийг
/// нэгтгэв. Бүх feature (health, events, market, lineage) энэ model-ийг ашиглана.
@freezed
abstract class Horse with _$Horse {
  const Horse._();

  const factory Horse({
    required String id,
    @Default('') String ownerId,
    required String name,
    @Default('') String relationLabel,
    @Default('') String coat,
    @Default(0) int birthYear,
    @Default(0) int awardCount,
    @Default(0) int offspringCount,
    @Default(false) bool isOwnedByHousehold,
    @Default('') String notes,
    required HorseGender gender,
    String? microchipId,
    String? registrationNo,
    @Default([]) List<String> photoUrls,
    String? lineageRootId,
    String? ownerStampSvg,
    DateTime? registrationDate,
    @Default(false) bool tamgaVerified,
    @Default(false) bool stateVerified,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Horse;

  // ── Computed getters ──

  /// Насыг тооцоолох.
  int get age => DateTime.now().year - birthYear;

  /// Хэрэглэгчид харуулах нэр.
  String get displayName => name;

  // ── Helper methods ──

  /// Returns a copy with [registrationDate] set to null.
  Horse clearRegistrationDate() => copyWith(registrationDate: null);

  // ── Local JSON serialization (camelCase) ──

  factory Horse.fromJson(Map<String, dynamic> json) {
    return Horse(
      id: json['id'] as String,
      ownerId: json['ownerId'] as String? ?? '',
      name: json['name'] as String,
      relationLabel: json['relationLabel'] as String? ?? '',
      coat: json['coat'] as String? ?? '',
      birthYear: json['birthYear'] as int? ?? 0,
      awardCount: json['awardCount'] as int? ?? 0,
      offspringCount: json['offspringCount'] as int? ?? 0,
      isOwnedByHousehold: json['isOwnedByHousehold'] as bool? ?? true,
      notes: json['notes'] as String? ?? '',
      gender: HorseGender.fromString(json['gender'] as String? ?? 'gelding'),
      microchipId: json['microchipId'] as String?,
      registrationNo: json['registrationNo'] as String?,
      photoUrls:
          (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      lineageRootId: json['lineageRootId'] as String?,
      ownerStampSvg: json['ownerStampSvg'] as String?,
      registrationDate: json['registrationDate'] != null
          ? DateTime.tryParse(json['registrationDate'] as String)
          : null,
      tamgaVerified: json['tamgaVerified'] as bool? ?? false,
      stateVerified: json['stateVerified'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ownerId': ownerId,
      'name': name,
      'relationLabel': relationLabel,
      'coat': coat,
      'birthYear': birthYear,
      'awardCount': awardCount,
      'offspringCount': offspringCount,
      'isOwnedByHousehold': isOwnedByHousehold,
      'notes': notes,
      'gender': gender.name,
      'microchipId': microchipId,
      'registrationNo': registrationNo,
      'photoUrls': photoUrls,
      'lineageRootId': lineageRootId,
      'ownerStampSvg': ownerStampSvg,
      'registrationDate': registrationDate?.toIso8601String(),
      'tamgaVerified': tamgaVerified,
      'stateVerified': stateVerified,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ── Supabase serialization (snake_case) ──

  factory Horse.fromSupabaseJson(Map<String, dynamic> json) {
    return Horse(
      id: json['id'] as String,
      ownerId: json['owner_id'] as String? ?? '',
      name: json['name'] as String,
      relationLabel: json['relation_label'] as String? ?? '',
      coat: json['coat'] as String? ?? '',
      birthYear: json['birth_year'] as int? ?? 0,
      awardCount: json['award_count'] as int? ?? 0,
      offspringCount: json['offspring_count'] as int? ?? 0,
      isOwnedByHousehold: json['is_owned_by_household'] as bool? ?? true,
      notes: json['notes'] as String? ?? '',
      gender: HorseGender.fromString(json['gender'] as String? ?? 'gelding'),
      microchipId: json['microchip_id'] as String?,
      registrationNo: json['registration_no'] as String?,
      photoUrls:
          (json['photo_urls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      lineageRootId: json['lineage_root_id'] as String?,
      ownerStampSvg: json['owner_stamp_svg'] as String?,
      registrationDate: json['registration_date'] != null
          ? DateTime.tryParse(json['registration_date'] as String)
          : null,
      tamgaVerified: json['tamga_verified'] as bool? ?? false,
      stateVerified: json['state_verified'] as bool? ?? false,
      createdAt:
          DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toSupabaseJson({required String ownerId}) {
    return {
      'owner_id': ownerId,
      'id': id,
      'name': name,
      'relation_label': relationLabel,
      'coat': coat,
      'birth_year': birthYear,
      'award_count': awardCount,
      'offspring_count': offspringCount,
      'is_owned_by_household': isOwnedByHousehold,
      'notes': notes,
      'gender': gender.name,
      'microchip_id': microchipId,
      'registration_no': registrationNo,
      'photo_urls': photoUrls,
      'lineage_root_id': lineageRootId,
      'owner_stamp_svg': ownerStampSvg,
      'registration_date': registrationDate?.toIso8601String(),
      'tamga_verified': tamgaVerified,
      'state_verified': stateVerified,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
