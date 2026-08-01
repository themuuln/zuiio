import 'package:latlong2/latlong.dart' as ll;

import '../../../shared/domain/horse.dart' show HorseGender;
import 'animal_enums.dart';
import 'map_enums.dart';

/// A report of a lost horse, including last known location and search radius.
class LostHorseReport {
  const LostHorseReport({
    required this.id,
    this.horseId,
    required this.ownerId,
    this.horseName,
    this.description,
    required this.lastSeenLat,
    required this.lastSeenLng,
    required this.lastSeenAt,
    this.searchRadiusKm = 5.0,
    this.status = LostHorseStatus.active,
    this.photoUrl,
    required this.createdAt,
    required this.updatedAt,
    // ── New location fields ──
    this.locationAimag,
    this.locationSum,
    this.locationBag,
    this.locationName,
    // ── New animal info fields ──
    this.animalType = AnimalType.horse,
    this.ages = const [],
    this.gender,
    this.breed,
    this.coatColor,
    this.lostCount = 1,
    this.sightingCount = 0,
    // ── New media fields ──
    this.photoUrls = const [],
    this.videoUrls = const [],
    // ── New tamga/identification fields ──
    this.tamgaImageUrl,
    this.earMarkDescription,
    // ── New contact fields ──
    this.contactPhone,
    // ── Pricing ──
    this.pricingTier = LostHorsePricingTier.free,
    this.expiresAt,
    this.renewalRequested = false,
    // ── Public sharing ──
    this.publicShareToken,
    this.publicTokenHash,
    this.publicAccessEnabled = false,
    this.publicLocationPrecision = 'sum',
    this.publicContactMode = 'none',
    // ── Resolution / review ──
    this.resolutionType,
    this.resolutionNote,
    this.resolvedAt,
    this.resolvedBy,
    this.verifiedSightingId,
    this.reviewedAt,
    this.reviewedBy,
  });

  // ── Existing fields ──

  final String id;
  final String? horseId; // nullable for non-horse animals
  final String ownerId;
  final String? horseName; // nullable if no horse selected
  final String? description;
  final double lastSeenLat;
  final double lastSeenLng;
  final DateTime lastSeenAt;
  final double searchRadiusKm;
  final LostHorseStatus status;
  final String? photoUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ── New: Location hierarchy ──

  /// Аймаг (from dropdown).
  final String? locationAimag;

  /// Сум (from dropdown, filtered by aimag).
  final String? locationSum;

  /// Баг (free text).
  final String? locationBag;

  /// Газрын нэр (free text, specific place name).
  final String? locationName;

  // ── New: Animal information ──

  /// Малын төрөл — Адуу, Үхэр, Хонь, Ямаа, Тэмээ.
  final AnimalType animalType;

  /// Монгол нэршил — multi-select ages.
  final List<AnimalAge> ages;

  /// Хүйс — Эр, Эм, Агт.
  final HorseGender? gender;

  /// Үүлдэр — Монгол, Шинэ цагийн монгол, Цэвэр цусны, Эрлийз.
  final HorseBreed? breed;

  /// Зүс — coat color name.
  final String? coatColor;

  /// Тоо — how many animals lost.
  final int lostCount;

  /// Number of sightings linked to this report.
  final int sightingCount;

  // ── New: Media ──

  /// Multiple photo URLs from lost_horse_media table.
  final List<String> photoUrls;

  /// Optional video URLs from lost_horse_media table.
  final List<String> videoUrls;

  // ── New: Tamga / Identification ──

  /// Тамганы зураг — brand stamp photo URL.
  final String? tamgaImageUrl;

  /// Имийн тайлбар — ear mark description text.
  final String? earMarkDescription;

  // ── New: Contact ──

  /// Холбоо барих утас — contact phone number.
  final String? contactPhone;

  // ── New: Pricing ──

  /// Үнийн түвшин — pricing tier (Энгийн / Онцлох / VIP).
  final LostHorsePricingTier pricingTier;

  /// Зар дуусах хугацаа — auto-expiry date based on pricing tier.
  /// Null for free tier, calculated at creation time for paid tiers.
  final DateTime? expiresAt;

