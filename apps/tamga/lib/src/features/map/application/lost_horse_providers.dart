import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/lost_horse_report.dart';
import '../domain/map_enums.dart';
import 'map_providers.dart';

/// All active lost horse reports (one-shot).
final activeLostHorsesProvider = FutureProvider<List<LostHorseReport>>((
  ref,
) async {
  final repo = ref.watch(lostHorseRepositoryProvider);
  final result = await repo.browseActiveReports();
  return result.getOrThrow();
});

/// Refresh-on-subscribe stream of active recovery reports.
final activeLostHorsesStreamProvider = StreamProvider<List<LostHorseReport>>((
  ref,
) {
  final repo = ref.watch(lostHorseRepositoryProvider);
  return Stream.fromFuture(
    repo.browseActiveReports().then((result) => result.getOrThrow()),
  );
});

/// Ids of recovery reports that still have a pending local sync item
/// (upload, publish, or resolution not yet acknowledged by the server).
final pendingRecoverySyncProvider = FutureProvider<Set<String>>((ref) async {
  final items = await IsarStorage.instance.syncQueueItems.where().findAll();
  const recoveryTypes = {
    'lost_horse_report',
    'lost_horse_publish',
    'lost_horse_resolution',
    'lost_horse_sighting',
  };
  return items
      .where((item) => recoveryTypes.contains(item.entityType))
      .map((item) => item.entityId)
      .toSet();
});

/// Current user's lost horse reports.
final myLostReportsProvider = FutureProvider<List<LostHorseReport>>((
  ref,
) async {
  final repo = ref.watch(lostHorseRepositoryProvider);
  final userId = currentSupabaseUserId();
  if (userId == null) return <LostHorseReport>[];
  return (await repo.getMyReports(userId)).getOrThrow();
});

/// Report a new lost horse.
final reportLostHorseProvider =
    FutureProvider.family<LostHorseReport, LostHorseReport>((
      ref,
      report,
    ) async {
      final result = await ref
          .read(lostHorseRepositoryProvider)
          .createReport(report);
      final saved = result.getOrThrow();
      ref.invalidate(activeLostHorsesProvider);
      ref.invalidate(myLostReportsProvider);
      return saved;
    });

/// Update a recovery report through the typed owner resolution flow.
final updateLostHorseStatusProvider =
    FutureProvider.family<void, Map<String, String>>((ref, params) async {
      final status = params['status'];
      final resolution = status == LostHorseStatus.found.name
          ? LostHorseResolutionType.reunited
          : LostHorseResolutionType.withdrawn;
      await ref
          .read(lostHorseRepositoryProvider)
          .resolveReport(reportId: params['id']!, resolutionType: resolution)
          .then((result) => result.getOrThrow());
      ref.invalidate(activeLostHorsesProvider);
      ref.invalidate(myLostReportsProvider);
    });
