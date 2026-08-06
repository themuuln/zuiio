import '../../../shared/domain/horse.dart' show HorseGender;
import 'animal_enums.dart'
    show AnimalType, AnimalAge, HorseBreed, TravelDirection;

/// Pure form state for creating a free horse/livestock recovery report.
///
/// The form deliberately requires an explicit last-seen pin and time. Device
/// location is only a convenience for choosing that pin.
class LostHorseReportDraft {
  const LostHorseReportDraft({
    this.horseId,
    this.horseName,
    this.animalType = AnimalType.horse,
    this.ages = const [],
    this.gender,
    this.breed,
    this.coatColor,
    this.identificationDescription,
    this.earMarkDescription,
    this.tamgaImagePath,
    this.photoPaths = const [],
    this.lostCount = 1,
    this.searchRadiusKm = 5.0,
    this.travelDirection,
    this.privateVerificationDetail,
    this.lastSeenLat,
    this.lastSeenLng,
    this.lastSeenAt,
    this.locationAimag,
    this.locationSum,
    this.locationBag,
    this.locationName,
    this.contactPhone,
    this.contactPhoneVerified = false,
    this.sharePhone = false,
  });

  final String? horseId;
  final String? horseName;
  final AnimalType animalType;
  final List<AnimalAge> ages;
  final HorseGender? gender;
  final HorseBreed? breed;
  final String? coatColor;
  final String? identificationDescription;
  final String? earMarkDescription;
  final String? tamgaImagePath;
  final List<String> photoPaths;
  final int lostCount;

  /// Хайх радиус — how far the community should look, in kilometers.
  final double searchRadiusKm;

  /// Хөдөлсөн зүг — likely direction of travel.
  final TravelDirection? travelDirection;

  /// Нууц баталгаажуулах тэмдэг — owner-only verification mark.
  final String? privateVerificationDetail;

  final double? lastSeenLat;
  final double? lastSeenLng;
  final DateTime? lastSeenAt;
  final String? locationAimag;
  final String? locationSum;
  final String? locationBag;
  final String? locationName;
  final String? contactPhone;
  final bool contactPhoneVerified;
  final bool sharePhone;

  /// Whether the draft contains at least one useful, reviewable identifier.
  bool get hasUsefulIdentity =>
      horseId != null ||
      photoPaths.isNotEmpty ||
      tamgaImagePath != null ||
      (earMarkDescription?.trim().isNotEmpty ?? false) ||
      (identificationDescription?.trim().length ?? 0) >= 20 ||
      (horseName?.trim().isNotEmpty ?? false) ||
      (coatColor?.trim().isNotEmpty ?? false);

  /// Returns bilingual validation messages; an empty list means valid.
  List<String> validate({DateTime? now}) {
    final errors = <String>[];
    final current = now ?? DateTime.now();
    if (lostCount < 1) errors.add('Малын тоо 1-ээс бага байж болохгүй.');
    if (searchRadiusKm < 1 || searchRadiusKm > 100) {
      errors.add('Хайх радиус 1-100 км хооронд байна.');
    }
    if (lastSeenLat == null || lastSeenLng == null) {
      errors.add(
        'Сүүлд үзэгдсэн байршлаа сонгоно уу. / Select a last-seen location.',
      );
    } else if (lastSeenLat! < -90 ||
        lastSeenLat! > 90 ||
        lastSeenLng! < -180 ||
        lastSeenLng! > 180) {
      errors.add('Байршлын координат буруу байна. / Invalid coordinates.');
    }
    if (lastSeenAt == null) {
      errors.add(
        'Сүүлд үзэгдсэн цагийг сонгоно уу. / Select the last-seen time.',
      );
    } else if (lastSeenAt!.isAfter(current.add(const Duration(minutes: 5)))) {
      errors.add('Сүүлд үзэгдсэн цаг ирээдүйд байж болохгүй.');
    }
    if ((locationAimag?.trim().isEmpty ?? true) ||
        (locationSum?.trim().isEmpty ?? true)) {
      errors.add('Аймаг, сумыг сонгоно уу. / Select an aimag and sum.');
    }
    if (!hasUsefulIdentity) {
      errors.add(
        'Малын таних мэдээллээс дор хаяж нэгийг оруулна уу. '
        '/ Add at least one useful identifier.',
      );
    }
    if (sharePhone && (contactPhone == null || contactPhone!.trim().isEmpty)) {
      errors.add('Утас хуваалцахын тулд дугаараа оруулна уу.');
    }
    return errors;
  }
}
