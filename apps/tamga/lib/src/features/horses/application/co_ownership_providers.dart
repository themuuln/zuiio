/// Хамтран өмчлөлийн Riverpod провайдерууд.
/// Cloud-sync дэмжлэгтэй — Supabase тохиргоотой бол cloud, үгүй бол local.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app_config.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/data/isar_storage.dart';
import '../data/co_ownership_repository.dart';
import '../data/supabase_co_ownership_repository.dart';
import '../domain/co_ownership.dart';

/// Хамтран өмчлөлийн repository (local эсвэл cloud).
final coOwnershipRepositoryProvider = Provider<CoOwnershipRepository>((ref) {
  if (AppConfig.isSupabaseConfigured) {
    return SupabaseCoOwnershipRepository();
  }
  return LocalCoOwnershipRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
    syncStorage: ref.watch(isarSyncStorageProvider),
  );
});

/// Хамтран өмчлөгчдийг авах (future).
final coOwnersProvider = FutureProvider.family<List<CoOwnershipRecord>, String>(
  (ref, horseId) async {
    final repo = ref.watch(coOwnershipRepositoryProvider);
    return (await repo.fetchCoOwners(horseId)).getOrThrow();
  },
);

/// Хамтран өмчлөгчдийг real-time сонсох (stream).
final coOwnersStreamProvider =
    StreamProvider.family<List<CoOwnershipRecord>, String>((ref, horseId) {
      final repo = ref.watch(coOwnershipRepositoryProvider);
      final stream = repo.watchCoOwners(horseId);
      if (stream != null) return stream;
      // Local repo — stream-гүй, future-ээс stream үүсгэнэ.
      return Stream.fromFuture(
        repo.fetchCoOwners(horseId),
      ).map((result) => result.getOrThrow());
    });
