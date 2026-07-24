import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/training/domain/training_log.dart';

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // TrainingLogType enum
  // ═══════════════════════════════════════════════════════════════════
  group('TrainingLogType', () {
    test('has exactly 4 values', () {
      expect(TrainingLogType.values, hasLength(4));
      expect(TrainingLogType.values, contains(TrainingLogType.gallop));
      expect(TrainingLogType.values, contains(TrainingLogType.sprint));
      expect(TrainingLogType.values, contains(TrainingLogType.endurance));
      expect(TrainingLogType.values, contains(TrainingLogType.rest));
    });

    test('displayName returns Mongolian labels', () {
      expect(TrainingLogType.gallop.displayName, 'Хурдалгаа');
      expect(TrainingLogType.sprint.displayName, 'Спринт');
      expect(TrainingLogType.endurance.displayName, 'Тэвчээр');
      expect(TrainingLogType.rest.displayName, 'Амралт');
    });

    test('displayName is non-empty for all values', () {
      for (final type in TrainingLogType.values) {
        expect(
          type.displayName.isNotEmpty,
          isTrue,
          reason: '${type.name} should have a non-empty displayName',
        );
      }
    });

    test('name matches expected serialized value', () {
      expect(TrainingLogType.gallop.name, 'gallop');
      expect(TrainingLogType.sprint.name, 'sprint');
      expect(TrainingLogType.endurance.name, 'endurance');
      expect(TrainingLogType.rest.name, 'rest');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // TrainingLog model
  // ═══════════════════════════════════════════════════════════════════
  group('TrainingLog', () {
    // ── Constructor ──────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.id, 'tl-1');
      expect(log.horseId, 'horse-1');
      expect(log.type, TrainingLogType.gallop);
      expect(log.date, DateTime(2026, 6, 1));
      expect(log.durationMinutes, 30);
    });

    test('constructor assigns optional fields', () {
      final log = TrainingLog(
        id: 'tl-2',
        horseId: 'horse-2',
        type: TrainingLogType.endurance,
        date: DateTime(2026, 6, 2),
        durationMinutes: 60,
        distanceKm: 10.5,
        notes: 'Урт зай',
        handlerName: 'Дорж',
        weather: 'Нартай',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.distanceKm, 10.5);
      expect(log.notes, 'Урт зай');
      expect(log.handlerName, 'Дорж');
      expect(log.weather, 'Нартай');
    });

    test('optional fields default to null/empty', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.rest,
        date: DateTime(2026, 6, 1),
        durationMinutes: 0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.distanceKm, isNull);
      expect(log.notes, '');
      expect(log.handlerName, isNull);
      expect(log.weather, isNull);
    });

    // ── copyWith ─────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = log.copyWith(
        notes: 'Updated',
        durationMinutes: 45,
        distanceKm: 8.0,
      );
      expect(updated.id, 'tl-1');
      expect(updated.notes, 'Updated');
      expect(updated.durationMinutes, 45);
      expect(updated.distanceKm, 8.0);
      expect(updated.type, TrainingLogType.gallop);
    });

    test('copyWith with no args preserves all fields', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.sprint,
        date: DateTime(2026, 6, 1),
        durationMinutes: 20,
        distanceKm: 3.0,
        notes: 'Test',
        handlerName: 'Баяр',
        weather: 'Салхитай',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = log.copyWith();
      expect(same.id, log.id);
      expect(same.horseId, log.horseId);
      expect(same.type, log.type);
      expect(same.date, log.date);
      expect(same.durationMinutes, log.durationMinutes);
      expect(same.distanceKm, log.distanceKm);
      expect(same.notes, log.notes);
      expect(same.handlerName, log.handlerName);
      expect(same.weather, log.weather);
    });

    test('copyWith sets nullable fields to null', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        distanceKm: 5.0,
        handlerName: 'Дорж',
        weather: 'Нартай',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = log.copyWith(
        distanceKm: null,
        handlerName: null,
        weather: null,
      );
      expect(updated.distanceKm, isNull);
      expect(updated.handlerName, isNull);
      expect(updated.weather, isNull);
    });

    // ── Equality ─────────────────────────────────────────────

    test('equality — identical training logs are equal', () {
      final a = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a, b);
    });

    test('equality — different id makes logs not equal', () {
      final a = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = TrainingLog(
        id: 'tl-2',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different type makes logs not equal', () {
      final a = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.sprint,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── Serialization — Local JSON ───────────────────────────

    test('toJson serializes all fields', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.endurance,
        date: DateTime(2026, 6, 2),
        durationMinutes: 60,
        distanceKm: 10.5,
        notes: 'Урт зай',
        handlerName: 'Дорж',
        weather: 'Нартай',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();

      expect(json['id'], 'tl-1');
      expect(json['horseId'], 'horse-1');
      expect(json['type'], 'endurance');
      expect(json['date'], '2026-06-02T00:00:00.000');
      expect(json['durationMinutes'], 60);
      expect(json['distanceKm'], 10.5);
      expect(json['notes'], 'Урт зай');
      expect(json['handlerName'], 'Дорж');
      expect(json['weather'], 'Нартай');
    });

    test('fromJson deserializes correctly', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        distanceKm: 5.0,
        notes: 'Хурд',
        handlerName: 'Болд',
        weather: 'Сайн',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      final restored = TrainingLog.fromJson(json);

      expect(restored.id, log.id);
      expect(restored.horseId, log.horseId);
      expect(restored.type, log.type);
      expect(restored.date, log.date);
      expect(restored.durationMinutes, log.durationMinutes);
      expect(restored.distanceKm, log.distanceKm);
      expect(restored.notes, log.notes);
      expect(restored.handlerName, log.handlerName);
      expect(restored.weather, log.weather);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'tl-1',
        'horseId': 'horse-1',
        'type': 'gallop',
        'date': '2026-06-01T00:00:00.000',
        'durationMinutes': 30,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final log = TrainingLog.fromJson(json);
      expect(log.distanceKm, isNull);
      expect(log.notes, '');
      expect(log.handlerName, isNull);
      expect(log.weather, isNull);
    });

    test('toJson includes null optional fields as null', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.rest,
        date: DateTime(2026, 6, 1),
        durationMinutes: 0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      expect(json['distanceKm'], isNull);
      expect(json['handlerName'], isNull);
      expect(json['weather'], isNull);
    });

    // ── Serialization — Supabase JSON ────────────────────────

    test(
      'toSupabaseJson uses snake_case keys and includes ownerId/updated_at',
      () {
        final log = TrainingLog(
          id: 'tl-1',
          horseId: 'horse-1',
          type: TrainingLogType.sprint,
          date: DateTime(2026, 6, 1),
          durationMinutes: 20,
          distanceKm: 3.0,
          notes: 'Спринт',
          handlerName: 'Дорж',
          weather: 'Нартай',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        final json = log.toSupabaseJson(ownerId: 'user-1');

        expect(json['owner_id'], 'user-1');
        expect(json['id'], 'tl-1');
        expect(json['horse_id'], 'horse-1');
        expect(json['type'], 'sprint');
        expect(json['date'], '2026-06-01T00:00:00.000');
        expect(json['duration_minutes'], 20);
        expect(json['distance_km'], 3.0);
        expect(json['notes'], 'Спринт');
        expect(json['handler_name'], 'Дорж');
        expect(json['weather'], 'Нартай');
        expect(json['updated_at'], isA<String>());
      },
    );

    test('fromSupabaseJson deserializes snake_case', () {
      final supabase = {
        'id': 'tl-1',
        'horse_id': 'horse-1',
        'type': 'gallop',
        'date': '2026-06-01T00:00:00.000',
        'duration_minutes': 30,
        'distance_km': null,
        'notes': 'Test',
        'handler_name': null,
        'weather': null,
      };
      final log = TrainingLog.fromSupabaseJson(supabase);
      expect(log.id, 'tl-1');
      expect(log.horseId, 'horse-1');
      expect(log.type, TrainingLogType.gallop);
      expect(log.date, DateTime(2026, 6, 1));
      expect(log.durationMinutes, 30);
      expect(log.distanceKm, isNull);
      expect(log.notes, 'Test');
      expect(log.handlerName, isNull);
      expect(log.weather, isNull);
    });

    // ── toString ─────────────────────────────────────────────

    test('toString includes key fields', () {
      final log = TrainingLog(
        id: 'tl-1',
        horseId: 'horse-1',
        type: TrainingLogType.gallop,
        date: DateTime(2026, 6, 1),
        durationMinutes: 30,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = log.toString();
      expect(str, contains('tl-1'));
      expect(str, contains('gallop'));
    });
  });
}
