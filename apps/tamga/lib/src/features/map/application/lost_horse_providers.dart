import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../domain/lost_horse_report.dart';
import 'expiry_service.dart';
import 'map_providers.dart';

/// All active lost horse reports (one-shot).
final activeLostHorsesProvider = FutureProvider<List<LostHorseReport>>((
  ref,
) async {
  final repo = ref.watch(mapRepositoryProvider);
  final result = await repo.getActiveLostHorses();
  final reports = <LostHorseReport>[];
  result.when(onSuccess: (v) => reports.addAll(v), onFailure: (e) => throw e);
  return reports;
});

/// Real-time stream of active lost horse reports.
final activeLostHorsesStreamProvider = StreamProvider<List<LostHorseReport>>((
  ref,
) {
  final repo = ref.watch(mapRepositoryProvider);
  return repo.watchActiveLostHorses();
});

/// Current user's lost horse reports.
final myLostReportsProvider = FutureProvider<List<LostHorseReport>>((
  ref,
) async {
  final repo = ref.watch(mapRepositoryProvider);
  final userId = currentSupabaseUserId();
  if (userId == null) return <LostHorseReport>[];
  final result = await repo.getMyLostReports(userId);
  final reports = <LostHorseReport>[];
  result.when(onSuccess: (v) => reports.addAll(v), onFailure: (e) => throw e);
  return reports;
});

/// Report a new lost horse.
final reportLostHorseProvider =
    FutureProvider.family<LostHorseReport, LostHorseReport>((
      ref,
      report,
    ) async {
      final repo = ref.read(mapRepositoryProvider);
      final result = await repo.reportLostHorse(report);
      LostHorseReport? saved;
      result.when(
        onSuccess: (v) {
          saved = v;
          ref.invalidate(activeLostHorsesProvider);
          ref.invalidate(myLostReportsProvider);
        },
        onFailure: (e) => throw e,
      );
      return saved!;
    });

/// Update lost horse status (found/cancelled/expired).
final updateLostHorseStatusProvider =
    FutureProvider.family<void, Map<String, String>>((ref, params) async {
      final repo = ref.read(mapRepositoryProvider);
      final result = await repo.updateLostHorseStatus(
        params['id']!,
        params['status']!,
      );
      result.when(
        onSuccess: (_) {
          ref.invalidate(activeLostHorsesProvider);
          ref.invalidate(myLostReportsProvider);
        },
        onFailure: (e) => throw e,
      );
    });

/// Renew a lost horse report, extending its expiry by the tier duration.
final renewLostHorseReportProvider =
    FutureProvider.family<LostHorseReport, LostHorseReport>((
      ref,
      report,
    ) async {
      final service = ref.read(expiryServiceProvider);
      final result = await service.renewReport(report);
      LostHorseReport? renewed;
      result.when(
        onSuccess: (v) {
          renewed = v;
          ref.invalidate(activeLostHorsesProvider);
          ref.invalidate(myLostReportsProvider);
        },
        onFailure: (e) => throw e,
      );
      return renewed!;
    });

/// Check and expire any overdue paid reports (run on app startup / screen load).
final checkAndExpireReportsProvider = FutureProvider<void>((ref) async {
  final service = ref.read(expiryServiceProvider);
  final result = await service.checkAndExpireAll();
  if (result.isFailure) {
    throw result.error;
  }
  ref.invalidate(activeLostHorsesProvider);
});
