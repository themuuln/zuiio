import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_schemas/isar_sighting_report.dart';
import '../../shared/data/isar_schemas/isar_lost_horse_report.dart';
import '../domain/map_enums.dart';
import '../../shared/data/isar_schemas/isar_sync_queue_item.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/lost_horse_report.dart';
import '../domain/sighting_report.dart';
import 'local_map_repository.dart';
import 'local_sighting_repository.dart';
import 'lost_horse_repository.dart';

/// Isar-first recovery repository. Remote publication is represented by a
/// durable queue item and never makes a private local draft public by itself.
class LocalLostHorseRepository implements LostHorseRepository {
  LocalLostHorseRepository({IsarStorage? storage})
    : _storage = storage ?? IsarStorage.instance,
      _map = LocalMapRepository(storage: storage),
      _sightings = LocalSightingRepository(storage: storage);

  final IsarStorage _storage;
  final LocalMapRepository _map;
  final LocalSightingRepository _sightings;

  @override
  Future<Result<LostHorseReport>> createReport(
    LostHorseReport report, {
    List<String> localMediaPaths = const [],
    List<String> mediaIds = const [],
  }) {
    return _map.reportLostHorseWithMedia(report, localMediaPaths);
  }

  @override
  Future<Result<LostHorseReport>> getReport(String reportId) async {
    try {
      final row = await _storage.lostHorseReports
          .filter()
          .domainIdEqualTo(reportId)
          .findFirst();
      return row == null
          ? Result.fail(
              const AppException(
                code: 'REPORT_NOT_FOUND',
                message: 'Зар олдсонгүй. / Report not found.',
              ),
            )
          : Result.ok(row.toDomain());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_READ_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyReports(String ownerId) async {
    final result = await _map.getMyLostReports(ownerId);
    return result;
  }

  @override
  Future<Result<List<LostHorseReport>>> browseActiveReports() =>
      _map.getActiveLostHorses();

  @override
  Future<Result<LostHorseReport>> publishReport(
    String reportId, {
    List<String> expectedMediaIds = const [],
  }) async {
    final mediaIds = expectedMediaIds.isNotEmpty
        ? expectedMediaIds
        : (await _storage.lostHorseMediaDrafts.where().findAll())
              .where((draft) => draft.reportId == reportId)
              .map((draft) => draft.mediaId)
              .toList();
    return _updateReport(
      reportId,
      (report) => report,
      action: SyncAction.update,
      entityType: 'lost_horse_publish',
      queueData: {'expected_media_ids': mediaIds},
    );
  }

  @override
  Future<Result<LostHorseReport>> resolveReport({
    required String reportId,
    required LostHorseResolutionType resolutionType,
    String? note,
    String? verifiedSightingId,
  }) => _updateReport(
    reportId,
    (report) => report.copyWith(
      status: resolutionType == LostHorseResolutionType.reunited
          ? LostHorseStatus.found
          : LostHorseStatus.cancelled,
      resolutionType: resolutionType,
      resolutionNote: note,
      resolvedAt: DateTime.now(),
      verifiedSightingId: verifiedSightingId,
      publicAccessEnabled: false,
    ),
    action: SyncAction.update,
    entityType: 'lost_horse_resolution',
  );

  @override
  Future<Result<SightingReport>> createSighting(SightingReport sighting) async {
    try {
      final isar = _storage.sightingReports.isar;
      await isar.writeTxn(() async {
        await _storage.sightingReports.put(
          IsarSightingReport.fromDomain(sighting),
        );
        await _storage.syncQueueItems.put(
          IsarSyncQueueItem.fromDomain(
            SyncQueueItem(
              entityType: 'lost_horse_sighting',
              entityId: sighting.id,
              action: SyncAction.create,
              data: sighting.toJson(),
              timestamp: sighting.createdAt,
              accountId: sighting.reporterId,
              queueId: 'lost_horse_sighting:${sighting.id}',
            ),
          ),
        );
      });
      return Result.ok(sighting);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SIGHTING_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getSightings(String reportId) =>
      _sightings.getSightingsForReport(reportId);

  @override
  Future<Result<SightingReport>> reviewSighting({
    required String sightingId,
    required SightingStatus status,
  }) async {
    final result = await _sightings.updateSightingStatus(
      sightingId,
      status.name,
    );
    if (result.isFailure) return Result.fail(result.error);
    final row = await _storage.sightingReports
        .filter()
        .domainIdEqualTo(sightingId)
        .findFirst();
    return row == null
        ? Result.fail(
            const AppException(
              code: 'SIGHTING_NOT_FOUND',
              message: 'Мэдээлэл олдсонгүй. / Sighting not found.',
            ),
          )
        : Result.ok(row.toDomain());
  }

  Future<Result<LostHorseReport>> _updateReport(
    String reportId,
    LostHorseReport Function(LostHorseReport) transform, {
    required SyncAction action,
    required String entityType,
    Map<String, dynamic> queueData = const {},
  }) async {
    final current = await getReport(reportId);
    if (current.isFailure) return Result.fail(current.error);
    final updated = transform(
      current.value,
    ).copyWith(updatedAt: DateTime.now());
    try {
      final data = Map<String, dynamic>.from(updated.toJson())
        ..addAll(queueData);
      await _storage.lostHorseReports.isar.writeTxn(() async {
        await _storage.lostHorseReports.put(
          IsarLostHorseReport.fromDomain(updated),
        );
        await _storage.syncQueueItems.put(
          IsarSyncQueueItem.fromDomain(
            SyncQueueItem(
              entityType: entityType,
              entityId: reportId,
              action: action,
              data: data,
              timestamp: updated.updatedAt,
              accountId: updated.ownerId,
              queueId: '$entityType:$reportId',
            ),
          ),
        );
      });
      return Result.ok(updated);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_UPDATE_FAILED', e.toString()),
      );
    }
  }
}
