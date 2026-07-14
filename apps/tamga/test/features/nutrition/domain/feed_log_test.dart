import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/nutrition/domain/feed_log.dart';

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // FeedLog model
  // ═══════════════════════════════════════════════════════════════════
  group('FeedLog', () {
    // ── Constructor ──────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 4.5,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.id, 'fl-1');
      expect(log.scheduleId, 'fs-1');
      expect(log.horseId, 'horse-1');
      expect(log.date, DateTime(2026, 6, 1));
      expect(log.amountGiven, 4.5);
      expect(log.skipped, false);
    });

    test('constructor assigns optional fields', () {
      final log = FeedLog(
        id: 'fl-2',
        scheduleId: 'fs-2',
        horseId: 'horse-2',
        date: DateTime(2026, 6, 2),
        amountGiven: 0.0,
        skipped: true,
        notes: 'Морины хоолны дуршил муу',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.notes, 'Морины хоолны дуршил муу');
    });

    test('optional fields default correctly', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(log.notes, '');
    });

    // ── copyWith ─────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = log.copyWith(
        amountGiven: 3.0,
        skipped: true,
        notes: 'Бага хэмжээгээр хооллосон',
      );
      expect(updated.id, 'fl-1');
      expect(updated.amountGiven, 3.0);
      expect(updated.skipped, true);
      expect(updated.notes, 'Бага хэмжээгээр хооллосон');
      expect(updated.scheduleId, 'fs-1');
    });

    test('copyWith with no args preserves all fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = log.copyWith();
      expect(same.id, log.id);
      expect(same.scheduleId, log.scheduleId);
      expect(same.horseId, log.horseId);
      expect(same.date, log.date);
      expect(same.amountGiven, log.amountGiven);
      expect(same.skipped, log.skipped);
      expect(same.notes, log.notes);
    });

    test('copyWith resets notes to empty string', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        notes: 'Тэмдэглэл',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = log.copyWith(notes: '');
      expect(updated.notes, '');
    });

    // ── Equality ─────────────────────────────────────────────

    test('equality — identical feed logs are equal', () {
      final a = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a, b);
    });

    test('equality — different id makes logs not equal', () {
      final a = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedLog(
        id: 'fl-2',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different skipped makes logs not equal', () {
      final a = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── Serialization — Local JSON ───────────────────────────

    test('toJson serializes all fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 4.5,
        skipped: false,
        notes: 'Өглөө хооллосон',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();

      expect(json['id'], 'fl-1');
      expect(json['scheduleId'], 'fs-1');
      expect(json['horseId'], 'horse-1');
      expect(json['date'], '2026-06-01T00:00:00.000');
      expect(json['amountGiven'], 4.5);
      expect(json['skipped'], false);
      expect(json['notes'], 'Өглөө хооллосон');
    });

    test('fromJson deserializes correctly', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        notes: 'Хооллосон',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      final restored = FeedLog.fromJson(json);

      expect(restored.id, log.id);
      expect(restored.scheduleId, log.scheduleId);
      expect(restored.horseId, log.horseId);
      expect(restored.date, log.date);
      expect(restored.amountGiven, log.amountGiven);
      expect(restored.skipped, log.skipped);
      expect(restored.notes, log.notes);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'fl-1',
        'scheduleId': 'fs-1',
        'horseId': 'horse-1',
        'date': '2026-06-01T00:00:00.000',
        'amountGiven': 5.0,
        'skipped': false,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final log = FeedLog.fromJson(json);
      expect(log.notes, '');
    });

    test('toJson includes default optional fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toJson();
      expect(json['notes'], '');
    });

    // ── Serialization — Supabase JSON ────────────────────────

    test('toSupabaseJson uses snake_case keys and includes ownerId/updated_at', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 4.5,
        skipped: false,
        notes: 'Өглөө',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = log.toSupabaseJson(ownerId: 'user-1');

      expect(json['owner_id'], 'user-1');
      expect(json['id'], 'fl-1');
      expect(json['schedule_id'], 'fs-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['date'], '2026-06-01T00:00:00.000');
      expect(json['amount_given'], 4.5);
      expect(json['skipped'], false);
      expect(json['notes'], 'Өглөө');
      expect(json['updated_at'], isA<String>());
    });

    test('fromSupabaseJson deserializes snake_case', () {
      final supabase = {
        'id': 'fl-1',
        'schedule_id': 'fs-1',
        'horse_id': 'horse-1',
        'date': '2026-06-01T00:00:00.000',
        'amount_given': 5.0,
        'skipped': false,
        'notes': '',
      };
      final log = FeedLog.fromSupabaseJson(supabase);
      expect(log.id, 'fl-1');
      expect(log.scheduleId, 'fs-1');
      expect(log.horseId, 'horse-1');
      expect(log.date, DateTime(2026, 6, 1));
      expect(log.amountGiven, 5.0);
      expect(log.skipped, false);
      expect(log.notes, '');
    });

    // ── toString ─────────────────────────────────────────────

    test('toString includes key fields', () {
      final log = FeedLog(
        id: 'fl-1',
        scheduleId: 'fs-1',
        horseId: 'horse-1',
        date: DateTime(2026, 6, 1),
        amountGiven: 5.0,
        skipped: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = log.toString();
      expect(str, contains('fl-1'));
      expect(str, contains('fs-1'));
    });
  });
}
