import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/shared/domain/health_log.dart';

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // LogType enum (shared domain)
  // ═══════════════════════════════════════════════════════════════════
  group('LogType', () {
    test('has exactly 6 values', () {
      expect(LogType.values, hasLength(6));
      expect(LogType.values, contains(LogType.vaccination));
      expect(LogType.values, contains(LogType.deworming));
      expect(LogType.values, contains(LogType.treatment));
      expect(LogType.values, contains(LogType.vetVisit));
      expect(LogType.values, contains(LogType.shoeing));
      expect(LogType.values, contains(LogType.trimming));
    });

    test('displayName returns Mongolian labels', () {
      expect(LogType.vaccination.displayName, 'Вакцинжуулалт');
      expect(LogType.deworming.displayName, 'Туулгалт');
      expect(LogType.treatment.displayName, 'Эмчилгээ');
      expect(LogType.vetVisit.displayName, 'Эмчийн үзлэг');
      expect(LogType.shoeing.displayName, 'Эмээл');
      expect(LogType.trimming.displayName, 'Тайралт');
    });

    test('displayName is non-empty for all values', () {
      for (final type in LogType.values) {
        expect(
          type.displayName.isNotEmpty,
          isTrue,
          reason: '${type.name} should have a non-empty displayName',
        );
      }
    });

    test('name matches expected serialized value', () {
      expect(LogType.vaccination.name, 'vaccination');
      expect(LogType.deworming.name, 'deworming');
      expect(LogType.treatment.name, 'treatment');
      expect(LogType.vetVisit.name, 'vetVisit');
      expect(LogType.shoeing.name, 'shoeing');
      expect(LogType.trimming.name, 'trimming');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // HealthLog (shared domain)
  // ═══════════════════════════════════════════════════════════════════
  group('HealthLog', () {
    // ── Constructor ──────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Жич',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.id, 'hl-1');
      expect(log.horseId, 'horse-1');
      expect(log.logType, LogType.vaccination);
      expect(log.date, DateTime(2026, 1, 15));
      expect(log.notes, 'Жич');
    });

    test('optional fields default to null', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.medicament, isNull);
      expect(log.cost, isNull);
      expect(log.farrierName, isNull);
    });

    test('constructor assigns optional fields', () {
      final log = HealthLog(
        id: 'hl-2',
        horseId: 'horse-2',
        logType: LogType.treatment,
        date: DateTime(2026, 2, 20),
        notes: 'Эмчилгээ',
        medicament: 'Антибиотик',
        cost: 50000.0,
        farrierName: 'Дорж',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.medicament, 'Антибиотик');
      expect(log.cost, 50000.0);
      expect(log.farrierName, 'Дорж');
    });

    // ── copyWith ─────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Original',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = log.copyWith(
        notes: 'Updated',
        medicament: 'Шинэ эм',
        cost: 25000.0,
      );
      expect(updated.id, 'hl-1');
      expect(updated.notes, 'Updated');
      expect(updated.medicament, 'Шинэ эм');
      expect(updated.cost, 25000.0);
      expect(updated.logType, LogType.vaccination);
    });

    test('copyWith with no args preserves all fields', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.deworming,
        date: DateTime(2026, 3, 1),
        notes: 'Test',
        medicament: 'Эм',
        cost: 10000.0,
        farrierName: 'Баяр',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = log.copyWith();
      expect(same.id, log.id);
      expect(same.horseId, log.horseId);
      expect(same.logType, log.logType);
      expect(same.date, log.date);
      expect(same.notes, log.notes);
      expect(same.medicament, log.medicament);
      expect(same.cost, log.cost);
      expect(same.farrierName, log.farrierName);
    });

    // ── Equality ─────────────────────────────────────────────

    test('equality — identical health logs are equal', () {
      final now = DateTime.now();
      final a = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: now,
        updatedAt: now,
      );
      final b = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: now,
        updatedAt: now,
      );
      expect(a, b);
    });

    test('equality — different id makes logs not equal', () {
      final a = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = HealthLog(
        id: 'hl-2',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different logType makes logs not equal', () {
      final a = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.deworming,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── Serialization — Local JSON ───────────────────────────

    test('toJson serializes all fields', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.treatment,
        date: DateTime(2026, 2, 20, 14, 30),
        notes: 'Эмчилгээ',
        medicament: 'Антибиотик',
        cost: 50000.0,
        farrierName: 'Дорж',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();

      expect(json['id'], 'hl-1');
      expect(json['horseId'], 'horse-1');
      expect(json['logType'], 'treatment');
      expect(json['date'], '2026-02-20T14:30:00.000');
      expect(json['notes'], 'Эмчилгээ');
      expect(json['medicament'], 'Антибиотик');
      expect(json['cost'], 50000.0);
      expect(json['farrierName'], 'Дорж');
    });

    test('fromJson deserializes correctly', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Вакцин',
        medicament: 'Вакцин A',
        cost: 20000.0,
        farrierName: 'Болд',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      final restored = HealthLog.fromJson(json);

      expect(restored.id, log.id);
      expect(restored.horseId, log.horseId);
      expect(restored.logType, log.logType);
      expect(restored.date, log.date);
      expect(restored.notes, log.notes);
      expect(restored.medicament, log.medicament);
      expect(restored.cost, log.cost);
      expect(restored.farrierName, log.farrierName);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'hl-1',
        'horseId': 'horse-1',
        'logType': 'vaccination',
        'date': '2026-01-15T00:00:00.000',
        'notes': 'Test',
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final log = HealthLog.fromJson(json);
      expect(log.medicament, isNull);
      expect(log.cost, isNull);
      expect(log.farrierName, isNull);
    });

    test('toJson includes null optional fields as null', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      expect(json['medicament'], isNull);
      expect(json['cost'], isNull);
      expect(json['farrierName'], isNull);
    });

    // ── Serialization — Supabase JSON ────────────────────────

    test(
      'toSupabaseJson uses snake_case keys and includes ownerId/updated_at',
      () {
        final log = HealthLog(
          id: 'hl-1',
          horseId: 'horse-1',
          logType: LogType.shoeing,
          date: DateTime(2026, 4, 10),
          notes: 'Шинэ эмээл',
          cost: 30000.0,
          farrierName: 'Дорж',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        final json = log.toSupabaseJson(ownerId: 'user-1');

        expect(json['owner_id'], 'user-1');
        expect(json['id'], 'hl-1');
        expect(json['horse_id'], 'horse-1');
        expect(json['log_type'], 'shoeing');
        expect(json['date'], '2026-04-10T00:00:00.000');
        expect(json['notes'], 'Шинэ эмээл');
        expect(json['cost'], 30000.0);
        expect(json['farrier_name'], 'Дорж');
        expect(json['updated_at'], isA<String>());
      },
    );

    test('fromSupabaseJson deserializes snake_case', () {
      final supabase = {
        'id': 'hl-1',
        'horse_id': 'horse-1',
        'log_type': 'vaccination',
        'date': '2026-01-15T00:00:00.000',
        'notes': 'Test',
        'medicament': null,
        'cost': null,
        'farrier_name': null,
      };
      final log = HealthLog.fromSupabaseJson(supabase);
      expect(log.id, 'hl-1');
      expect(log.horseId, 'horse-1');
      expect(log.logType, LogType.vaccination);
      expect(log.date, DateTime(2026, 1, 15));
      expect(log.notes, 'Test');
      expect(log.medicament, isNull);
      expect(log.cost, isNull);
      expect(log.farrierName, isNull);
    });

    // ── toString ─────────────────────────────────────────────

    test('toString includes key fields', () {
      final log = HealthLog(
        id: 'hl-1',
        horseId: 'horse-1',
        logType: LogType.vaccination,
        date: DateTime(2026, 1, 15),
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = log.toString();
      expect(str, contains('hl-1'));
      expect(str, contains('vaccination'));
    });
  });
}
