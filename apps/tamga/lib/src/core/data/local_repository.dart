import 'package:isar/isar.dart';

import '../error/result.dart';
import '../sync/sync_queue.dart';
import '../../features/shared/data/isar_storage.dart';

/// Abstract base class for local Isar-backed repositories.
///
/// Provides standard CRUD operations ([findAll], [findById], [save], [delete])
/// with automatic [SyncQueue] enqueue in [save] and [delete].
///
/// ### Subclass contract
///
/// Subclasses must implement the following abstract members:
/// - [collection] — the Isar collection for this entity type
/// - [entityType] — the entity type string used in [SyncQueueItem]
/// - [toDomain] — convert an Isar entity to the domain model
/// - [fromDomain] — convert a domain model to the Isar entity
/// - [domainIdOf] — extract the domain ID from a domain model
/// - [toDataJson] — serialize a domain model to JSON for the sync queue
///
/// ### Overriding CRUD
///
/// Repositories that need non-standard save/delete logic (e.g. full-collection
/// replacement, supplementary sync with Supabase) should override the relevant
/// method(s) while calling `super` where the base logic is still applicable.
abstract class LocalRepository<T, TIsar> {
  /// Creates a local repository backed by [storage] and [syncQueue].
  LocalRepository({
    required this.storage,
    required this.syncQueue,
  });

  /// The Isar storage used for database operations.
  final IsarStorage storage;

  /// The sync queue used for offline synchronization.
  final SyncQueue syncQueue;

  // ── Abstract sub-class contract ──────────────────────────────────

  /// The Isar collection for this repository's entity type.
  IsarCollection<TIsar> get collection;

  /// Entity type string used in [SyncQueueItem.entityType].
  String get entityType;

  /// Convert an Isar entity to the domain model.
  T toDomain(TIsar entity);

  /// Convert a domain model to the Isar entity.
  TIsar fromDomain(T entity);

  /// Extract the domain ID from a domain model.
  String domainIdOf(T entity);

  /// Serialize a domain model to JSON for the sync queue.
  Map<String, dynamic> toDataJson(T entity);

  // ── CRUD ─────────────────────────────────────────────────────────

  /// Fetch all entities from the local Isar store.
  Future<Result<List<T>>> findAll() {
    return Result.tryFuture(() async {
      final all = await collection.where().findAll();
      return all.map(toDomain).toList();
    });
  }

  /// Find the first Isar entity matching [domainId] by scanning all records.
  ///
  /// Uses Dart-level filtering because [domainIdEqualTo] is a generated
  /// method not available on the generic [IsarCollection].
  Future<TIsar?> _findByDomainId(String domainId) async {
    final all = await collection.where().findAll();
    // ignore: avoid_dynamic_casts
    return all.cast<dynamic>().firstWhere(
      (e) => (e as dynamic).domainId == domainId,
      orElse: () => null,
    ) as TIsar?;
  }

  /// Find a single entity by its [domainId].
  ///
  /// Returns `null` when no matching entity exists.
  Future<Result<T?>> findById(String domainId) {
    return Result.tryFuture(() async {
      final result = await _findByDomainId(domainId);
      return result != null ? toDomain(result) : null;
    });
  }

  /// Save (create or update) [item] and enqueue a [SyncQueueItem].
  ///
  /// When the entity already exists (matched by [domainIdOf]), the
  /// auto-increment Isar ID is carried over so the existing row is updated.
  Future<Result<T>> save(T item) {
    return Result.tryFuture(() async {
      final id = domainIdOf(item);
      final existing = await _findByDomainId(id);
      final isNew = existing == null;

      final isarObj = fromDomain(item);
      if (!isNew) {
        // Preserve the auto-increment Isar ID for updates
        // ignore: avoid_dynamic_casts
        (isarObj as dynamic).id = (existing as dynamic).id;
      }
      await collection.isar.writeTxn(() async {
        await collection.put(isarObj);
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: entityType,
          entityId: id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: toDataJson(item),
          timestamp: DateTime.now(),
        ),
      );

      return item;
    });
  }

  /// Delete an entity by its [domainId] and enqueue a [SyncQueueItem].
  ///
  /// If no matching entity exists the operation is a no-op (returns `Ok(null)`).
  Future<Result<void>> delete(String domainId) {
    return Result.tryFuture(() async {
      final toDelete = await _findByDomainId(domainId);
      if (toDelete != null) {
        // ignore: avoid_dynamic_casts
        final isarId = (toDelete as dynamic).id as int;
        await collection.isar.writeTxn(() async {
          await collection.delete(isarId);
        });
        syncQueue.enqueue(
          SyncQueueItem(
            entityType: entityType,
            entityId: domainId,
            action: SyncAction.delete,
            data: {},
            timestamp: DateTime.now(),
          ),
        );
      }
    });
  }
}
