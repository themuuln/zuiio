import 'dart:async';
import 'dart:math';

import 'package:uuid/uuid.dart';
import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_geofence_alert.dart';
import '../../shared/data/isar_schemas/isar_horse_location.dart';
import '../../shared/data/isar_schemas/isar_lost_horse_report.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_schemas/isar_lost_horse_media_draft.dart';
import '../../shared/data/isar_schemas/isar_sync_queue_item.dart';
import '../../shared/data/isar_schemas/isar_search_area.dart';
import '../domain/geofence_alert.dart';
import '../domain/horse_location.dart';
import '../domain/lost_horse_report.dart';
import '../domain/pasture_zone.dart';
import '../domain/search_area.dart';
import 'map_repository.dart';

/// Isar-backed local implementation of [MapRepository].
///
/// Stores all map data (horse locations, lost horse reports, search areas,
/// geofence alerts) in local Isar storage for offline use.
/// All methods return [Result<T>] and operate entirely without network.
class LocalMapRepository implements MapRepository {
  LocalMapRepository({IsarStorage? storage})
    : _storage = storage ?? IsarStorage.instance;

  final IsarStorage _storage;

  // ── Lost Horse Reports ────────────────────────────────────────────

  @override
  Future<Result<LostHorseReport>> reportLostHorse(
    LostHorseReport report,
  ) async {
    try {
      final isar = _storage.lostHorseReports.isar;
      final isarReport = IsarLostHorseReport.fromDomain(report);
      await isar.writeTxn(() async {
        await _storage.lostHorseReports.put(isarReport);
        final queueItem = IsarSyncQueueItem.fromDomain(
          SyncQueueItem(
            entityType: 'lost_horse_report',
            entityId: report.id,
            action: SyncAction.create,
            data: report.toJson(),
            timestamp: report.createdAt,
            accountId: report.ownerId,
            queueId: 'lost_horse_report:${report.id}',
          ),
        );
        await _storage.syncQueueItems.put(queueItem);
      });

      return Result.ok(report);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'REPORT_FAILED',
          'Хаяж морийн мэдээлэл хадгалсангүй: $e',
        ),
      );
    }
  }

  String _extensionOf(String path) {
    final extension = path.split('.').last.toLowerCase();
    return extension.isEmpty || extension == path ? 'jpg' : extension;
  }

  /// Atomically stores a report, its local media descriptors, and one queue row.
  Future<Result<LostHorseReport>> reportLostHorseWithMedia(
    LostHorseReport report,
    List<String> localMediaPaths,
  ) async {
    try {
      final isar = _storage.lostHorseReports.isar;
      final mediaDrafts = [
        for (var index = 0; index < localMediaPaths.length; index++)
          (IsarLostHorseMediaDraft()
            ..mediaId = const Uuid().v4()
            ..reportId = report.id
            ..accountId = report.ownerId
            ..localPath = localMediaPaths[index]
            ..mediaType = 'photo'
            ..storagePath =
                '${report.ownerId}/${report.id}/$index.${_extensionOf(localMediaPaths[index])}'
            ..sortOrder = index
            ..createdAt = report.createdAt),
      ];
      final queueData = Map<String, dynamic>.from(report.toJson())
        ..['media_ids'] = mediaDrafts.map((draft) => draft.mediaId).toList();
      await isar.writeTxn(() async {
        await _storage.lostHorseReports.put(
          IsarLostHorseReport.fromDomain(report),
        );
        await _storage.lostHorseMediaDrafts.putAll(mediaDrafts);
        await _storage.syncQueueItems.put(
          IsarSyncQueueItem.fromDomain(
            SyncQueueItem(
              entityType: 'lost_horse_report',
              entityId: report.id,
              action: SyncAction.create,
              data: queueData,
              timestamp: report.createdAt,
              accountId: report.ownerId,
              queueId: 'lost_horse_report:${report.id}',
            ),
          ),
        );
      });
      return Result.ok(report);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_FAILED', 'Мэдээлэл хадгалсангүй: $e'),
      );
    }
  }

  @override
  Future<Result<void>> updateLostHorseStatus(String id, String status) async {
    try {
      final isar = _storage.lostHorseReports.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.lostHorseReports
            .filter()
            .domainIdEqualTo(id)
            .findFirst();

        if (existing != null) {
          existing.status = status;
          existing.updatedAt = DateTime.now();
          await _storage.lostHorseReports.put(existing);
        }
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'STATUS_UPDATE_FAILED',
          'Төлөв шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> updateLostHorseFields(
    String id,
    Map<String, dynamic> fields,
  ) async {
    try {
      final isar = _storage.lostHorseReports.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.lostHorseReports
            .filter()
            .domainIdEqualTo(id)
            .findFirst();

        if (existing != null) {
          if (fields.containsKey('status')) {
            existing.status = fields['status'] as String;
          }
          if (fields.containsKey('expires_at')) {
            final expiresAt = fields['expires_at'];
            existing.expiresAt = expiresAt != null
                ? DateTime.parse(expiresAt as String)
                : null;
          }
          if (fields.containsKey('renewal_requested')) {
            existing.renewalRequested = fields['renewal_requested'] as bool;
          }
          existing.updatedAt = DateTime.now();
          await _storage.lostHorseReports.put(existing);
        }
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FIELD_UPDATE_FAILED',
          'Мэдээлэл шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getActiveLostHorses() async {
    try {
      final reports = await _storage.lostHorseReports
          .filter()
          .statusEqualTo('active')
          .sortByCreatedAtDesc()
          .findAll();

      return Result.ok(reports.map((r) => r.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_FAILED', 'Хаяж морь авч чадсангүй: $e'),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyLostReports(String ownerId) async {
    try {
      final reports = await _storage.lostHorseReports
          .filter()
          .ownerIdEqualTo(ownerId)
          .sortByCreatedAtDesc()
          .findAll();

      return Result.ok(reports.map((r) => r.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_FAILED', 'Мэдээлэл авч чадсангүй: $e'),
      );
    }
  }

  // ── Search Areas ──────────────────────────────────────────────────

  @override
  Future<Result<SearchArea>> saveSearchArea(SearchArea area) async {
    try {
      final isar = _storage.searchAreas.isar;
      final isarArea = IsarSearchArea.fromDomain(area);

      await isar.writeTxn(() async {
        await _storage.searchAreas.put(isarArea);
      });

      return Result.ok(area);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_FAILED', 'Хайх талбай хадгалсангүй: $e'),
      );
    }
  }

  @override
  Future<Result<List<SearchArea>>> getSearchAreas(String userId) async {
    try {
      final areas = await _storage.searchAreas
          .filter()
          .createdByEqualTo(userId)
          .sortByCreatedAtDesc()
          .findAll();

      return Result.ok(areas.map((a) => a.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FETCH_FAILED',
          'Хайх талбай авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> deleteSearchArea(String id) async {
    try {
      final isar = _storage.searchAreas.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.searchAreas
            .filter()
            .domainIdEqualTo(id)
            .findFirst();

        if (existing != null) {
          await _storage.searchAreas.delete(existing.id);
        }
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_FAILED', 'Хайх талбай устгасангүй: $e'),
      );
    }
  }

  // ── Horse Locations ───────────────────────────────────────────────

  @override
  Future<Result<void>> updateHorseLocation(HorseLocation location) async {
    try {
      final isar = _storage.horseLocations.isar;
      final isarLocation = IsarHorseLocation.fromDomain(location);

      await isar.writeTxn(() async {
        await _storage.horseLocations.put(isarLocation);
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'LOCATION_UPDATE_FAILED',
          'Байршил шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<HorseLocation>>> getNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  ) async {
    try {
      final allLocations = await _storage.horseLocations
          .filter()
          .isVisibleEqualTo(true)
          .findAll();

      final horses = allLocations.map((h) => h.toDomain()).where((h) {
        final distance = _haversine(lat, lng, h.lat, h.lng);
        return distance <= radiusKm * 1000;
      }).toList();

      // Sort by distance (closest first)
      horses.sort((a, b) {
        final distA = _haversine(lat, lng, a.lat, a.lng);
        final distB = _haversine(lat, lng, b.lat, b.lng);
        return distA.compareTo(distB);
      });

      return Result.ok(horses);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FETCH_FAILED',
          'Ойрхон морь авч чадсангүй: $e',
        ),
      );
    }
  }

  // ── Geofence Alerts ───────────────────────────────────────────────

  @override
  Future<Result<void>> saveGeofenceAlert(GeofenceAlert alert) async {
    try {
      final isar = _storage.geofenceAlerts.isar;
      final isarAlert = IsarGeofenceAlert.fromDomain(alert);

      await isar.writeTxn(() async {
        await _storage.geofenceAlerts.put(isarAlert);
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'SAVE_ALERT_FAILED',
          'Анхааруулга хадгалсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<GeofenceAlert>>> getGeofenceAlerts(String userId) async {
    try {
      final alerts = await _storage.geofenceAlerts
          .where()
          .sortByTriggeredAtDesc()
          .findAll();

      return Result.ok(alerts.map((a) => a.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FETCH_FAILED',
          'Анхааруулга авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> acknowledgeAlert(String alertId) async {
    try {
      final isar = _storage.geofenceAlerts.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.geofenceAlerts
            .filter()
            .domainIdEqualTo(alertId)
            .findFirst();

        if (existing != null) {
          existing.acknowledged = true;
          await _storage.geofenceAlerts.put(existing);
        }
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('ACK_FAILED', 'Анхааруулга баталсангүй: $e'),
      );
    }
  }

  // ── Real-time Streams ─────────────────────────────────────────────

  final _lostHorsesController =
      StreamController<List<LostHorseReport>>.broadcast();
  final _nearbyHorsesController =
      StreamController<List<HorseLocation>>.broadcast();

  @override
  Stream<List<LostHorseReport>> watchActiveLostHorses() {
    _emitActiveLostHorses();
    return _lostHorsesController.stream;
  }

  @override
  Stream<List<HorseLocation>> watchNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  ) {
    _emitNearbyHorses(lat, lng, radiusKm);
    return _nearbyHorsesController.stream;
  }

  Future<void> _emitActiveLostHorses() async {
    final result = await getActiveLostHorses();
    result.when(
      onSuccess: (reports) {
        if (!_lostHorsesController.isClosed) {
          _lostHorsesController.add(reports);
        }
      },
      onFailure: (_) {},
    );
  }

  Future<void> _emitNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  ) async {
    final result = await getNearbyHorses(lat, lng, radiusKm);
    result.when(
      onSuccess: (horses) {
        if (!_nearbyHorsesController.isClosed) {
          _nearbyHorsesController.add(horses);
        }
      },
      onFailure: (_) {},
    );
  }

  /// Dispose stream controllers.
  void dispose() {
    _lostHorsesController.close();
    _nearbyHorsesController.close();
  }

  // ── Haversine Distance ───────────────────────────────────────────

  /// Haversine distance in meters between two coordinates.
  /// Pure Dart implementation — no network required.
  double _haversine(double lat1, double lng1, double lat2, double lng2) {
    const r = 6371000.0; // Earth radius in meters
    final dLat = _deg2rad(lat2 - lat1);
    final dLng = _deg2rad(lng2 - lng1);
    final lat1Rad = _deg2rad(lat1);
    final lat2Rad = _deg2rad(lat2);
    final a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1Rad) * cos(lat2Rad) * sin(dLng / 2) * sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  double _deg2rad(double deg) => deg * pi / 180;

  // ── Pasture Zones ──────────────────────────────────────────────

  @override
  Future<Result<List<PastureZone>>> getPastureZones(String userId) async {
    // Pasture zones are Supabase-backed; return empty for offline.
    return const Result.ok([]);
  }

  @override
  Future<Result<PastureZone>> savePastureZone(PastureZone zone) async {
    return Result.ok(zone);
  }

  @override
  Future<Result<void>> deletePastureZone(String zoneId) async {
    return const Result.ok(null);
  }

  @override
  Future<Result<void>> assignHorseToZone(String zoneId, String horseId) async {
    return const Result.ok(null);
  }

  @override
  Future<Result<void>> unassignHorseFromZone(
    String zoneId,
    String horseId,
  ) async {
    return const Result.ok(null);
  }
}
