import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';

void main() {
  group('BreedingRecord', () {
    BreedingRecord createRecord({
      String id = 'br-1',
      String sireId = 'sire-1',
      String sireName = 'Тэмүүлэн',
      String damId = 'dam-1',
      String damName = 'Алтан',
      DateTime? breedingDate,
      DateTime? expectedFoalingDate,
      String status = 'Хээлтсэн',
      String herdLabel = 'Улаанбаатар',
      String notes = 'Эхний хээлт',
      DateTime? actualFoalingDate,
      String? foalId,
      String? foalName,
      String? foalGender,
      String? foalColor,
    }) {
      final bDate = breedingDate ?? DateTime(2026, 1, 1);
      final eDate = expectedFoalingDate ?? bDate.add(const Duration(days: 340));
      return BreedingRecord(
        id: id,
        sireId: sireId,
        sireName: sireName,
        damId: damId,
        damName: damName,
        breedingDate: bDate,
        expectedFoalingDate: eDate,
        status: status,
        herdLabel: herdLabel,
        notes: notes,
        actualFoalingDate: actualFoalingDate,
        foalId: foalId,
        foalName: foalName,
        foalGender: foalGender,
        foalColor: foalColor,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
    }

    // ── Construction ─────────────────────────────────────────

    group('construction', () {
      test('creates with all required fields', () {
        final record = createRecord();
        expect(record.id, 'br-1');
        expect(record.sireId, 'sire-1');
        expect(record.sireName, 'Тэмүүлэн');
        expect(record.damId, 'dam-1');
        expect(record.damName, 'Алтан');
        expect(record.status, 'Хээлтсэн');
        expect(record.herdLabel, 'Улаанбаатар');
        expect(record.notes, 'Эхний хээлт');
      });

      test('creates with optional foal fields', () {
        final record = createRecord(
          foalId: 'foal-1',
          foalName: 'Шинэ',
          foalGender: 'Эр',
          foalColor: 'Хүрэн',
          actualFoalingDate: DateTime(2026, 12, 1),
        );
        expect(record.foalId, 'foal-1');
        expect(record.foalName, 'Шинэ');
        expect(record.foalGender, 'Эр');
        expect(record.foalColor, 'Хүрэн');
        expect(record.actualFoalingDate, DateTime(2026, 12, 1));
      });

      test('defaults optional foal fields to null', () {
        final record = createRecord();
        expect(record.foalId, isNull);
        expect(record.foalName, isNull);
        expect(record.foalGender, isNull);
        expect(record.foalColor, isNull);
        expect(record.actualFoalingDate, isNull);
      });
    });

    // ── Constants ────────────────────────────────────────────

    group('gestationDays', () {
      test('gestationDays is 340', () {
        expect(BreedingRecord.gestationDays, 340);
      });
    });

    // ── Computed properties ──────────────────────────────────

    group('daysElapsed', () {
      test('returns 0 when breeding was today', () {
        final record = createRecord(breedingDate: DateTime.now());
        expect(record.daysElapsed, 0);
      });

      test('returns correct count for past breeding date', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 150)),
        );
        expect(record.daysElapsed, 150);
      });
    });

    group('daysRemaining', () {
      test('returns positive days for future due date', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 100)),
        );
        expect(record.daysRemaining, greaterThan(0));
      });

      test('returns negative days for past due date', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 400)),
        );
        expect(record.daysRemaining, lessThan(0));
      });

      test('returns ~240 days at start of gestation (100 days in)', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 100)),
        );
        expect(record.daysRemaining, closeTo(240, 1));
      });
    });

    group('gestationProgress', () {
      test('returns 0.0 at start of gestation', () {
        final record = createRecord(breedingDate: DateTime.now());
        expect(record.gestationProgress, 0.0);
      });

      test('returns ~1.0 at full gestation', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 340)),
        );
        expect(record.gestationProgress, closeTo(1.0, 0.02));
      });

      test('clamps at maximum 1.5', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 600)),
        );
        expect(record.gestationProgress, 1.5);
      });
    });

    group('isOverdue', () {
      test('returns false when due date is in the future', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 100)),
        );
        expect(record.isOverdue, isFalse);
      });

      test('returns true when due date is in the past', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 400)),
        );
        expect(record.isOverdue, isTrue);
      });
    });

    group('isApproaching', () {
      test('returns true when 1-30 days remaining', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 325)),
        );
        expect(record.isApproaching, isTrue);
      });

      test('returns false when more than 30 days remaining', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 100)),
        );
        expect(record.isApproaching, isFalse);
      });

      test('returns false when overdue', () {
        final record = createRecord(
          breedingDate: DateTime.now().subtract(const Duration(days: 400)),
        );
        expect(record.isApproaching, isFalse);
      });
    });

    group('statusCategory', () {
      test('returns healthy for pending when not approaching/overdue', () {
        final record = createRecord(
          status: 'Хээлтсэн',
          breedingDate: DateTime.now().subtract(const Duration(days: 100)),
        );
        expect(record.statusCategory, GestationStatusCategory.healthy);
      });

      test('returns approaching when in final 30 days', () {
        final record = createRecord(
          status: 'Хээлтсэн',
          breedingDate: DateTime.now().subtract(const Duration(days: 320)),
        );
        expect(record.statusCategory, GestationStatusCategory.approaching);
      });

      test('returns overdue when past due date', () {
        final record = createRecord(
          status: 'Хээлтсэн',
          breedingDate: DateTime.now().subtract(const Duration(days: 400)),
        );
        expect(record.statusCategory, GestationStatusCategory.overdue);
      });

      test('returns foaled when status is foaled', () {
        final record = createRecord(status: 'Төллөсөн');
        expect(record.statusCategory, GestationStatusCategory.foaled);
      });

      test('returns aborted when status is aborted', () {
        final record = createRecord(status: 'Хээл хаясан');
        expect(record.statusCategory, GestationStatusCategory.aborted);
      });
    });

    // ── Status transitions ───────────────────────────────────

    group('status transitions', () {
      test('copyWith transitions from pending to foaled', () {
        final record = createRecord(status: 'Хээлтсэн');
        final foaled = record.copyWith(
          status: 'Төллөсөн',
          actualFoalingDate: DateTime.now(),
          foalId: 'foal-1',
          foalName: 'Шинэ',
          foalGender: 'Эр',
          foalColor: 'Хүрэн',
        );
        expect(foaled.status, 'Төллөсөн');
        expect(foaled.actualFoalingDate, isNotNull);
        expect(foaled.foalId, 'foal-1');
        expect(foaled.statusCategory, GestationStatusCategory.foaled);
      });

      test('copyWith transitions from pending to aborted', () {
        final record = createRecord(status: 'Хээлтсэн');
        final aborted = record.copyWith(status: 'Хээл хаясан');
        expect(aborted.status, 'Хээл хаясан');
        expect(aborted.statusCategory, GestationStatusCategory.aborted);
      });

      test('copyWith preserves other fields during status change', () {
        final record = createRecord();
        final foaled = record.copyWith(
          status: 'Төллөсөн',
          actualFoalingDate: DateTime.now(),
        );
        expect(foaled.id, record.id);
        expect(foaled.sireId, record.sireId);
        expect(foaled.damId, record.damId);
        expect(foaled.breedingDate, record.breedingDate);
      });
    });

    // ── Serialization ────────────────────────────────────────

    group('serialization', () {
      test('toJson produces correct map', () {
        final record = createRecord(
          breedingDate: DateTime(2026, 3, 1),
          foalId: 'foal-1',
          foalName: 'Шинэ',
        );
        final json = record.toJson();

        expect(json['id'], 'br-1');
        expect(json['sireId'], 'sire-1');
        expect(json['sireName'], 'Тэмүүлэн');
        expect(json['damId'], 'dam-1');
        expect(json['damName'], 'Алтан');
        expect(json['breedingDate'], DateTime(2026, 3, 1).toIso8601String());
        expect(json['status'], 'Хээлтсэн');
        expect(json['herdLabel'], 'Улаанбаатар');
        expect(json['foalId'], 'foal-1');
        expect(json['foalName'], 'Шинэ');
        expect(json['actualFoalingDate'], isNull);
      });

      test('toJson includes actualFoalingDate when present', () {
        final record = createRecord(actualFoalingDate: DateTime(2026, 12, 1));
        final json = record.toJson();
        expect(
          json['actualFoalingDate'],
          DateTime(2026, 12, 1).toIso8601String(),
        );
      });

      test('fromJson round-trips correctly', () {
        final original = createRecord(
          breedingDate: DateTime(2026, 3, 1),
          expectedFoalingDate: DateTime(2027, 2, 4),
          status: 'Төллөсөн',
          actualFoalingDate: DateTime(2027, 2, 3),
          foalId: 'foal-1',
          foalName: 'Шинэ',
          foalGender: 'Эр',
          foalColor: 'Хүрэн',
        );
        final json = original.toJson();
        final restored = BreedingRecord.fromJson(json);

        expect(restored.id, original.id);
        expect(restored.sireId, original.sireId);
        expect(restored.sireName, original.sireName);
        expect(restored.damId, original.damId);
        expect(restored.damName, original.damName);
        expect(restored.breedingDate, original.breedingDate);
        expect(restored.expectedFoalingDate, original.expectedFoalingDate);
        expect(restored.status, original.status);
        expect(restored.herdLabel, original.herdLabel);
        expect(restored.notes, original.notes);
        expect(restored.actualFoalingDate, original.actualFoalingDate);
        expect(restored.foalId, original.foalId);
        expect(restored.foalName, original.foalName);
        expect(restored.foalGender, original.foalGender);
        expect(restored.foalColor, original.foalColor);
      });

      test('fromJson handles null optional fields', () {
        final json = {
          'id': 'br-2',
          'sireId': 'sire-2',
          'sireName': 'Азарга',
          'damId': 'dam-2',
          'damName': 'Азарга',
          'breedingDate': '2026-06-01T00:00:00.000',
          'expectedFoalingDate': '2027-05-07T00:00:00.000',
          'status': 'Хээлтсэн',
          'herdLabel': 'Дархан',
          'notes': '',
          'actualFoalingDate': null,
          'foalId': null,
          'foalName': null,
          'foalGender': null,
          'foalColor': null,
          'createdAt': '2026-01-01T00:00:00.000',
          'updatedAt': '2026-01-01T00:00:00.000',
        };
        final record = BreedingRecord.fromJson(json);
        expect(record.actualFoalingDate, isNull);
        expect(record.foalId, isNull);
        expect(record.foalName, isNull);
      });
    });

    // ── copyWith ─────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final record = createRecord(notes: 'Old notes');
        final copied = record.copyWith(notes: 'New notes');
        expect(copied.notes, 'New notes');
        expect(copied.id, record.id);
      });

      test('clearFoalId sets foalId to null', () {
        final record = createRecord(foalId: 'foal-1');
        final cleared = record.copyWith(clearFoalId: true);
        expect(cleared.foalId, isNull);
      });

      test('clearActualFoalingDate sets actualFoalingDate to null', () {
        final record = createRecord(actualFoalingDate: DateTime.now());
        final cleared = record.copyWith(clearActualFoalingDate: true);
        expect(cleared.actualFoalingDate, isNull);
      });

      test(
        'clearFoalInfo clears foalName/foalGender/foalColor but not foalId',
        () {
          final record = createRecord(
            foalId: 'foal-1',
            foalName: 'Шинэ',
            foalGender: 'Эр',
            foalColor: 'Хүрэн',
          );
          final cleared = record.copyWith(clearFoalInfo: true);
          // clearFoalInfo only affects foalName, foalGender, foalColor
          expect(cleared.foalId, 'foal-1');
          expect(cleared.foalName, isNull);
          expect(cleared.foalGender, isNull);
          expect(cleared.foalColor, isNull);
        },
      );

      test('clearFoalId + clearFoalInfo together clear all foal fields', () {
        final record = createRecord(
          foalId: 'foal-1',
          foalName: 'Шинэ',
          foalGender: 'Эр',
          foalColor: 'Хүрэн',
        );
        final cleared = record.copyWith(clearFoalId: true, clearFoalInfo: true);
        expect(cleared.foalId, isNull);
        expect(cleared.foalName, isNull);
        expect(cleared.foalGender, isNull);
        expect(cleared.foalColor, isNull);
      });

      test('copyWith with no args returns same field values', () {
        final record = createRecord();
        final copied = record.copyWith();
        expect(copied.id, record.id);
        expect(copied.sireId, record.sireId);
        expect(copied.sireName, record.sireName);
        expect(copied.damId, record.damId);
        expect(copied.damName, record.damName);
        expect(copied.breedingDate, record.breedingDate);
        expect(copied.expectedFoalingDate, record.expectedFoalingDate);
        expect(copied.status, record.status);
        expect(copied.herdLabel, record.herdLabel);
        expect(copied.notes, record.notes);
      });

      test('toString returns string', () {
        final record = createRecord();
        expect(record.toString(), isA<String>());
      });
    });
  });

  group('GestationStatusCategory', () {
    test('has all expected values', () {
      expect(GestationStatusCategory.values, hasLength(5));
      expect(
        GestationStatusCategory.values,
        contains(GestationStatusCategory.healthy),
      );
      expect(
        GestationStatusCategory.values,
        contains(GestationStatusCategory.approaching),
      );
      expect(
        GestationStatusCategory.values,
        contains(GestationStatusCategory.overdue),
      );
      expect(
        GestationStatusCategory.values,
        contains(GestationStatusCategory.foaled),
      );
      expect(
        GestationStatusCategory.values,
        contains(GestationStatusCategory.aborted),
      );
    });
  });
}
