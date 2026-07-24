import 'package:tamga/src/core/error/result.dart';

import '../domain/geofence_alert.dart';
import '../domain/horse_location.dart';
import '../domain/lost_horse_report.dart';
import '../domain/pasture_zone.dart';
import '../domain/search_area.dart';

/// Abstract interface for map operations.
abstract class MapRepository {
  // ── Lost Horse Reports ────────────────────────────────────────────

  Future<Result<LostHorseReport>> reportLostHorse(LostHorseReport report);
  Future<Result<void>> updateLostHorseStatus(String id, String status);
  Future<Result<List<LostHorseReport>>> getActiveLostHorses();
  Future<Result<List<LostHorseReport>>> getMyLostReports(String ownerId);

  /// Update arbitrary fields on a lost horse report.
  ///
  /// [id] is the report's UUID.
  /// [fields] is a map of column names to values (e.g. `{'expires_at': '...'}`).
  Future<Result<void>> updateLostHorseFields(
    String id,
    Map<String, dynamic> fields,
  );

  // ── Search Areas ──────────────────────────────────────────────────

  Future<Result<SearchArea>> saveSearchArea(SearchArea area);
  Future<Result<List<SearchArea>>> getSearchAreas(String userId);
  Future<Result<void>> deleteSearchArea(String id);

  // ── Horse Locations ───────────────────────────────────────────────

  Future<Result<void>> updateHorseLocation(HorseLocation location);
  Future<Result<List<HorseLocation>>> getNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  );

  // ── Geofence Alerts ───────────────────────────────────────────────

  Future<Result<void>> saveGeofenceAlert(GeofenceAlert alert);
  Future<Result<List<GeofenceAlert>>> getGeofenceAlerts(String userId);
  Future<Result<void>> acknowledgeAlert(String alertId);

  // ── Pasture Zones ────────────────────────────────────────────────

  Future<Result<List<PastureZone>>> getPastureZones(String userId);
  Future<Result<PastureZone>> savePastureZone(PastureZone zone);
  Future<Result<void>> deletePastureZone(String zoneId);
  Future<Result<void>> assignHorseToZone(String zoneId, String horseId);
  Future<Result<void>> unassignHorseFromZone(String zoneId, String horseId);

  // ── Real-time Streams ─────────────────────────────────────────────

  Stream<List<LostHorseReport>> watchActiveLostHorses();
  Stream<List<HorseLocation>> watchNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  );
}
