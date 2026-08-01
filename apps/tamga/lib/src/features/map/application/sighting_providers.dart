import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sighting_repository.dart';
import '../data/supabase_sighting_repository.dart';
import '../domain/sighting_report.dart';
import 'map_providers.dart';

/// Provider for the sighting repository.
final sightingRepositoryProvider = Provider<SightingRepository>((ref) {
  return SupabaseSightingRepository();
});

/// Get sightings for a specific lost horse report.
final sightingsForReportProvider =
    FutureProvider.family<List<SightingReport>, String>((ref, reportId) async {
      final repo = ref.watch(sightingRepositoryProvider);
      final result = await repo.getSightingsForReport(reportId);
      final sightings = <SightingReport>[];
      result.when(
        onSuccess: (v) => sightings.addAll(v),
        onFailure: (e) => throw e,
      );
      return sightings;
    });

/// Real-time stream of sightings for a report.
final sightingsStreamProvider =
    StreamProvider.family<List<SightingReport>, String>((ref, reportId) {
      final repo = ref.watch(sightingRepositoryProvider);
      return repo.watchSightingsForReport(reportId);
    });

/// Report a new sighting.
final reportSightingProvider =
    FutureProvider.family<SightingReport, SightingReport>((
      ref,
      sighting,
    ) async {
      final repo = ref.watch(lostHorseRepositoryProvider);
      final result = await repo.createSighting(sighting);
      return result.getOrThrow();
    });

/// Update sighting status (confirm/dismiss).
final updateSightingStatusProvider =
    FutureProvider.family<void, Map<String, String>>((ref, params) async {
      final status = SightingStatus.values.firstWhere(
        (value) => value.name == params['status'],
        orElse: () => SightingStatus.dismissed,
      );
      await ref
          .watch(lostHorseRepositoryProvider)
          .reviewSighting(sightingId: params['id']!, status: status)
          .then((result) => result.getOrThrow());
    });

/// Delete a sighting.
final deleteSightingProvider = FutureProvider.family<void, String>((
  ref,
  sightingId,
) async {
  final repo = ref.watch(sightingRepositoryProvider);
  final result = await repo.deleteSighting(sightingId);
  result.when(onSuccess: (_) {}, onFailure: (e) => throw e);
});