  /// Сунгах хүсэлт — user has requested renewal.
  final bool renewalRequested;

  // ── Public sharing ──

  /// Raw token retained locally for share-link generation; never serialized.
  final String? publicShareToken;

  /// SHA-256 token digest stored in Supabase; never exposed publicly.
  final String? publicTokenHash;

  /// Whether the redacted public report is currently available.
  final bool publicAccessEnabled;

  /// Public location precision: aimag, sum, or bag.
  final String publicLocationPrecision;

  /// Public contact mode: none or phone.
  final String publicContactMode;

  /// Why the report was closed. Null while active.
  final LostHorseResolutionType? resolutionType;
  final String? resolutionNote;
  final DateTime? resolvedAt;
  final String? resolvedBy;
  final String? verifiedSightingId;
  final DateTime? reviewedAt;
  final String? reviewedBy;

  /// Distance in meters from this report's last seen location to [lat]/[lng].
  double distanceTo(double lat, double lng) {
    final distance = ll.Distance();
    return distance(ll.LatLng(lastSeenLat, lastSeenLng), ll.LatLng(lat, lng));
  }

  LostHorseReport copyWith({
    String? id,
    String? horseId,
    String? ownerId,
    String? horseName,
    String? description,
    double? lastSeenLat,
    double? lastSeenLng,
    DateTime? lastSeenAt,
    double? searchRadiusKm,
    LostHorseStatus? status,
    String? photoUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
    // ── Location ──
    String? locationAimag,
    String? locationSum,
    String? locationBag,
    String? locationName,
    // ── Animal info ──
    AnimalType? animalType,
    List<AnimalAge>? ages,
    HorseGender? gender,
    HorseBreed? breed,
    String? coatColor,
    int? lostCount,
    int? sightingCount,
    // ── Media ──
    List<String>? photoUrls,
    List<String>? videoUrls,
    // ── Tamga / Identification ──
    String? tamgaImageUrl,
    String? earMarkDescription,
    // ── Contact ──
    String? contactPhone,
    // ── Pricing ──
    LostHorsePricingTier? pricingTier,
    DateTime? expiresAt,
    bool? renewalRequested,
    // ── Public sharing ──
    String? publicShareToken,
    String? publicTokenHash,
    bool? publicAccessEnabled,
    String? publicLocationPrecision,
    String? publicContactMode,
    LostHorseResolutionType? resolutionType,
    String? resolutionNote,
    DateTime? resolvedAt,
    String? resolvedBy,
    String? verifiedSightingId,
    DateTime? reviewedAt,
    String? reviewedBy,
  }) {
    return LostHorseReport(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      horseName: horseName ?? this.horseName,
      description: description ?? this.description,
      lastSeenLat: lastSeenLat ?? this.lastSeenLat,
      lastSeenLng: lastSeenLng ?? this.lastSeenLng,
      lastSeenAt: lastSeenAt ?? this.lastSeenAt,
      searchRadiusKm: searchRadiusKm ?? this.searchRadiusKm,
      status: status ?? this.status,
      photoUrl: photoUrl ?? this.photoUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      locationAimag: locationAimag ?? this.locationAimag,
      locationSum: locationSum ?? this.locationSum,
      locationBag: locationBag ?? this.locationBag,
      locationName: locationName ?? this.locationName,
      animalType: animalType ?? this.animalType,
      ages: ages ?? this.ages,
      gender: gender ?? this.gender,
      breed: breed ?? this.breed,
      coatColor: coatColor ?? this.coatColor,
      sightingCount: sightingCount ?? this.sightingCount,
      lostCount: lostCount ?? this.lostCount,
      photoUrls: photoUrls ?? this.photoUrls,
      videoUrls: videoUrls ?? this.videoUrls,
      tamgaImageUrl: tamgaImageUrl ?? this.tamgaImageUrl,
      earMarkDescription: earMarkDescription ?? this.earMarkDescription,
      contactPhone: contactPhone ?? this.contactPhone,
      pricingTier: pricingTier ?? this.pricingTier,
      expiresAt: expiresAt ?? this.expiresAt,
      renewalRequested: renewalRequested ?? this.renewalRequested,
      publicShareToken: publicShareToken ?? this.publicShareToken,
      publicTokenHash: publicTokenHash ?? this.publicTokenHash,
      publicAccessEnabled: publicAccessEnabled ?? this.publicAccessEnabled,
      publicLocationPrecision:
          publicLocationPrecision ?? this.publicLocationPrecision,
      publicContactMode: publicContactMode ?? this.publicContactMode,
      resolutionType: resolutionType ?? this.resolutionType,
      resolutionNote: resolutionNote ?? this.resolutionNote,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolvedBy: resolvedBy ?? this.resolvedBy,
      verifiedSightingId: verifiedSightingId ?? this.verifiedSightingId,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      reviewedBy: reviewedBy ?? this.reviewedBy,
    );
  }

