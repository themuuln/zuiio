import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/data/isar_storage.dart';
import '../data/certificate_repository.dart';
import '../data/local_certificate_repository.dart';
import '../domain/ownership_certificate.dart';

// ── Repository ─────────────────────────────────────────────────

final certificateRepositoryProvider = Provider<CertificateRepository>((ref) {
  return LocalCertificateRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
    syncStorage: ref.watch(isarSyncStorageProvider),
  );
});

// ── Certificate by horse ───────────────────────────────────────

final certificateByHorseProvider =
    FutureProvider.family<OwnershipCertificate?, String>((ref, horseId) async {
      final repo = ref.watch(certificateRepositoryProvider);
      final result = await repo.getCertificateByHorse(horseId);
      return switch (result) {
        Ok(value: final cert) => cert,
        Fail() => null,
      };
    });

// ── Certificates by owner ──────────────────────────────────────

final certificatesByOwnerProvider = FutureProvider<List<OwnershipCertificate>>((
  ref,
) async {
  final userId = currentSupabaseUserId();
  if (userId == null) return const [];

  final repo = ref.watch(certificateRepositoryProvider);
  final result = await repo.getCertificatesByOwner(userId);
  return switch (result) {
    Ok(value: final certs) => certs,
    Fail() => const [],
  };
});
