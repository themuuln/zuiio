import 'animal_enums.dart';
import 'lost_horse_report.dart';
import 'map_enums.dart';
import '../../../shared/domain/horse.dart' show HorseGender;

// ── Supabase Serialization Extension ───────────────────────────────

/// Extension adding Supabase-specific (snake_case) serialization to
/// [LostHorseReport].
extension LostHorseReportSupabase on LostHorseReport {
  /// Deserializes a [LostHorseReport] from a Supabase JSON row
  /// (snake_case keys).
  static LostHorseReport fromSupabaseJson(Map<String, dynamic> json) {
    return LostHorseReport(
      id: json['id'] as String,
      horseId: json['horse_id'] as String?,
      ownerId: json['owner_id'] as String,
      horseName: json['horse_name'] as String?,
      description: json['description'] as String?,
      lastSeenLat: (json['last_seen_lat'] as num).toDouble(),
      lastSeenLng: (json['last_seen_lng'] as num).toDouble(),
      lastSeenAt: DateTime.parse(json['last_seen_at'] as String),
      searchRadiusKm:
          (json['search_radius_km'] as num?)?.toDouble() ?? 5.0,
      status: LostHorseStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => LostHorseStatus.active,
      ),
      photoUrl: json['photo_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      // ── Location ──
      locationAimag: json['location_aimag'] as String?,
      locationSum: json['location_sum'] as String?,
      locationBag: json['location_bag'] as String?,
      locationName: json['location_name'] as String?,
      // ── Animal info ──
      animalType: AnimalType.values.firstWhere(
        (e) => e.name == (json['animal_type'] as String? ?? 'horse'),
        orElse: () => AnimalType.horse,
      ),
      ages: (json['animal_ages'] as List<dynamic>?)
              ?.map((e) => AnimalAge.values.firstWhere(
                    (a) => a.name == e as String,
                    orElse: () => AnimalAge.unaga,
                  ))
              .toList() ??
          [],
      gender: json['gender'] != null
          ? HorseGender.values.firstWhere(
              (e) => e.name == json['gender'],
              orElse: () => HorseGender.gelding,
            )
          : null,
      breed: json['breed'] != null
          ? HorseBreed.values.firstWhere(
              (e) => e.name == json['breed'],
              orElse: () => HorseBreed.mongol,
            )
          : null,
      coatColor: json['coat_color'] as String?,
      lostCount: (json['lost_count'] as num?)?.toInt() ?? 1,
      // ── Media ──
      photoUrls: (json['photo_urls'] as List<dynamic>?)?.cast<String>() ??
          [],
      videoUrls: (json['video_urls'] as List<dynamic>?)?.cast<String>() ??
          [],
      // ── Tamga / Identification ──
      tamgaImageUrl: json['tamga_image_url'] as String?,
      earMarkDescription: json['ear_mark_description'] as String?,
      // ── Contact ──
      contactPhone: json['contact_phone'] as String?,
      // ── Pricing ──
      pricingTier: LostHorsePricingTier.values.firstWhere(
        (e) => e.name == (json['pricing_tier'] as String? ?? 'free'),
        orElse: () => LostHorsePricingTier.free,
      ),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
      renewalRequested: json['renewal_requested'] as bool? ?? false,
    );
  }

  /// Serializes this [LostHorseReport] to a Supabase-compatible map
  /// (snake_case keys).
  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'horse_id': horseId,
      'owner_id': ownerId,
      'horse_name': horseName,
      'description': description,
      'last_seen_lat': lastSeenLat,
      'last_seen_lng': lastSeenLng,
      'last_seen_at': lastSeenAt.toIso8601String(),
      'search_radius_km': searchRadiusKm,
      'status': status.name,
      'photo_url': photoUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      // ── Location ──
      'location_aimag': locationAimag,
      'location_sum': locationSum,
      'location_bag': locationBag,
      'location_name': locationName,
      // ── Animal info ──
      'animal_type': animalType.name,
      'animal_ages': ages.map((e) => e.name).toList(),
      'gender': gender?.name,
      'breed': breed?.name,
      'coat_color': coatColor,
      'lost_count': lostCount,
      // ── Media ──
      'photo_urls': photoUrls,
      'video_urls': videoUrls,
      // ── Tamga / Identification ──
      'tamga_image_url': tamgaImageUrl,
      'ear_mark_description': earMarkDescription,
      // ── Contact ──
      'contact_phone': contactPhone,
      // ── Pricing ──
      'pricing_tier': pricingTier.name,
      'expires_at': expiresAt?.toIso8601String(),
      'renewal_requested': renewalRequested,
    };
  }
}
