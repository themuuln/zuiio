import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../data/health_repository.dart';
import '../data/local_health_repository.dart';
import '../../../shared/domain/health_log.dart';

final healthRepositoryProvider = FutureProvider<HealthRepository>((ref) async {
  return LocalHealthRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

/// Хуудаслалттай морины эрүүл мэндийн бүртгэлийн provider.
///
/// Page size: 20. Дараагийн хуудсыг `loadMore()`-оор ачаална.
/// [horseId]-аар шүүлт хийнэ.
final paginatedHealthLogsProvider =
    StateNotifierProvider.family<
      PaginationNotifier<HealthLog>,
      PaginationState<HealthLog>,
      String
    >((ref, horseId) {
      final notifier = PaginationNotifier<HealthLog>(
        fetchPage: (page, pageSize) async {
          final repo = ref.read(healthRepositoryProvider).requireValue;
          final result = await repo.fetchAllByHorsePaginated(
            horseId: horseId,
            page: page,
            limit: pageSize,
          );
          return result.getOrThrow().items;
        },
      );
      Future.microtask(() => notifier.loadInitial());
      return notifier;
    });

/// All health records for the current owner, used by the care overview.
final healthLogsProvider = FutureProvider<List<HealthLog>>((ref) async {
  final repository = await ref.watch(healthRepositoryProvider.future);
  final result = await repository.fetchAll();
  return result.getOrThrow();
});
