import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/stable/domain/boarding_assignment.dart';

void main() {
  // ── Helpers ────────────────────────────────────────────────────

  BoardingAssignment createAssignment({
    String id = 'board-1',
    String horseName = 'Хан Хүлэг',
    BoardingStatus status = BoardingStatus.active,
    int monthlyFee = 300000,
  }) {
    return BoardingAssignment(
      id: id,
      stableId: 'stable-1',
      horseId: 'horse-1',
      horseName: horseName,
      ownerId: 'member-1',
      ownerName: 'Өөрөө (Та)',
      startedAt: DateTime(2025, 1, 1),
      status: status,
      monthlyFee: monthlyFee,
    );
  }

  // ── Construction ──────────────────────────────────────────────

  group('BoardingAssignment construction', () {
    test('creates with required fields', () {
      final assignment = createAssignment();

      expect(assignment.id, 'board-1');
      expect(assignment.stableId, 'stable-1');
      expect(assignment.horseId, 'horse-1');
      expect(assignment.horseName, 'Хан Хүлэг');
      expect(assignment.ownerName, 'Өөрөө (Та)');
      expect(assignment.status, BoardingStatus.active);
      expect(assignment.monthlyFee, 300000);
    });

    test('defaults endedAt to null and notes to empty', () {
      final assignment = createAssignment();

      expect(assignment.endedAt, isNull);
      expect(assignment.notes, isEmpty);
    });
  });

  // ── statusLabel ───────────────────────────────────────────────

  group('statusLabel', () {
    test('active returns correct label', () {
      final a = createAssignment(status: BoardingStatus.active);
      expect(a.statusLabel, 'Идэвхтэй');
    });

    test('paused returns correct label', () {
      final a = createAssignment(status: BoardingStatus.paused);
      expect(a.statusLabel, 'Түр завсарласан');
    });

    test('ended returns correct label', () {
      final a = createAssignment(status: BoardingStatus.ended);
      expect(a.statusLabel, 'Гарсан');
    });
  });

  // ── copyWith ──────────────────────────────────────────────────

  group('copyWith', () {
    test('remains identical with no arguments', () {
      final a = createAssignment();
      final copy = a.copyWith();

      expect(copy.id, a.id);
      expect(copy.horseName, a.horseName);
      expect(copy.monthlyFee, a.monthlyFee);
    });

    test('overrides specified fields', () {
      final a = createAssignment();
      final copy = a.copyWith(
        status: BoardingStatus.ended,
        endedAt: DateTime(2025, 6, 1),
        monthlyFee: 0,
      );

      expect(copy.status, BoardingStatus.ended);
      expect(copy.endedAt, DateTime(2025, 6, 1));
      expect(copy.monthlyFee, 0);
      expect(copy.horseName, a.horseName); // unchanged
    });

    test('does not mutate original', () {
      final a = createAssignment(status: BoardingStatus.active);
      a.copyWith(status: BoardingStatus.ended);

      expect(a.status, BoardingStatus.active);
    });
  });

  // ── JSON serialization ────────────────────────────────────────

  group('JSON serialization', () {
    test('round-trips with all fields', () {
      final a = createAssignment(
        id: 'board-2',
        horseName: 'Алтан Шуурга',
        status: BoardingStatus.active,
        monthlyFee: 300000,
      );
      final json = a.toJson();
      final restored = BoardingAssignment.fromJson(json);

      expect(restored.id, a.id);
      expect(restored.horseName, a.horseName);
      expect(restored.ownerName, a.ownerName);
      expect(restored.status, a.status);
      expect(restored.monthlyFee, a.monthlyFee);
      expect(restored.startedAt, a.startedAt);
      expect(restored.endedAt, a.endedAt);
      expect(restored.notes, a.notes);
    });

    test('round-trips with endedAt set', () {
      final a = createAssignment(
        status: BoardingStatus.ended,
      ).copyWith(endedAt: DateTime(2025, 6, 1));
      final json = a.toJson();
      final restored = BoardingAssignment.fromJson(json);

      expect(restored.endedAt, DateTime(2025, 6, 1));
      expect(restored.status, BoardingStatus.ended);
    });

    test('handles status default (null)', () {
      final json = {
        'id': 'board-1',
        'stableId': 's1',
        'horseId': 'h1',
        'horseName': 'Test',
        'ownerId': 'm1',
        'ownerName': 'Owner',
        'startedAt': '2025-01-01T00:00:00.000',
      };
      final restored = BoardingAssignment.fromJson(json);

      expect(restored.status, BoardingStatus.active);
      expect(restored.monthlyFee, 0);
      expect(restored.notes, '');
    });

    test('handles monthlyFee as null in JSON', () {
      final json = {
        'id': 'board-1',
        'stableId': 's1',
        'horseId': 'h1',
        'horseName': 'Test',
        'ownerId': 'm1',
        'ownerName': 'Owner',
        'startedAt': '2025-01-01T00:00:00.000',
        'status': 'active',
        'monthlyFee': null,
      };
      final restored = BoardingAssignment.fromJson(json);

      expect(restored.monthlyFee, 0);
    });
  });
}
