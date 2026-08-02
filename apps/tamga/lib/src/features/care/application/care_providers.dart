import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../breeding/application/breeding_providers.dart';
import '../../breeding/domain/breeding_record.dart';
import '../../events/application/events_providers.dart';
import '../../health/application/health_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../../shared/domain/event.dart';
import '../../../shared/domain/health_log.dart';
import '../domain/care_task.dart';

/// Aggregated data used by the home and care surfaces.
class CareOverview {
  const CareOverview({
    required this.tasks,
    required this.upcomingEvents,
    required this.monitoredHorseIds,
    required this.attentionHorseIds,
    required this.healthLogCount,
  });

  /// Actions due now or soon.
  final List<CareTask> tasks;

  /// Events with a known date that are coming up.
  final List<Event> upcomingEvents;

  /// Horses that have at least one recorded care action.
  final Set<String> monitoredHorseIds;

  /// Horses with at least one overdue or soon-due action.
  final Set<String> attentionHorseIds;

  /// Total health records, used to explain an empty care state.
  final int healthLogCount;

  /// Number of tasks that are already overdue.
  int get overdueCount =>
      tasks.where((task) => task.isOverdueAt(DateTime.now())).length;

  /// Number of tasks that are due soon but not overdue.
  int get dueSoonCount => tasks.length - overdueCount;
}

/// Loads the data required for the daily command center in parallel.
final careOverviewProvider = FutureProvider<CareOverview>((ref) async {
  final values = await Future.wait<Object>([
    ref.watch(horsesProvider.future),
    ref.watch(healthLogsProvider.future),
    ref.watch(eventsProvider.future),
    ref.watch(breedingRecordsProvider.future),
  ]);

  return buildCareOverview(
    horses: values[0] as List<HorseRecord>,
    healthLogs: values[1] as List<HealthLog>,
    events: values[2] as List<Event>,
    breedingRecords: values[3] as List<BreedingRecord>,
  );
});

/// Converts existing horse records into a compact, actionable daily view.
///
/// This deliberately only creates tasks from records with a known date. A
/// missing care record is shown as an onboarding opportunity, not as a false
/// overdue alert.
CareOverview buildCareOverview({
  required List<HorseRecord> horses,
  required List<HealthLog> healthLogs,
  required List<Event> events,
  required List<BreedingRecord> breedingRecords,
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();
  final horseNames = <String, String>{
    for (final horse in horses) horse.id: horse.name,
  };
  final tasks = <CareTask>[];
  final monitoredHorseIds = healthLogs.map((log) => log.horseId).toSet();
  final latestLogs = <({String horseId, LogType logType}), HealthLog>{};

  for (final log in healthLogs) {
    final key = (horseId: log.horseId, logType: log.logType);
    final previous = latestLogs[key];
    if (previous == null || _logDate(log).isAfter(_logDate(previous))) {
      latestLogs[key] = log;
    }
  }

  for (final entry in latestLogs.entries) {
    final intervalDays = switch (entry.key.logType) {
      LogType.vaccination => 365,
      LogType.deworming => 90,
      _ => null,
    };
    if (intervalDays == null) continue;

    final dueAt = _logDate(entry.value).add(Duration(days: intervalDays));
    if (dueAt.isAfter(reference.add(const Duration(days: 7)))) continue;

    final overdue = dueAt.isBefore(reference);
    tasks.add(
      CareTask(
        id: '${entry.key.horseId}:${entry.key.logType.name}',
        title: entry.key.logType.displayName,
        subtitle: overdue ? 'Хугацаа хэтэрсэн' : '7 хоногийн дотор',
        horseId: entry.key.horseId,
        horseName: horseNames[entry.key.horseId] ?? 'Морь',
        dueAt: dueAt,
        kind: entry.key.logType == LogType.vaccination
            ? CareTaskKind.vaccination
            : CareTaskKind.deworming,
      ),
    );
  }

  for (final record in breedingRecords) {
    if (record.status != 'Хээлтсэн' || record.actualFoalingDate != null) {
      continue;
    }
    final dueAt = record.expectedFoalingDate;
    if (dueAt.isAfter(reference.add(const Duration(days: 30)))) continue;

    tasks.add(
      CareTask(
        id: 'breeding:${record.id}',
        title: 'Төллөх хугацаа',
        subtitle: record.isOverdue ? 'Хугацаа хэтэрсэн' : record.damName,
        horseId: record.damId,
        horseName: record.damName,
        dueAt: dueAt,
        kind: CareTaskKind.breeding,
      ),
    );
  }

  final upcomingEvents =
      events
          .where(
            (event) =>
                event.date != null &&
                !event.date!.isBefore(reference) &&
                event.date!.isBefore(reference.add(const Duration(days: 30))),
          )
          .toList()
        ..sort((a, b) => a.date!.compareTo(b.date!));

  for (final event in upcomingEvents.take(3)) {
    tasks.add(
      CareTask(
        id: 'event:${event.id}',
        title: event.title,
        subtitle: event.location ?? event.eventType.displayName,
        horseId: event.horseId.isEmpty ? null : event.horseId,
        horseName: event.horseName,
        dueAt: event.date!,
        kind: CareTaskKind.event,
      ),
    );
  }

  tasks.sort((a, b) => a.dueAt.compareTo(b.dueAt));
  final attentionHorseIds = tasks
      .where((task) => task.kind != CareTaskKind.event && task.horseId != null)
      .map((task) => task.horseId!)
      .toSet();

  return CareOverview(
    tasks: tasks,
    upcomingEvents: upcomingEvents,
    monitoredHorseIds: monitoredHorseIds,
    attentionHorseIds: attentionHorseIds,
    healthLogCount: healthLogs.length,
  );
}

DateTime _logDate(HealthLog log) => log.date ?? log.updatedAt;
