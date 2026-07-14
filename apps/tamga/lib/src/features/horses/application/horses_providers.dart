import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../data/horses_repository.dart';
import '../data/local_horses_repository.dart';
import '../domain/horse_record.dart';

enum HorseOwnershipFilter { all, household, external }

extension HorseOwnershipFilterLabel on HorseOwnershipFilter {
  String get label => switch (this) {
    HorseOwnershipFilter.all => 'Бүгд',
    HorseOwnershipFilter.household => 'Өрхийн',
    HorseOwnershipFilter.external => 'Гаднах',
  };
}

final horsesRepositoryProvider = FutureProvider<HorsesRepository>((ref) async {
  return LocalHorsesRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

final horsesProvider = createListProvider<HorseRecord, HorsesRepository>(
  (ref) => ref.watch(horsesRepositoryProvider.future),
  (repo) => repo.fetchHorses(),
);

final horseOwnershipFilterProvider = StateProvider<HorseOwnershipFilter>((ref) {
  return HorseOwnershipFilter.all;
});

/// Derived provider that returns only the count of household horses.
/// Use with select() for fine-grained rebuilds.
final householdHorseCountProvider = FutureProvider<int>((ref) async {
  final horses = await ref.watch(horsesProvider.future);
  return horses.where((h) => h.isOwnedByHousehold).length;
});

/// Derived provider that returns only the count of external horses.
/// Use with select() for fine-grained rebuilds.
final externalHorseCountProvider = FutureProvider<int>((ref) async {
  final horses = await ref.watch(horsesProvider.future);
  return horses.where((h) => !h.isOwnedByHousehold).length;
});

/// Хуудаслалттай морьдын жагсаалтын provider.
///
/// Page size: 20. Дараагийн хуудсыг `loadMore()`-оор ачаална.
final paginatedHorsesProvider =
    StateNotifierProvider<
      PaginationNotifier<HorseRecord>,
      PaginationState<HorseRecord>
    >((ref) {
      final notifier = PaginationNotifier<HorseRecord>(
        fetchPage: (page, pageSize) async {
          final repo = ref.read(horsesRepositoryProvider).requireValue;
          final result = await repo.fetchHorsesPaginated(
            page: page,
            limit: pageSize,
          );
          return result.getOrThrow().items;
        },
      );
      // Анхны ачаалалт
      Future.microtask(() => notifier.loadInitial());
      return notifier;
    });
