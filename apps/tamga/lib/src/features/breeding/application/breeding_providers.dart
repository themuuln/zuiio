import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/breeding_repository.dart';
import '../data/local_breeding_repository.dart';
import '../domain/breeding_record.dart';

final breedingRepositoryProvider = FutureProvider<BreedingRepository>((
  ref,
) async {
  return LocalBreedingRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

final breedingRecordsProvider =
    createListProvider<BreedingRecord, BreedingRepository>(
      (ref) => ref.watch(breedingRepositoryProvider.future),
      (repo) => repo.fetchBreedingRecords(),
    );
