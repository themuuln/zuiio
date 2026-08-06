import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/report_form_state.dart';

LostHorseReportDraft defaultDraft({
  String? description = 'A clear identifying description that is long enough.',
  double? searchRadiusKm = 5.0,
  String? contactPhone,
  bool sharePhone = false,
}) => LostHorseReportDraft(
  animalType: AnimalType.horse,
  identificationDescription: description,
  locationAimag: 'Төв',
  locationSum: 'Зуунмод',
  lastSeenLat: 47.9,
  lastSeenLng: 106.9,
  lastSeenAt: DateTime(2026, 7, 31),
  searchRadiusKm: searchRadiusKm ?? 5.0,
  contactPhone: contactPhone,
  sharePhone: sharePhone,
);

void main() {
  test('accepts a manual report with a valid pin and identifier', () {
    expect(defaultDraft().validate(now: DateTime(2026, 8, 1)), isEmpty);
  });

  test('requires a useful identifier for manual reports', () {
    final errors = defaultDraft(
      description: 'too short',
    ).validate(now: DateTime(2026, 8, 1));
    expect(errors, contains(contains('таних')));
  });

  test('rejects a last-seen time more than five minutes in the future', () {
    final errors = LostHorseReportDraft(
      identificationDescription:
          'A clear identifying description that is long enough.',
      locationAimag: 'Төв',
      locationSum: 'Зуунмод',
      lastSeenLat: 47.9,
      lastSeenLng: 106.9,
      lastSeenAt: DateTime(2026, 8, 1, 0, 6),
    ).validate(now: DateTime(2026, 8, 1));
    expect(errors, contains(contains('ирээдүйд')));
  });

  test('sharing a phone requires a phone number', () {
    final errors = defaultDraft(
      sharePhone: true,
      contactPhone: null,
    ).validate(now: DateTime(2026, 8, 1));
    expect(errors, contains(contains('дугаараа оруулна')));
  });

  test('sharing a phone passes when a phone is present', () {
    final errors = defaultDraft(
      sharePhone: true,
      contactPhone: '+976 9911 2233',
    ).validate(now: DateTime(2026, 8, 1));
    expect(errors, isEmpty);
  });

  test('rejects an out-of-range search radius', () {
    final errors = defaultDraft(
      searchRadiusKm: 0.5,
    ).validate(now: DateTime(2026, 8, 1));
    expect(errors, contains(contains('радиус')));
  });
}
