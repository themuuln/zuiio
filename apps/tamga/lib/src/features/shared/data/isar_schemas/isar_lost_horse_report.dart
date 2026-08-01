import 'package:isar/isar.dart';

import '../../../map/domain/animal_enums.dart';
import '../../../map/domain/lost_horse_report.dart';
import '../../../map/domain/map_enums.dart';
import '../../../../shared/domain/horse.dart' show HorseGender;

part 'isar_lost_horse_report.g.dart';

/// Isar collection for offline persistence of [LostHorseReport].
@collection
class IsarLostHorseReport {
  IsarLostHorseReport();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID.
  @Index(unique: true, replace: true)
  late String domainId;

  // ── Existing fields ──
  String? horseId; // nullable for non-horse animals
  late String ownerId;
  String? horseName;
  String? description;
  late double lastSeenLat;
  late double lastSeenLng;
  late DateTime lastSeenAt;
  late double searchRadiusKm;
  late String status; // stored as string from LostHorseStatus.name
  String? photoUrl;
  late DateTime createdAt;
  late DateTime updatedAt;

  // ── New: Location hierarchy ──
  String? locationAimag;
  String? locationSum;
  String? locationBag;
  String? locationName;

  // ── New: Animal information ──
  late String animalType; // stored as string from AnimalType.name
  List<String>? ages; // stored as list of AnimalAge.name strings
  String? gender; // stored as string from HorseGender.name
  String? breed; // stored as string from HorseBreed.name
  String? coatColor;
  late int lostCount;
  late int sightingCount;

  // ── New: Media ──
  List<String>? photoUrls;
  List<String>? videoUrls;

  // ── New: Tamga / Identification ──
  String? tamgaImageUrl;
  String? earMarkDescription;

  // ── New: Contact ──
  String? contactPhone;

  // ── New: Pricing ──
  late String pricingTier; // stored as string from LostHorsePricingTier.name
  DateTime? expiresAt;
  late bool renewalRequested;

  // ── Public sharing ──
  /// SHA-256 digest of the public share token. The raw token is never persisted.
  String? publicTokenHash;
  late bool publicAccessEnabled;
  late String publicLocationPrecision;
  late String publicContactMode;

  /// Authenticated account that owns this local cache row.
  String? accountId;

  String? resolutionType;
  String? resolutionNote;
  DateTime? resolvedAt;
  String? resolvedBy;
  String? verifiedSightingId;
  DateTime? reviewedAt;
  String? reviewedBy;

  factory IsarLostHorseReport.fromDomain(LostHorseReport report) {
    return IsarLostHorseReport()
      ..domainId = report.id
      ..horseId = report.horseId
      ..ownerId = report.ownerId
      ..horseName = report.horseName
      ..description = report.description
      ..lastSeenLat = report.lastSeenLat
      ..lastSeenLng = report.lastSeenLng
      ..lastSeenAt = report.lastSeenAt
      ..searchRadiusKm = report.searchRadiusKm
      ..status = report.status.name
      ..photoUrl = report.photoUrl
      ..createdAt = report.createdAt
      ..updatedAt = report.updatedAt
      // ── Location ──
      ..locationAimag = report.locationAimag
      ..locationSum = report.locationSum
      ..locationBag = report.locationBag
      ..locationName = report.locationName
      // ── Animal info ──
      ..animalType = report.animalType.name
      ..ages = report.ages.map((e) => e.name).toList()
      ..gender = report.gender?.name
      ..breed = report.breed?.name
      ..coatColor = report.coatColor
      ..sightingCount = report.sightingCount
      ..lostCount = report.lostCount
      // ── Media ──
      ..photoUrls = report.photoUrls.isEmpty ? null : report.photoUrls
      ..videoUrls = report.videoUrls.isEmpty ? null : report.videoUrls
      // ── Tamga / Identification ──
      ..tamgaImageUrl = report.tamgaImageUrl
      ..earMarkDescription = report.earMarkDescription
      // ── Contact ──
      ..contactPhone = report.contactPhone
      // ── Pricing ──
      ..pricingTier = report.pricingTier.name
      ..expiresAt = report.expiresAt
      ..renewalRequested = report.renewalRequested
      // ── Public sharing ──
      ..publicTokenHash = report.publicTokenHash
      ..publicAccessEnabled = report.publicAccessEnabled
      ..publicLocationPrecision = report.publicLocationPrecision
      ..publicContactMode = report.publicContactMode
      ..accountId = report.ownerId
      ..resolutionType = report.resolutionType?.name
      ..resolutionNote = report.resolutionNote
      ..resolvedAt = report.resolvedAt
      ..resolvedBy = report.resolvedBy
      ..verifiedSightingId = report.verifiedSightingId
      ..reviewedAt = report.reviewedAt
      ..reviewedBy = report.reviewedBy;
  }

  LostHorseReport toDomain() {
    return LostHorseReport(
      id: domainId,
      horseId: horseId,
      ownerId: ownerId,
      horseName: horseName,
      description: description,
      lastSeenLat: lastSeenLat,
      lastSeenLng: lastSeenLng,
      lastSeenAt: lastSeenAt,
      searchRadiusKm: searchRadiusKm,
      status: LostHorseStatus.values.firstWhere(
        (e) => e.name == status,
        orElse: () => LostHorseStatus.active,
      ),
      photoUrl: photoUrl,
      createdAt: createdAt,
      updatedAt: updatedAt,
      // ── Location ──
      locationAimag: locationAimag,
      locationSum: locationSum,
      locationBag: locationBag,
      locationName: locationName,
      // ── Animal info ──
      animalType: AnimalType.values.firstWhere(
        (e) => e.name == animalType,
        orElse: () => AnimalType.horse,
      ),
      ages: (ages ?? [])
          .map(
            (e) => AnimalAge.values.firstWhere(
              (a) => a.name == e,
              orElse: () => AnimalAge.unaga,
            ),
          )
          .toList(),
      gender: gender != null
          ? HorseGender.values.firstWhere(
              (e) => e.name == gender,
              orElse: () => HorseGender.gelding,
            )
          : null,
      breed: breed != null
          ? HorseBreed.values.firstWhere(
              (e) => e.name == breed,
              orElse: () => HorseBreed.mongol,
            )
          : null,
      coatColor: coatColor,
      lostCount: lostCount,
      sightingCount: sightingCount,
      photoUrls: photoUrls ?? [],
      videoUrls: videoUrls ?? [],
      // ── Tamga / Identification ──
      tamgaImageUrl: tamgaImageUrl,
      earMarkDescription: earMarkDescription,
      // ── Contact ──
      contactPhone: contactPhone,
      // ── Pricing ──
      pricingTier: LostHorsePricingTier.values.firstWhere(
        (e) => e.name == pricingTier,
        orElse: () => LostHorsePricingTier.free,
      ),
      expiresAt: expiresAt,
      renewalRequested: renewalRequested,
      // ── Public sharing ──
      publicTokenHash: publicTokenHash,
      publicAccessEnabled: publicAccessEnabled,
      publicLocationPrecision: publicLocationPrecision,
      publicContactMode: publicContactMode,
      resolutionType: resolutionType != null
          ? LostHorseResolutionType.values.firstWhere(
              (e) => e.name == resolutionType,
              orElse: () => LostHorseResolutionType.withdrawn,
            )
          : null,
      resolutionNote: resolutionNote,
      resolvedAt: resolvedAt,
      resolvedBy: resolvedBy,
      verifiedSightingId: verifiedSightingId,
      reviewedAt: reviewedAt,
      reviewedBy: reviewedBy,
    );
  }
}
