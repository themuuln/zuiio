import 'horse.dart';

// ── Supabase Serialization Extension ──

/// Extension adding Supabase-specific (snake_case) serialization to [Horse].
extension HorseSupabase on Horse {
  /// Deserializes a [Horse] from a Supabase JSON row (snake_case keys).
  static Horse fromSupabaseJson(Map<String, dynamic> json) {
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
      gender:
          HorseGender.fromString(json['gender'] as String? ?? 'gelding'),
      microchipId: json['microchip_id'] as String?,
      registrationNo: json['registration_no'] as String?,
      photoUrls: (json['photo_urls'] as List<dynamic>?)
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
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  /// Serializes this [Horse] to a Supabase-compatible map (snake_case keys).
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
