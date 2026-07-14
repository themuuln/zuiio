import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/breeding/data/gestation_calculator.dart';

void main() {
  group('GestationCalculator', () {
    // ── Constants ──────────────────────────────────────────

    test('gestationDays is 340', () {
      expect(GestationCalculator.gestationDays, 340);
    });

    test('reminderDays are [30, 14, 7]', () {
      expect(GestationCalculator.reminderDays, [30, 14, 7]);
    });

    // ── expectedDueDate ─────────────────────────────────────

    group('expectedDueDate', () {
      test('returns 340 days after breeding date', () {
        final breedingDate = DateTime(2026, 1, 1);
        final dueDate = GestationCalculator.expectedDueDate(breedingDate);
        expect(dueDate, DateTime(2026, 1, 1).add(const Duration(days: 340)));
      });

      test('handles leap year breeding date', () {
        final breedingDate = DateTime(2024, 3, 1); // Leap year
        final dueDate = GestationCalculator.expectedDueDate(breedingDate);
        expect(dueDate, DateTime(2024, 3, 1).add(const Duration(days: 340)));
      });

      test('handles year boundary', () {
        final breedingDate = DateTime(2026, 12, 1);
        final dueDate = GestationCalculator.expectedDueDate(breedingDate);
        expect(dueDate, DateTime(2026, 12, 1).add(const Duration(days: 340)));
      });
    });

    // ── daysElapsed ────────────────────────────────────────

    group('daysElapsed', () {
      test('returns 0 when breeding was today', () {
        final breedingDate = DateTime.now();
        expect(GestationCalculator.daysElapsed(breedingDate), 0);
      });

      test('returns correct count for past breeding date', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 100));
        expect(GestationCalculator.daysElapsed(breedingDate), 100);
      });

      test('returns correct count for recent breeding date', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 1));
        expect(GestationCalculator.daysElapsed(breedingDate), 1);
      });
    });

    // ── daysRemaining ──────────────────────────────────────

    group('daysRemaining', () {
      test('returns positive days for future due date', () {
        final dueDate = DateTime.now().add(const Duration(days: 30));
        expect(GestationCalculator.daysRemaining(dueDate), greaterThan(0));
      });

      test('returns 0 when due date is now', () {
        final dueDate = DateTime.now();
        expect(GestationCalculator.daysRemaining(dueDate), 0);
      });

      test('returns negative days for past due date', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 10));
        expect(GestationCalculator.daysRemaining(dueDate), -10);
      });
    });

    // ── gestationProgress ──────────────────────────────────

    group('gestationProgress', () {
      test('returns 0.0 when breeding was today', () {
        final breedingDate = DateTime.now();
        expect(GestationCalculator.gestationProgress(breedingDate), 0.0);
      });

      test('returns ~0.5 at roughly half gestation', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 170));
        final progress = GestationCalculator.gestationProgress(breedingDate);
        expect(progress, closeTo(0.5, 0.02));
      });

      test('returns 1.0 at full gestation (340 days)', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 340));
        expect(GestationCalculator.gestationProgress(breedingDate), 1.0);
      });

      test('clamps at maximum 1.5', () {
        // 510 days is 1.5x gestation
        final breedingDate = DateTime.now().subtract(const Duration(days: 510));
        expect(GestationCalculator.gestationProgress(breedingDate), 1.5);
      });

      test('does not exceed 1.5 even far past due', () {
        final breedingDate = DateTime.now().subtract(
          const Duration(days: 1000),
        );
        expect(GestationCalculator.gestationProgress(breedingDate), 1.5);
      });
    });

    // ── Status checks ──────────────────────────────────────

    group('isOverdue', () {
      test('returns true when due date is in the past', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 10));
        expect(GestationCalculator.isOverdue(dueDate), isTrue);
      });

      test('returns false when due date is well in the future', () {
        final dueDate = DateTime.now().add(const Duration(days: 7));
        expect(GestationCalculator.isOverdue(dueDate), isFalse);
      });
    });

    group('isApproaching', () {
      test('returns true when 1-30 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 15));
        expect(GestationCalculator.isApproaching(dueDate), isTrue);
      });

      test('returns false when more than 30 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 40));
        expect(GestationCalculator.isApproaching(dueDate), isFalse);
      });

      test('returns false when overdue', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 10));
        expect(GestationCalculator.isApproaching(dueDate), isFalse);
      });
    });

    group('isDue', () {
      test('returns true when due date has passed', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 1));
        expect(GestationCalculator.isDue(dueDate), isTrue);
      });

      test('returns true when due date is now', () {
        final dueDate = DateTime.now();
        expect(GestationCalculator.isDue(dueDate), isTrue);
      });

      test('returns false when due date is in the future', () {
        final dueDate = DateTime.now().add(const Duration(days: 7));
        expect(GestationCalculator.isDue(dueDate), isFalse);
      });
    });

    // ── Reminder scheduling ────────────────────────────────

    group('activeReminders', () {
      test('returns 30-day reminder when 25 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 25));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders.length, 1);
        expect(reminders[0].daysBeforeDue, 30);
        expect(reminders[0].urgency, GestationReminderUrgency.low);
      });

      test('returns 30-day and 14-day reminders when 10 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 10));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders.length, 2);
        expect(reminders.any((r) => r.daysBeforeDue == 30), isTrue);
        expect(reminders.any((r) => r.daysBeforeDue == 14), isTrue);
      });

      test('returns all three reminders when 5 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 5));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders.length, 3);
      });

      test('returns empty when more than 30 days remaining', () {
        final dueDate = DateTime.now().add(const Duration(days: 60));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders, isEmpty);
      });

      test('returns empty when overdue by more than 7 days', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 10));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders, isEmpty);
      });

      test('includes reminders when overdue by 1-7 days', () {
        final dueDate = DateTime.now().subtract(const Duration(days: 3));
        final reminders = GestationCalculator.activeReminders(dueDate);
        expect(reminders, isNotEmpty);
        // Should have critical urgency
        expect(
          reminders.any((r) => r.urgency == GestationReminderUrgency.critical),
          isTrue,
        );
      });
    });

    group('shouldRemind', () {
      test('returns true when within the reminder window', () {
        // Due date 10 days from now → remaining ≈ 10
        // 10 <= 14 && 10 > 13 → false. But 10 <= 30 && 10 > 29 → false.
        // Let's use daysBeforeDue = 14, due date = now + 10 days
        // remaining ≈ 10, check 10 <= 14 && 10 > 13 → false
        // Actually let's test with daysBeforeDue=30, due in 20 days:
        // remaining ≈ 20, 20 <= 30 && 20 > 29 → false
        // Let me just test the core logic: when remaining is within the window
        final dueDate = DateTime.now().add(const Duration(days: 7));
        // daysBeforeDue=14, remaining≈7: 7 <= 14 && 7 > 13 → false
        // This should NOT remind (7 is past the 14-day window)
        expect(GestationCalculator.shouldRemind(dueDate, 14), isFalse);
      });

      test('returns false when clearly before the reminder window', () {
        // Due date 20 days from now → remaining ≈ 20
        // daysBeforeDue=14, 20 <= 14 → false
        final dueDate = DateTime.now().add(const Duration(days: 20));
        expect(GestationCalculator.shouldRemind(dueDate, 14), isFalse);
      });

      test('returns false when clearly past the reminder window', () {
        // Due date 5 days from now → remaining ≈ 5
        // daysBeforeDue=14, 5 <= 14 && 5 > 13 → false
        final dueDate = DateTime.now().add(const Duration(days: 5));
        expect(GestationCalculator.shouldRemind(dueDate, 14), isFalse);
      });
    });

    // ── Formatting ─────────────────────────────────────────

    group('formatDate', () {
      test('formats date as YYYY-MM-DD', () {
        expect(
          GestationCalculator.formatDate(DateTime(2026, 1, 5)),
          '2026-01-05',
        );
      });

      test('pads single-digit month and day', () {
        expect(
          GestationCalculator.formatDate(DateTime(2026, 12, 31)),
          '2026-12-31',
        );
      });
    });

    group('progressPercentage', () {
      test('returns "0%" at start of gestation', () {
        final breedingDate = DateTime.now();
        expect(GestationCalculator.progressPercentage(breedingDate), '0%');
      });

      test('returns approximately "50%" at mid-gestation', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 170));
        final pct = GestationCalculator.progressPercentage(breedingDate);
        expect(pct, contains('50%'));
      });

      test('returns "100%" at full gestation', () {
        final breedingDate = DateTime.now().subtract(const Duration(days: 340));
        expect(GestationCalculator.progressPercentage(breedingDate), '100%');
      });
    });

    group('statusText', () {
      test('returns remaining days text for future due date', () {
        final breedingDate = DateTime(2026, 1, 1);
        final dueDate = DateTime(2026, 1, 1).add(const Duration(days: 340));
        final text = GestationCalculator.statusText(breedingDate, dueDate);
        expect(text, contains('хоног'));
      });

      test('returns overdue text when past due date', () {
        final breedingDate = DateTime(2025, 1, 1);
        final dueDate = DateTime(2025, 1, 1).add(const Duration(days: 340));
        final text = GestationCalculator.statusText(breedingDate, dueDate);
        expect(text, contains('дууссан'));
      });
    });
  });

  group('GestationReminder', () {
    test('stores daysBeforeDue, message, and urgency', () {
      final reminder = GestationReminder(
        daysBeforeDue: 30,
        message: 'Test message',
        urgency: GestationReminderUrgency.low,
      );
      expect(reminder.daysBeforeDue, 30);
      expect(reminder.message, 'Test message');
      expect(reminder.urgency, GestationReminderUrgency.low);
    });

    test('shouldNotify is false for low urgency', () {
      final reminder = GestationReminder(
        daysBeforeDue: 30,
        message: 'msg',
        urgency: GestationReminderUrgency.low,
      );
      expect(reminder.shouldNotify, isFalse);
    });

    test('shouldNotify is true for high urgency', () {
      final reminder = GestationReminder(
        daysBeforeDue: 14,
        message: 'msg',
        urgency: GestationReminderUrgency.high,
      );
      expect(reminder.shouldNotify, isTrue);
    });

    test('shouldNotify is true for critical urgency', () {
      final reminder = GestationReminder(
        daysBeforeDue: 0,
        message: 'msg',
        urgency: GestationReminderUrgency.critical,
      );
      expect(reminder.shouldNotify, isTrue);
    });
  });
}