  Map<String, dynamic> toJson() => {
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
    'sighting_count': sightingCount,
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
    // ── Public sharing ──
    'public_token_hash': publicTokenHash,
    'public_access_enabled': publicAccessEnabled,
    'public_location_precision': publicLocationPrecision,
    'public_contact_mode': publicContactMode,
    'resolution_type': resolutionType?.name,
    'resolution_note': resolutionNote,
    'resolved_at': resolvedAt?.toIso8601String(),
    'resolved_by': resolvedBy,
    'verified_sighting_id': verifiedSightingId,
    'reviewed_at': reviewedAt?.toIso8601String(),
    'reviewed_by': reviewedBy,
  };

  factory LostHorseReport.fromJson(Map<String, dynamic> json) {
    return LostHorseReport(
      id: json['id'] as String,
      horseId: json['horse_id'] as String?,
      ownerId: json['owner_id'] as String,
      horseName: json['horse_name'] as String?,
      description: json['description'] as String?,
      lastSeenLat: (json['last_seen_lat'] as num).toDouble(),
      lastSeenLng: (json['last_seen_lng'] as num).toDouble(),
      lastSeenAt: DateTime.parse(json['last_seen_at'] as String),
      searchRadiusKm: (json['search_radius_km'] as num?)?.toDouble() ?? 5.0,
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
      ages:
          (json['animal_ages'] as List<dynamic>?)
              ?.map(
                (e) => AnimalAge.values.firstWhere(
                  (a) => a.name == e as String,
                  orElse: () => AnimalAge.unaga,
                ),
              )
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
      sightingCount: (json['sighting_count'] as num?)?.toInt() ?? 0,
      coatColor: json['coat_color'] as String?,
      lostCount: (json['lost_count'] as num?)?.toInt() ?? 1,
      // ── Media ──
      photoUrls: (json['photo_urls'] as List<dynamic>?)?.cast<String>() ?? [],
      videoUrls: (json['video_urls'] as List<dynamic>?)?.cast<String>() ?? [],
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
      // ── Public sharing ──
      publicTokenHash: json['public_token_hash'] as String?,
      publicAccessEnabled: json['public_access_enabled'] as bool? ?? false,
      publicLocationPrecision:
          json['public_location_precision'] as String? ?? 'sum',
      publicContactMode: json['public_contact_mode'] as String? ?? 'none',
      resolutionType: json['resolution_type'] != null
          ? LostHorseResolutionType.values.firstWhere(
              (e) => e.name == json['resolution_type'],
              orElse: () => LostHorseResolutionType.withdrawn,
            )
          : null,
      resolutionNote: json['resolution_note'] as String?,
      resolvedAt: json['resolved_at'] != null
          ? DateTime.parse(json['resolved_at'] as String)
          : null,
      resolvedBy: json['resolved_by'] as String?,
      verifiedSightingId: json['verified_sighting_id'] as String?,
      reviewedAt: json['reviewed_at'] != null
          ? DateTime.parse(json['reviewed_at'] as String)
          : null,
      reviewedBy: json['reviewed_by'] as String?,
    );
  }
}
