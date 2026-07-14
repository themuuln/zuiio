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
  });
}
