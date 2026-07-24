import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/training/domain/performance_record.dart';

void main() {
  // ═══════════════════════════════════════════════════════════════════
  // MetricType enum
  // ═══════════════════════════════════════════════════════════════════
  group('MetricType', () {
    test('has exactly 4 values', () {
      expect(MetricType.values, hasLength(4));
      expect(MetricType.values, contains(MetricType.speed));
      expect(MetricType.values, contains(MetricType.endurance));
      expect(MetricType.values, contains(MetricType.weight));
      expect(MetricType.values, contains(MetricType.condition));
    });

    test('displayName returns Mongolian labels', () {
      expect(MetricType.speed.displayName, 'Хурд');
      expect(MetricType.endurance.displayName, 'Тэвчээр');
      expect(MetricType.weight.displayName, 'Жин');
      expect(MetricType.condition.displayName, 'Биеийн байдал');
    });

    test('displayName is non-empty for all values', () {
      for (final metric in MetricType.values) {
        expect(metric.displayName.isNotEmpty, isTrue,
            reason: '${metric.name} should have a non-empty displayName');
      }
    });

    test('name matches expected serialized value', () {
      expect(MetricType.speed.name, 'speed');
      expect(MetricType.endurance.name, 'endurance');
      expect(MetricType.weight.name, 'weight');
      expect(MetricType.condition.name, 'condition');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PerformanceRecord model
  // ═══════════════════════════════════════════════════════════════════
  group('PerformanceRecord', () {
    // ── Constructor ──────────────────────────────────────────

    test('constructor assigns all required fields', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(record.id, 'pr-1');
      expect(record.horseId, 'horse-1');
      expect(record.metric, MetricType.speed);
      expect(record.value, 45.0);
    });

    test('constructor assigns optional fields', () {
      final record = PerformanceRecord(
        id: 'pr-2',
        horseId: 'horse-2',
        metric: MetricType.weight,
        value: 350.0,
        unit: 'кг',
        notes: 'Жин хэмжилт',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(record.unit, 'кг');
      expect(record.notes, 'Жин хэмжилт');
    });

    test('optional fields default to null/empty', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.condition,
        value: 8.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(record.unit, isNull);
      expect(record.notes, '');
    });

    // ── copyWith ─────────────────────────────────────────────

    test('copyWith updates specified fields', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = record.copyWith(
        value: 50.0,
        notes: 'Updated',
        unit: 'км/ц',
      );
      expect(updated.id, 'pr-1');
      expect(updated.value, 50.0);
      expect(updated.notes, 'Updated');
      expect(updated.unit, 'км/ц');
      expect(updated.metric, MetricType.speed);
    });

    test('copyWith with no args preserves all fields', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.endurance,
        value: 80.0,
        unit: 'мин',
        notes: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final same = record.copyWith();
      expect(same.id, record.id);
      expect(same.horseId, record.horseId);
      expect(same.metric, record.metric);
      expect(same.value, record.value);
      expect(same.unit, record.unit);
      expect(same.notes, record.notes);
    });

    test('copyWith sets nullable fields to null', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.weight,
        value: 350.0,
        unit: 'кг',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final updated = record.copyWith(unit: null);
      expect(updated.unit, isNull);
    });

    // ── Equality ─────────────────────────────────────────────

    test('equality — identical records are equal', () {
      final a = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a, b);
    });

    test('equality — different id makes records not equal', () {
      final a = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = PerformanceRecord(
        id: 'pr-2',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    test('equality — different value makes records not equal', () {
      final a = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final b = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 50.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      expect(a == b, false);
    });

    // ── Serialization — Local JSON ───────────────────────────

    test('toJson serializes all fields', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.weight,
        value: 350.0,
        unit: 'кг',
        notes: 'Жин хэмжилт',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = record.toJson();

      expect(json['id'], 'pr-1');
      expect(json['horseId'], 'horse-1');
      expect(json['metric'], 'weight');
      expect(json['value'], 350.0);
      expect(json['unit'], 'кг');
      expect(json['notes'], 'Жин хэмжилт');
    });

    test('fromJson deserializes correctly', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        unit: 'км/ц',
        notes: 'Хурд',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = record.toJson();
      final restored = PerformanceRecord.fromJson(json);

      expect(restored.id, record.id);
      expect(restored.horseId, record.horseId);
      expect(restored.metric, record.metric);
      expect(restored.value, record.value);
      expect(restored.unit, record.unit);
      expect(restored.notes, record.notes);
    });

    test('fromJson handles null optional fields', () {
      final json = {
        'id': 'pr-1',
        'horseId': 'horse-1',
        'metric': 'condition',
        'value': 8.0,
        'createdAt': '2026-01-01T00:00:00.000',
        'updatedAt': '2026-01-01T00:00:00.000',
      };
      final record = PerformanceRecord.fromJson(json);
      expect(record.unit, isNull);
      expect(record.notes, '');
      expect(record.metric, MetricType.condition);
    });

    test('toJson includes null optional fields as null', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.condition,
        value: 8.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = record.toJson();
      expect(json['unit'], isNull);
    });

    // ── Serialization — Supabase JSON ────────────────────────

    test('toSupabaseJson uses snake_case keys and includes ownerId/updated_at', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        unit: 'км/ц',
        notes: 'Хурд хэмжилт',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final json = record.toSupabaseJson(ownerId: 'user-1');

      expect(json['owner_id'], 'user-1');
      expect(json['id'], 'pr-1');
      expect(json['horse_id'], 'horse-1');
      expect(json['metric'], 'speed');
      expect(json['value'], 45.0);
      expect(json['unit'], 'км/ц');
      expect(json['notes'], 'Хурд хэмжилт');
      expect(json['updated_at'], isA<String>());
    });

    test('fromSupabaseJson deserializes snake_case', () {
      final supabase = {
        'id': 'pr-1',
        'horse_id': 'horse-1',
        'metric': 'speed',
        'value': 45.0,
        'unit': null,
        'notes': 'Test',
      };
      final record = PerformanceRecord.fromSupabaseJson(supabase);
      expect(record.id, 'pr-1');
      expect(record.horseId, 'horse-1');
      expect(record.metric, MetricType.speed);
      expect(record.value, 45.0);
      expect(record.unit, isNull);
      expect(record.notes, 'Test');
    });

    // ── toString ─────────────────────────────────────────────

    test('toString includes key fields', () {
      final record = PerformanceRecord(
        id: 'pr-1',
        horseId: 'horse-1',
        metric: MetricType.speed,
        value: 45.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final str = record.toString();
      expect(str, contains('pr-1'));
      expect(str, contains('speed'));
    });
  });
}
