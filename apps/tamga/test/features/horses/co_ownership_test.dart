import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/horses/domain/co_ownership.dart';

void main() {
  group('CoOwnershipRecord', () {
    test('creates record with required fields', () {
      final record = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: ['read', 'write_events'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(record.id, 'test-id');
      expect(record.horseId, 'horse-1');
      expect(record.coOwnerName, 'Test Owner');
      expect(record.phone, '99123456');
      expect(record.role, 'Туслах уяач');
      expect(record.permissions, ['read', 'write_events']);
    });

    test('creates record with empty permissions', () {
      final record = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(record.permissions, isEmpty);
    });

    test('record with different roles', () {
      final coachRecord = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Coach',
        phone: '99123456',
        role: 'Ахлах уяач',
        permissions: ['read', 'write_events', 'write_health'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final assistantRecord = CoOwnershipRecord(
        id: 'test-id-2',
        horseId: 'horse-1',
        coOwnerName: 'Assistant',
        phone: '88997766',
        role: 'Туслах уяач',
        permissions: ['read'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(coachRecord.role, 'Ахлах уяач');
      expect(coachRecord.permissions.length, 3);
      expect(assistantRecord.role, 'Туслах уяач');
      expect(assistantRecord.permissions.length, 1);
    });

    test('copyWith creates new record with updated fields', () {
      final original = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: ['read'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final updated = original.copyWith(
        coOwnerName: 'Updated Owner',
        permissions: ['read', 'write_events'],
      );

      expect(updated.id, 'test-id');
      expect(updated.coOwnerName, 'Updated Owner');
      expect(updated.permissions, ['read', 'write_events']);
      expect(original.coOwnerName, 'Test Owner');
    });

    test('copyWith updates remaining fields independently', () {
      final original = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: ['read'],
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 2),
      );

      final updated = original.copyWith(
        horseId: 'horse-2',
        phone: '88990011',
        role: 'Эзэмшигч',
        updatedAt: DateTime(2026, 2, 1),
      );

      expect(updated.horseId, 'horse-2');
      expect(updated.phone, '88990011');
      expect(updated.role, 'Эзэмшигч');
      expect(updated.updatedAt, DateTime(2026, 2, 1));
      expect(updated.id, original.id);
      expect(updated.coOwnerName, original.coOwnerName);
      expect(updated.permissions, original.permissions);
      expect(updated.createdAt, original.createdAt);
    });
  });

  group('CoOwnershipRecord serialization', () {
    test('toJson includes all fields', () {
      final record = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: ['read', 'write_events'],
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 2),
      );

      final json = record.toJson();

      expect(json['id'], 'test-id');
      expect(json['horseId'], 'horse-1');
      expect(json['coOwnerName'], 'Test Owner');
      expect(json['phone'], '99123456');
      expect(json['role'], 'Туслах уяач');
      expect(json['permissions'], ['read', 'write_events']);
      expect(json['createdAt'], DateTime(2026, 1, 1).toIso8601String());
      expect(json['updatedAt'], DateTime(2026, 1, 2).toIso8601String());
    });

    test('fromJson restores every field (roundtrip)', () {
      final original = CoOwnershipRecord(
        id: 'test-id',
        horseId: 'horse-1',
        coOwnerName: 'Test Owner',
        phone: '99123456',
        role: 'Туслах уяач',
        permissions: ['read', 'write_events'],
        createdAt: DateTime(2026, 1, 1),
        updatedAt: DateTime(2026, 1, 2),
      );

      final restored = CoOwnershipRecord.fromJson(original.toJson());

      expect(restored.id, original.id);
      expect(restored.horseId, original.horseId);
      expect(restored.coOwnerName, original.coOwnerName);
      expect(restored.phone, original.phone);
      expect(restored.role, original.role);
      expect(restored.permissions, original.permissions);
      expect(restored.createdAt, original.createdAt);
      expect(restored.updatedAt, original.updatedAt);
    });
  });
}
