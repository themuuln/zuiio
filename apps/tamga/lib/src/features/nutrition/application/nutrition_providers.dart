/// Тэжээлийн модулийн Riverpod providers.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/local_nutrition_repository.dart';
import '../data/nutrition_repository.dart';
import '../domain/feed_schedule.dart';
import '../domain/feed_log.dart';

// ═══════════════════════════════════════════════════════════════════════
// Repository provider
// ═══════════════════════════════════════════════════════════════════════

/// [NutritionRepository] provider (local-first implementation).
final nutritionRepositoryProvider = Provider<NutritionRepository>((ref) {
  return LocalNutritionRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

// ═══════════════════════════════════════════════════════════════════════
// FeedSchedule providers
// ═══════════════════════════════════════════════════════════════════════

/// Морины тэжээлийн хуваарийн future provider.
///
/// [horseId] ашиглан тухайн морины бүх тэжээлийн хуваарийг авна.
final feedSchedulesProvider =
    createListFamilyProvider<FeedSchedule, NutritionRepository, String>(
  (ref) async => ref.watch(nutritionRepositoryProvider),
  (repo, horseId) => repo.fetchSchedules(horseId),
);

// ═══════════════════════════════════════════════════════════════════════
// FeedLog providers
// ═══════════════════════════════════════════════════════════════════════

/// Морины тэжээлийн бүртгэлийн future provider.
///
/// [horseId] ашиглан тухайн морины бүх тэжээлийн бүртгэлийг авна.
final feedLogsProvider =
    createListFamilyProvider<FeedLog, NutritionRepository, String>(
  (ref) async => ref.watch(nutritionRepositoryProvider),
  (repo, horseId) => repo.fetchLogs(horseId),
);

/// Морины тэжээлийн бүртгэлийг огнооны мужаар авах provider.
///
/// [horseId] болон [startDate], [endDate] ашиглан шүүнэ.
final feedLogsByDateRangeProvider = createListFamilyProvider<
  FeedLog,
  NutritionRepository,
  ({String horseId, DateTime startDate, DateTime endDate})
>(
  (ref) async => ref.watch(nutritionRepositoryProvider),
  (repo, params) => repo.fetchLogsByDateRange(
    params.horseId,
    params.startDate,
    params.endDate,
  ),
);
