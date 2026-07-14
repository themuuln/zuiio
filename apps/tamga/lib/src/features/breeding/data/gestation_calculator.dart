/// Gestation calculation utilities for horse breeding management.
///
/// Horse gestation is approximately 340 days (11 months).
/// This calculator provides expected due dates, remaining days,
/// and reminder scheduling for approaching foaling.
class GestationCalculator {
  GestationCalculator._();

  /// Standard horse gestation period in days.
  static const int gestationDays = 340;

  /// Reminder thresholds in days before due date.
  static const List<int> reminderDays = [30, 14, 7];

  // ── Date calculations ──────────────────────────────────────

  /// Calculate the expected due date from breeding date.
  static DateTime expectedDueDate(DateTime breedingDate) {
    return breedingDate.add(const Duration(days: gestationDays));
  }

  /// Calculate days elapsed since breeding.
  static int daysElapsed(DateTime breedingDate) {
    return DateTime.now().difference(breedingDate).inDays;
  }

  /// Calculate days remaining until expected due date.
  /// Returns negative value if overdue.
  static int daysRemaining(DateTime expectedDueDate) {
    return expectedDueDate.difference(DateTime.now()).inDays;
  }

  /// Calculate gestation progress as a fraction (0.0 to 1.0+).
  static double gestationProgress(DateTime breedingDate) {
    final elapsed = daysElapsed(breedingDate);
    return (elapsed / gestationDays).clamp(0.0, 1.5);
  }

  // ── Status checks ──────────────────────────────────────────

  /// Whether the due date has passed.
  static bool isOverdue(DateTime expectedDueDate) {
    return DateTime.now().isAfter(expectedDueDate);
  }

  /// Whether the mare is in the final 30 days of gestation.
  static bool isApproaching(DateTime expectedDueDate) {
    final remaining = daysRemaining(expectedDueDate);
    return remaining <= 30 && remaining > 0;
  }

  /// Whether the gestation period is complete (at or past due date).
  static bool isDue(DateTime expectedDueDate) {
    final remaining = daysRemaining(expectedDueDate);
    return remaining <= 0;
  }

  // ── Reminder scheduling ────────────────────────────────────

  /// Get active reminders for a breeding record.
  ///
  /// Returns a list of reminder configurations that should be shown
  /// based on days remaining until due date.
  static List<GestationReminder> activeReminders(DateTime expectedDueDate) {
    final remaining = daysRemaining(expectedDueDate);
    final reminders = <GestationReminder>[];

    for (final days in reminderDays) {
      if (remaining <= days && remaining > -7) {
        reminders.add(
          GestationReminder(
            daysBeforeDue: days,
            message: _reminderMessage(days, remaining),
            urgency: _reminderUrgency(days, remaining),
          ),
        );
      }
    }

    return reminders;
  }

  /// Check if a specific reminder should be triggered.
  static bool shouldRemind(DateTime expectedDueDate, int daysBeforeDue) {
    final remaining = daysRemaining(expectedDueDate);
    return remaining <= daysBeforeDue && remaining > (daysBeforeDue - 1);
  }

  // ── Helper methods ─────────────────────────────────────────

  static String _reminderMessage(int daysBeforeDue, int remaining) {
    if (remaining <= 0) {
      return 'Төллөх хугацаа дууссан! Болболт шалгана уу.';
    }
    if (remaining <= 7) {
      return 'Төллөхөд $remaining хоног үлдлээ. Бэлтгэлээ шалгана уу.';
    }
    if (remaining <= 14) {
      return 'Төллөхөд $remaining хоног үлдлээ. Эмчтэй зөвлөнө үү.';
    }
    return 'Төллөхөд $remaining хоног үлдлээ. Анхааралтай ажиглана уу.';
  }

  static GestationReminderUrgency _reminderUrgency(
    int daysBeforeDue,
    int remaining,
  ) {
    if (remaining <= 0) return GestationReminderUrgency.critical;
    if (remaining <= 7) return GestationReminderUrgency.high;
    if (remaining <= 14) return GestationReminderUrgency.medium;
    return GestationReminderUrgency.low;
  }

  // ── Formatting ─────────────────────────────────────────────

  /// Format a date for display (YYYY-MM-DD).
  static String formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Format the gestation progress as a percentage string.
  static String progressPercentage(DateTime breedingDate) {
    final progress = gestationProgress(breedingDate);
    return '${(progress * 100).toInt()}%';
  }

  /// Get a human-readable status string.
  static String statusText(DateTime breedingDate, DateTime expectedDueDate) {
    final remaining = daysRemaining(expectedDueDate);
    if (remaining <= 0) return 'Төллөх хугацаа дууссан';
    return 'Төллөхөд $remaining хоног';
  }
}

/// A reminder configuration for approaching foaling.
class GestationReminder {
  const GestationReminder({
    required this.daysBeforeDue,
    required this.message,
    required this.urgency,
  });

  /// How many days before due date this reminder triggers.
  final int daysBeforeDue;

  /// Human-readable reminder message.
  final String message;

  /// Urgency level for visual styling.
  final GestationReminderUrgency urgency;

  /// Whether this reminder should show a notification.
  bool get shouldNotify => urgency.index >= GestationReminderUrgency.high.index;
}

/// Urgency levels for gestation reminders.
enum GestationReminderUrgency {
  /// 30 days before due (informational).
  low,

  /// 14 days before due (preparation).
  medium,

  /// 7 days before due (imminent).
  high,

  /// Overdue (critical).
  critical,
}
