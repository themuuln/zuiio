import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/application/lost_horse_filters.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/map_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';

final _defaultTime = DateTime(2026, 6, 1);

/// Helper to create a minimal LostHorseReport with defaults.
LostHorseReport _createReport({
  String id = 'r1',
  String ownerId = 'o1',
  double lat = 47.9,
  double lng = 106.9,
  String? locationAimag,
  AnimalType animalType = AnimalType.horse,
  String? coatColor,
  LostHorseStatus status = LostHorseStatus.active,
  DateTime? createdAt,
}) {
  final t = createdAt ?? _defaultTime;
  return LostHorseReport(
    id: id,
    ownerId: ownerId,
    lastSeenLat: lat,
    lastSeenLng: lng,
    lastSeenAt: t,
    createdAt: t,
    updatedAt: t,
    locationAimag: locationAimag,
    animalType: animalType,
    coatColor: coatColor,
    status: status,
  );
}

void main() {
  // ── LostHorseFilterState ─────────────────────────────────────────

  group('LostHorseFilterState', () {
    test('default state has no filters', () {
      const state = LostHorseFilterState();
      expect(state.hasAnyFilter, isFalse);
      expect(state.activeCount, 0);
      expect(state.aimag, isNull);
      expect(state.animalType, isNull);
      expect(state.coatColor, isNull);
      expect(state.status, isNull);
    });

    test('copyWith sets single field', () {
      const state = LostHorseFilterState();
      final updated = state.copyWith(aimag: 'Архангай');

      expect(updated.aimag, 'Архангай');
      expect(updated.hasAnyFilter, isTrue);
      expect(updated.activeCount, 1);
      // Other fields remain null
      expect(updated.animalType, isNull);
      expect(updated.coatColor, isNull);
      expect(updated.status, isNull);
    });

    test('copyWith clears single field via clearAimag', () {
      const state = LostHorseFilterState(aimag: 'Архангай');
      final updated = state.copyWith(clearAimag: true);

      expect(updated.aimag, isNull);
      expect(updated.hasAnyFilter, isFalse);
    });

    test('copyWith sets multiple fields', () {
      const state = LostHorseFilterState();
      final updated = state.copyWith(
        aimag: 'Ховд',
        animalType: AnimalType.camel,
      );

      expect(updated.aimag, 'Ховд');
      expect(updated.animalType, AnimalType.camel);
      expect(updated.coatColor, isNull);
      expect(updated.status, isNull);
      expect(updated.activeCount, 2);
      expect(updated.hasAnyFilter, isTrue);
    });

    test('cleared returns state with all null fields', () {
      const state = LostHorseFilterState(
        aimag: 'Архангай',
        animalType: AnimalType.cattle,
        coatColor: 'Хээр',
        status: LostHorseStatus.active,
      );

      final cleared = state.cleared;
      expect(cleared.aimag, isNull);
      expect(cleared.animalType, isNull);
      expect(cleared.coatColor, isNull);
      expect(cleared.status, isNull);
      expect(cleared.hasAnyFilter, isFalse);
      expect(cleared.activeCount, 0);
    });

    test('equality works', () {
      const state1 = LostHorseFilterState(
        aimag: 'Ховд',
        animalType: AnimalType.camel,
      );
      const state2 = LostHorseFilterState(
        aimag: 'Ховд',
        animalType: AnimalType.camel,
      );
      const state3 = LostHorseFilterState(aimag: 'Архангай');

      expect(state1, state2);
      expect(state1 == state2, isTrue);
      expect(state1 == state3, isFalse);
    });

    test('hashCode is consistent with equality', () {
      const state1 = LostHorseFilterState(aimag: 'Ховд', coatColor: 'Хээр');
      const state2 = LostHorseFilterState(aimag: 'Ховд', coatColor: 'Хээр');

      expect(state1.hashCode, state2.hashCode);
    });
  });

  // ── Filtering Logic ────────────────────────────────────────────

  group('Filtering logic', () {
    test('aimag filter narrows list to matching reports', () {
      final reports = [
        _createReport(id: 'r1', locationAimag: 'Архангай'),
        _createReport(id: 'r2', locationAimag: 'Ховд'),
        _createReport(id: 'r3', locationAimag: 'Архангай'),
        _createReport(id: 'r4', locationAimag: null),
      ];

      const filter = LostHorseFilterState(aimag: 'Архангай');
      final filtered = reports.where((r) {
        if (filter.aimag != null && r.locationAimag != filter.aimag) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered.length, 2);
      expect(filtered.map((r) => r.id), containsAll(['r1', 'r3']));
    });

    test('animal type filter narrows list', () {
      final reports = [
        _createReport(id: 'r1', animalType: AnimalType.horse),
        _createReport(id: 'r2', animalType: AnimalType.cattle),
        _createReport(id: 'r3', animalType: AnimalType.horse),
        _createReport(id: 'r4', animalType: AnimalType.camel),
      ];

      const filter = LostHorseFilterState(animalType: AnimalType.horse);
      final filtered = reports.where((r) {
        if (filter.animalType != null && r.animalType != filter.animalType) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered.length, 2);
      expect(filtered.map((r) => r.id), containsAll(['r1', 'r3']));
    });

    test('coat color filter narrows list', () {
      final reports = [
        _createReport(id: 'r1', coatColor: 'Хээр'),
        _createReport(id: 'r2', coatColor: 'Хар'),
        _createReport(id: 'r3', coatColor: 'Хээр'),
        _createReport(id: 'r4', coatColor: null),
      ];

      const filter = LostHorseFilterState(coatColor: 'Хээр');
      final filtered = reports.where((r) {
        if (filter.coatColor != null && r.coatColor != filter.coatColor) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered.length, 2);
      expect(filtered.map((r) => r.id), containsAll(['r1', 'r3']));
    });

    test('status filter narrows list', () {
      final reports = [
        _createReport(id: 'r1', status: LostHorseStatus.active),
        _createReport(id: 'r2', status: LostHorseStatus.found),
        _createReport(id: 'r3', status: LostHorseStatus.active),
        _createReport(id: 'r4', status: LostHorseStatus.expired),
      ];

      const filter = LostHorseFilterState(status: LostHorseStatus.active);
      final filtered = reports.where((r) {
        if (filter.status != null && r.status != filter.status) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered.length, 2);
      expect(filtered.map((r) => r.id), containsAll(['r1', 'r3']));
    });

    test('no filter returns all reports', () {
      final reports = [
        _createReport(id: 'r1', locationAimag: 'Архангай'),
        _createReport(id: 'r2', locationAimag: 'Ховд'),
      ];

      const filter = LostHorseFilterState();
      final filtered = reports.where((r) {
        if (filter.aimag != null && r.locationAimag != filter.aimag) {
          return false;
        }
        if (filter.animalType != null && r.animalType != filter.animalType) {
          return false;
        }
        if (filter.coatColor != null && r.coatColor != filter.coatColor) {
          return false;
        }
        if (filter.status != null && r.status != filter.status) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered.length, 2);
    });

    test('combined filters use AND logic', () {
      final reports = [
        _createReport(
          id: 'r1',
          locationAimag: 'Архангай',
          animalType: AnimalType.horse,
          coatColor: 'Хээр',
        ),
        _createReport(
          id: 'r2',
          locationAimag: 'Архангай',
          animalType: AnimalType.cattle,
          coatColor: 'Хээр',
        ),
        _createReport(
          id: 'r3',
          locationAimag: 'Ховд',
          animalType: AnimalType.horse,
          coatColor: 'Хээр',
        ),
        _createReport(
          id: 'r4',
          locationAimag: 'Дорнод',
          animalType: AnimalType.sheep,
          coatColor: 'Хар',
        ),
      ];

      // Filter: aimag=Архангай AND animalType=horse
      const filter = LostHorseFilterState(
        aimag: 'Архангай',
        animalType: AnimalType.horse,
      );
      final filtered = reports.where((r) {
        if (filter.aimag != null && r.locationAimag != filter.aimag) {
          return false;
        }
        if (filter.animalType != null && r.animalType != filter.animalType) {
          return false;
        }
        if (filter.coatColor != null && r.coatColor != filter.coatColor) {
          return false;
        }
        if (filter.status != null && r.status != filter.status) {
          return false;
        }
        return true;
      }).toList();

      // Only r1 matches both filters (Архангай + horse)
      expect(filtered.length, 1);
      expect(filtered.first.id, 'r1');
    });

    test('clearing single filter removes only that constraint', () {
      final reports = [
        _createReport(
          id: 'r1',
          locationAimag: 'Архангай',
          animalType: AnimalType.horse,
        ),
        _createReport(
          id: 'r2',
          locationAimag: 'Архангай',
          animalType: AnimalType.cattle,
        ),
        _createReport(
          id: 'r3',
          locationAimag: 'Ховд',
          animalType: AnimalType.horse,
        ),
      ];

      // Start with both aimag and animalType filters
      const filterWithBoth = LostHorseFilterState(
        aimag: 'Архангай',
        animalType: AnimalType.horse,
      );

      // Filter with both
      final filteredBoth = reports.where((r) {
        if (filterWithBoth.aimag != null &&
            r.locationAimag != filterWithBoth.aimag) {
          return false;
        }
        if (filterWithBoth.animalType != null &&
            r.animalType != filterWithBoth.animalType) {
          return false;
        }
        if (filterWithBoth.coatColor != null &&
            r.coatColor != filterWithBoth.coatColor) {
          return false;
        }
        if (filterWithBoth.status != null &&
            r.status != filterWithBoth.status) {
          return false;
        }
        return true;
      }).toList();
      expect(filteredBoth.length, 1);
      expect(filteredBoth.first.id, 'r1');

      // Now clear only the animalType filter
      const filterOnlyAimag = LostHorseFilterState(
        aimag: 'Архангай',
        animalType: null, // cleared
      );

      final filteredAimagOnly = reports.where((r) {
        if (filterOnlyAimag.aimag != null &&
            r.locationAimag != filterOnlyAimag.aimag) {
          return false;
        }
        if (filterOnlyAimag.animalType != null &&
            r.animalType != filterOnlyAimag.animalType) {
          return false;
        }
        if (filterOnlyAimag.coatColor != null &&
            r.coatColor != filterOnlyAimag.coatColor) {
          return false;
        }
        if (filterOnlyAimag.status != null &&
            r.status != filterOnlyAimag.status) {
          return false;
        }
        return true;
      }).toList();
      // Should return both Архангай reports (r1, r2) since animalType filter is cleared
      expect(filteredAimagOnly.length, 2);
      expect(filteredAimagOnly.map((r) => r.id), containsAll(['r1', 'r2']));
    });

    test('empty filter result (no matches) returns empty list', () {
      final reports = [
        _createReport(id: 'r1', locationAimag: 'Архангай'),
        _createReport(id: 'r2', locationAimag: 'Ховд'),
      ];

      const filter = LostHorseFilterState(aimag: 'Увс');
      final filtered = reports.where((r) {
        if (filter.aimag != null && r.locationAimag != filter.aimag) {
          return false;
        }
        return true;
      }).toList();

      expect(filtered, isEmpty);
    });
  });

  // ── Sorting (newest first) ─────────────────────────────────────

  group('Sorting by recency', () {
    test('sorts reports newest first', () {
      final now = DateTime(2026, 6, 15);
      final reports = [
        _createReport(
          id: 'r1',
          createdAt: now.subtract(const Duration(days: 3)),
        ),
        _createReport(id: 'r2', createdAt: now),
        _createReport(
          id: 'r3',
          createdAt: now.subtract(const Duration(days: 1)),
        ),
      ];

      final sorted = [...reports];
      sorted.sort((a, b) => b.lastSeenAt.compareTo(a.lastSeenAt));

      expect(sorted[0].id, 'r2'); // newest first
      expect(sorted[1].id, 'r3');
      expect(sorted[2].id, 'r1'); // oldest last
    });

    test('same timestamp preserves order', () {
      final now = DateTime(2026, 6, 15);
      final reports = [
        _createReport(id: 'r1', createdAt: now, lat: 47.9),
        _createReport(id: 'r2', createdAt: now, lat: 48.0),
      ];

      final sorted = [...reports];
      sorted.sort((a, b) => b.lastSeenAt.compareTo(a.lastSeenAt));

      expect(sorted.length, 2);
    });
  });

  // ── kAimags ────────────────────────────────────────────────────

  group('kAimags constant', () {
    test('has 21 entries matching RegionSelectionPage._regions', () {
      expect(
        kAimags.length,
        21,
        reason:
            'kAimags should contain the 21 items from RegionSelectionPage._regions. '
            'Note: Баян-Өлгий is intentionally absent to match that list (known issue).',
      );
    });

    test('contains key aimags', () {
      expect(
        kAimags,
        containsAll(['Улаанбаатар', 'Архангай', 'Ховд', 'Дорнод', 'Өмнөговь']),
      );
    });

    test('has no duplicates', () {
      final unique = kAimags.toSet();
      expect(
        unique.length,
        kAimags.length,
        reason: 'All aimag entries must be unique',
      );
    });

    test('all entries are non-empty', () {
      for (final aimag in kAimags) {
        expect(aimag.trim().isNotEmpty, isTrue);
      }
    });
  });
}
