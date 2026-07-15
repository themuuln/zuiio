/// Дасгалжуулалт ба гүйцэтгэлийн Riverpod providers.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/local_training_repository.dart';
import '../data/training_repository.dart';
import '../domain/training_log.dart';
import '../domain/performance_record.dart';

// ═══════════════════════════════════════════════════════════════════════
// Repository provider
// ═══════════════════════════════════════════════════════════════════════

/// [TrainingRepository] provider (local-first implementation).
final trainingRepositoryProvider = Provider<TrainingRepository>((ref) {
  return LocalTrainingRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

// ═══════════════════════════════════════════════════════════════════════
// TrainingLog providers
// ═══════════════════════════════════════════════════════════════════════

/// Морины дасгалжуулалтын бүртгэлийн future provider.
///
/// [horseId] ашиглан тухайн морины бүх дасгалжуулалтыг авна.
final trainingLogsProvider =
    createListFamilyProvider<TrainingLog, TrainingRepository, String>(
      (ref) async => ref.watch(trainingRepositoryProvider),
      (repo, horseId) => repo.fetchByHorse(horseId),
    );

// ═══════════════════════════════════════════════════════════════════════
// PerformanceRecord providers
// ═══════════════════════════════════════════════════════════════════════

/// Морины гүйцэтгэлийн үзүүлэлтүүдийн future provider.
///
/// [horseId] ашиглан тухайн морины бүх гүйцэтгэлийн үзүүлэлтийг авна.
final performanceRecordsProvider =
    createListFamilyProvider<PerformanceRecord, TrainingRepository, String>(
      (ref) async => ref.watch(trainingRepositoryProvider),
      (repo, horseId) => repo.fetchPerformanceByHorse(horseId),
    );
