/// A concrete care action that should be visible to the owner.
class CareTask {
  const CareTask({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.dueAt,
    required this.kind,
    this.horseId,
    this.horseName,
  });

  /// Stable identifier from the source record and task type.
  final String id;

  /// Primary action label shown in the care list.
  final String title;

  /// Supporting context shown below the action label.
  final String subtitle;

  /// The horse associated with this task, when applicable.
  final String? horseId;

  /// The horse name shown in the task row, when applicable.
  final String? horseName;

  /// When the action is due.
  final DateTime dueAt;

  /// The source area that owns the action.
  final CareTaskKind kind;

  /// Whether the due date has passed.
  bool isOverdueAt(DateTime now) => dueAt.isBefore(now);
}

/// Product area represented by a care task.
enum CareTaskKind { vaccination, deworming, breeding, event }
