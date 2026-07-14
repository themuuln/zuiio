import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // FeedType enum
  // ═══════════════════════════════════════════════════════════════════
  group('FeedType', () {
    test('has exactly 3 values', () {
      expect(FeedType.values, hasLength(3));
      expect(FeedType.values, contains(FeedType.hay));
      expect(FeedType.values, contains(FeedType.grain));
      expect(FeedType.values, contains(FeedType.supplement));
    });

    test('displayName returns Mongolian labels', () {
      expect(FeedType.hay.displayName, 'Өвс');
      expect(FeedType.grain.displayName, 'Тэжээл');
      expect(FeedType.supplement.displayName, 'Нэмэлт');
    });

    test('displayName is non-empty for all values', () {
      for (final type in FeedType.values) {
        expect(type.displayName.isNotEmpty, isTrue,
            reason: '${type.name} should have a non-empty displayName');
      }
    });

    test('name matches expected serialized value', () {
      expect(FeedType.hay.name, 'hay');
      expect(FeedType.grain.name, 'grain');
      expect(FeedType.supplement.name, 'supplement');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FeedSchedule model
  // ═══════════════════════════════════════════════════════════════════
  group('FeedSchedule', () {
    // ── Constructor ──────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(schedule.id, 'fs-1');
      expect(schedule.horseId, 'horse-1');
      expect(schedule.feedType, FeedType.hay);
      expect(schedule.quantityKg, 5.0);
      expect(schedule.frequency, 'Өдөр бүр');
      expect(schedule.startDate, DateTime(2026, 6, 1));
    });

    test('constructor assigns optional fields', () {
      final schedule = FeedSchedule(
        id: 'fs-2',
        horseId: 'horse-2',
        feedType: FeedType.grain,
        quantityKg: 2.0,
        frequency: 'Өдөрт 2 удаа',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Тэжээл нэмэх',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(schedule.endDate, DateTime(2026, 8, 1));
      expect(schedule.notes, 'Тэжээл нэмэх');
    });

    test('optional fields default to null/empty', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(schedule.endDate, isNull);
      expect(schedule.notes, '');
    });

    // ── copyWith ─────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = schedule.copyWith(
        quantityKg: 8.0,
        notes: 'Илүү өвс',
        feedType: FeedType.supplement,
      );
      expect(updated.id, 'fs-1');
      expect(updated.quantityKg, 8.0);
      expect(updated.notes, 'Илүү өвс');
      expect(updated.feedType, FeedType.supplement);
      expect(updated.horseId, 'horse-1');
    });

    test('copyWith with no args preserves all fields', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.grain,
        quantityKg: 2.0,
        frequency: 'Өдөрт 2 удаа',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Тэжээл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = schedule.copyWith();
      expect(same.id, schedule.id);
      expect(same.horseId, schedule.horseId);
      expect(same.feedType, schedule.feedType);
      expect(same.quantityKg, schedule.quantityKg);
      expect(same.frequency, schedule.frequency);
      expect(same.startDate, schedule.startDate);
      expect(same.endDate, schedule.endDate);
      expect(same.notes, schedule.notes);
    });

    test('copyWith sets nullable fields to null', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Тэмдэглэл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = schedule.copyWith(
        endDate: null,
        notes: '',
      );
      expect(updated.endDate, isNull);
      expect(updated.notes, '');
    });

    // ── Equality ─────────────────────────────────────────────

    test('equality — identical feed schedules are equal', () {
      final a = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a, b);
    });

    test('equality — different id makes schedules not equal', () {
      final a = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedSchedule(
        id: 'fs-2',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different feedType makes schedules not equal', () {
      final a = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.grain,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── Serialization — Local JSON ───────────────────────────

    test('toJson serializes all fields', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Өвс нэмэх',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = schedule.toJson();

      expect(json['id'], 'fs-1');
      expect(json['horseId'], 'horse-1');
      expect(json['feedType'], 'hay');
      expect(json['quantityKg'], 5.0);
      expect(json['frequency'], 'Өдөр бүр');
      expect(json['startDate'], '2026-06-01T00:00:00.000');
      expect(json['endDate'], '2026-08-01T00:00:00.000');
      expect(json['notes'], 'Өвс нэмэх');
    });

    test('fromJson deserializes correctly', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.grain,
        quantityKg: 2.5,
        frequency: 'Өдөрт 2 удаа',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Тэжээл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = schedule.toJson();
      final restored = FeedSchedule.fromJson(json);

      expect(restored.id, schedule.id);
      expect(restored.horseId, schedule.horseId);
      expect(restored.feedType, schedule.feedType);
      expect(restored.quantityKg, schedule.quantityKg);
      expect(restored.frequency, schedule.frequency);
      expect(restored.startDate, schedule.startDate);
      expect(restored.endDate, schedule.endDate);
      expect(restored.notes, schedule.notes);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'fs-1',
        'horseId': 'horse-1',
        'feedType': 'hay',
        'quantityKg': 5.0,
        'frequency': 'Өдөр бүр',
        'startDate': '2026-06-01T00:00:00.000',
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final schedule = FeedSchedule.fromJson(json);
      expect(schedule.endDate, isNull);
      expect(schedule.notes, '');
    });

    test('toJson includes null optional fields as null', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.supplement,
        quantityKg: 0.5,
        frequency: 'Долоо хоногт 1 удаа',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = schedule.toJson();
      expect(json['endDate'], isNull);
    });

    // ── Serialization — Supabase JSON ────────────────────────

    test('toSupabaseJson uses snake_case keys and includes ownerId/updated_at', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        endDate: DateTime(2026, 8, 1),
        notes: 'Өвс',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = schedule.toSupabaseJson(ownerId: 'user-1');

      expect(json['owner_id'], 'user-1');
      expect(json['id'], 'fs-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['feed_type'], 'hay');
      expect(json['quantity_kg'], 5.0);
      expect(json['frequency'], 'Өдөр бүр');
      expect(json['start_date'], '2026-06-01T00:00:00.000');
      expect(json['end_date'], '2026-08-01T00:00:00.000');
      expect(json['notes'], 'Өвс');
      expect(json['updated_at'], isA<String>());
    });

    test('fromSupabaseJson deserializes snake_case', () {
      final supabase = {
        'id': 'fs-1',
        'horse_id': 'horse-1',
        'feed_type': 'hay',
        'quantity_kg': 5.0,
        'frequency': 'Өдөр бүр',
        'start_date': '2026-06-01T00:00:00.000',
        'end_date': null,
        'notes': '',
      };
      final schedule = FeedSchedule.fromSupabaseJson(supabase);
      expect(schedule.id, 'fs-1');
      expect(schedule.horseId, 'horse-1');
      expect(schedule.feedType, FeedType.hay);
      expect(schedule.quantityKg, 5.0);
      expect(schedule.frequency, 'Өдөр бүр');
      expect(schedule.startDate, DateTime(2026, 6, 1));
      expect(schedule.endDate, isNull);
      expect(schedule.notes, '');
    });

    // ── toString ─────────────────────────────────────────────

    test('toString includes key fields', () {
      final schedule = FeedSchedule(
        id: 'fs-1',
        horseId: 'horse-1',
        feedType: FeedType.hay,
        quantityKg: 5.0,
        frequency: 'Өдөр бүр',
        startDate: DateTime(2026, 6, 1),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = schedule.toString();
      expect(str, contains('fs-1'));
      expect(str, contains('hay'));
    });
  });
}
