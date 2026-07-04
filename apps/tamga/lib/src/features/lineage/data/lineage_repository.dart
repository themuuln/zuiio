import '../../../core/error/result.dart';
import '../domain/lineage_root.dart';
import '../domain/lineage_snapshot.dart';

abstract interface class LineageRepository {
  // ── Read operations ──────────────────────────────────────────────

  Future<Result<List<LineageRoot>>> fetchRoots();
  Future<Result<LineageSnapshot>> fetchSnapshot(String rootId);

  // ── CRUD operations ──────────────────────────────────────────────

  /// Add a parent link (sire or dam) to a horse.
  Future<Result<void>> addParentLink({
    required String horseId,
    required String parentId,
    required String relation, // 'sire' or 'dam'
  });

  /// Remove a parent link from a horse.
  Future<Result<void>> removeParentLink({
    required String horseId,
    required String parentId,
  });

  /// Update a horse's lineage info (name, coat, birth year, notes).
  Future<Result<void>> updateHorseLineageInfo({
    required String horseId,
    String? name,
    String? coat,
    int? birthYear,
    String? notes,
  });
}
