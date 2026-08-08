import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/connection_status.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/lineage_repository.dart';
import '../data/local_lineage_repository.dart';
import '../data/supabase_lineage_repository.dart';
import '../domain/lineage_root.dart';
import '../domain/lineage_snapshot.dart';
import 'pedigree_layout.dart';

enum LineageHomeView { tree, list, timeline }

extension LineageHomeViewLabel on LineageHomeView {
  String get label => switch (this) {
    LineageHomeView.tree => 'Tree',
    LineageHomeView.list => 'List',
    LineageHomeView.timeline => 'Timeline',
  };
}

enum LineageTreeDepth { three, five, full }

extension LineageTreeDepthValue on LineageTreeDepth {
  String get label => switch (this) {
    LineageTreeDepth.three => '3 үе',
    LineageTreeDepth.five => '5 үе',
    LineageTreeDepth.full => 'Бүгд',
  };

  int? get maxGeneration => switch (this) {
    LineageTreeDepth.three => 3,
    LineageTreeDepth.five => 5,
    LineageTreeDepth.full => null,
  };
}

/// Provider for the local Isar-backed [LocalLineageRepository] that can be
/// used for caching Supabase results and for offline reads.
final localLineageRepositoryProvider = Provider<LocalLineageRepository>((ref) {
  return LocalLineageRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

/// Provides a [LineageRepository] that switches between local (Isar) and
/// remote (Supabase) based on connectivity.
///
/// - When online: uses [SupabaseLineageRepository] for reads and automatically
///   caches results to the local Isar storage for offline availability.
/// - When offline: reads from the local Isar-backed [LocalLineageRepository].
/// - Mutations always write to local Isar first via [LocalLineageRepository],
///   then enqueue sync items that the sync engine processes when online.
final lineageRepositoryProvider = Provider<LineageRepository>((ref) {
  final isOnline =
      ConnectionMonitor.instance.current == ConnectionStatus.online;

  if (isOnline) {
    return SupabaseLineageRepository();
  }

  return ref.read(localLineageRepositoryProvider);
});

final selectedLineageRootIdProvider = StateProvider<String>((ref) {
  return 'khan-khuleg';
});

final lineageHomeViewProvider = StateProvider<LineageHomeView>((ref) {
  return LineageHomeView.tree;
});

final lineageTreeDepthProvider = StateProvider<LineageTreeDepth>((ref) {
  return LineageTreeDepth.three;
});

final selectedPedigreeNodeIdProvider = StateProvider<String?>((ref) {
  return null;
});

final lineageRootsProvider = FutureProvider<List<LineageRoot>>((ref) async {
  final repository = ref.watch(lineageRepositoryProvider);
  final result = await repository.fetchRoots();
  final roots = result.getOrThrow();

  // Cache to local Isar when fetching from Supabase (online)
  if (repository is SupabaseLineageRepository) {
    final localRepo = ref.read(localLineageRepositoryProvider);
    unawaited(localRepo.cacheRoots(roots));
  }

  return roots;
});

final selectedLineageRootProvider = Provider<LineageRoot?>((ref) {
  final roots = ref.watch(lineageRootsProvider).valueOrNull;
  final selectedId = ref.watch(selectedLineageRootIdProvider);

  if (roots == null) {
    return null;
  }

  for (final root in roots) {
    if (root.id == selectedId) {
      return root;
    }
  }

  return roots.isEmpty ? null : roots.first;
});

final lineageSnapshotProvider = FutureProvider<LineageSnapshot>((ref) async {
  final repository = ref.watch(lineageRepositoryProvider);
  final selectedId = ref.watch(selectedLineageRootIdProvider);
  final result = await repository.fetchSnapshot(selectedId);
  final snapshot = result.getOrThrow();

  // Cache to local Isar when fetching from Supabase (online)
  if (repository is SupabaseLineageRepository) {
    final localRepo = ref.read(localLineageRepositoryProvider);
    unawaited(localRepo.cacheSnapshot(snapshot));
  }

  return snapshot;
});

final pedigreeLayoutProvider = Provider<PedigreeLayoutResult?>((ref) {
  final snapshot = ref.watch(lineageSnapshotProvider).valueOrNull;
  if (snapshot == null) {
    return null;
  }

  final depth = ref.watch(lineageTreeDepthProvider);
  return buildPedigreeLayout(
    snapshot: snapshot,
    maxGeneration: depth.maxGeneration,
  );
});

final selectedPedigreeNodeProvider = Provider<PedigreeNodeVm?>((ref) {
  final layout = ref.watch(pedigreeLayoutProvider);
  final selectedNodeId = ref.watch(selectedPedigreeNodeIdProvider);
  final rootId = ref.watch(selectedLineageRootIdProvider);

  if (layout == null) {
    return null;
  }

  return layout.nodeById(selectedNodeId ?? rootId);
});
