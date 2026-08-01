import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/report_form_state.dart';

LostHorseReportDraft defaultDraft({
  String? description = 'A clear identifying description that is long enough.',
}) => LostHorseReportDraft(
  animalType: AnimalType.horse,
  identificationDescription: description,
  locationAimag: 'Төв',
  locationSum: 'Зуунмод',
  lastSeenLat: 47.9,
  lastSeenLng: 106.9,
  lastSeenAt: DateTime(2026, 7, 31),
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
}
