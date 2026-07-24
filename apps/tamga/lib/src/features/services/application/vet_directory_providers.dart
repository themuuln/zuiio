/// Мал эмнэлгийн лавлахын provider-ууд.
///
/// Аймгаар шүүж, мэргэжлээр шүүх боломжтой.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../data/services_repository.dart';
import '../domain/vet_profile.dart';
import 'services_providers.dart';

// ── Vet directory providers ──────────────────────────────────────

/// Бүх мал эмнэлгийн профайлууд.
final allVetProfilesProvider =
    createListProvider<VetProfile, VetProfileRepository>(
      (ref) => ref.watch(vetProfileRepositoryProvider.future),
      (repo) => repo.fetchAll(),
    );

/// Аймгаар шүүсэн мал эмнэлгийн профайлууд.
final vetProfilesByAimagProvider =
    createListFamilyProvider<VetProfile, VetProfileRepository, String>(
      (ref) => ref.watch(vetProfileRepositoryProvider.future),
      (repo, aimag) => repo.fetchByAimag(aimag),
    );

/// Шүүлтийн параметр.
class VetFilter {
  const VetFilter({this.aimag, this.specialization});

  final String? aimag;
  final String? specialization;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is VetFilter &&
          aimag == other.aimag &&
          specialization == other.specialization;

  @override
  int get hashCode => Object.hash(aimag, specialization);
}

/// Шүүлт бүхий мал эмнэлгийн профайлууд.
final filteredVetProfilesProvider =
    FutureProvider.family<List<VetProfile>, VetFilter>((ref, filter) async {
      List<VetProfile> profiles;
      if (filter.aimag != null && filter.aimag!.isNotEmpty) {
        profiles = await ref.watch(
          vetProfilesByAimagProvider(filter.aimag!).future,
        );
      } else {
        profiles = await ref.watch(allVetProfilesProvider.future);
      }

      if (filter.specialization != null && filter.specialization!.isNotEmpty) {
        profiles = profiles
            .where((v) => v.specialization.contains(filter.specialization))
            .toList();
      }

      return profiles;
    });

/// Мал эмнэлгийн профайлыг ID-аар авах.
final vetProfileByIdProvider = FutureProvider.family<VetProfile?, String>((
  ref,
  id,
) async {
  final repository = await ref.watch(vetProfileRepositoryProvider.future);
  final result = await repository.fetchById(id);
  return result.getOrThrow();
});
