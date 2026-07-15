import 'dart:async';
import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/geofence_alert.dart';
import '../domain/horse_location.dart';
import '../domain/lost_horse_report.dart';
import '../domain/search_area.dart';
import 'map_repository.dart';

/// Supabase implementation of [MapRepository].
class SupabaseMapRepository
    with SupabaseRepositoryMixin
    implements MapRepository {
  SupabaseMapRepository({SupabaseClient? client})
    : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  @override
  SupabaseClient? get client => _client;

  // ── Lost Horse Reports ────────────────────────────────────────────

  @override
  Future<Result<LostHorseReport>> reportLostHorse(
    LostHorseReport report,
  ) async {
    try {
      final data = report.toJson()..remove('id');
      final response = await _client
          .from('lost_horse_reports')
          .insert(data)
          .select()
          .single();
      return Result.ok(LostHorseReport.fromJson(response));
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'REPORT_FAILED',
          message: 'Хаяж морийн мэдээлэл хадгалсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> updateLostHorseStatus(String id, String status) async {
    try {
      await _client
          .from('lost_horse_reports')
          .update({
            'status': status,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'STATUS_UPDATE_FAILED',
          message: 'Төлөв шинэчилсэнгүй: $e',
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
      final updateData = Map<String, dynamic>.from(fields);
      updateData['updated_at'] = DateTime.now().toIso8601String();
      await _client.from('lost_horse_reports').update(updateData).eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FIELD_UPDATE_FAILED',
          message: 'Мэдээлэл шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getActiveLostHorses() async {
    try {
      final response = await _client
          .from('lost_horse_reports')
          .select()
          .eq('status', 'active')
          .order('created_at', ascending: false);
      final reports = (response as List)
          .map((r) => LostHorseReport.fromJson(r as Map<String, dynamic>))
          .toList();
      final enriched = await _enrichWithMedia(reports);
      return Result.ok(enriched);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_FAILED',
          message: 'Хаяж морь авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyLostReports(String ownerId) async {
    try {
      final response = await _client
          .from('lost_horse_reports')
          .select()
          .eq('owner_id', ownerId)
          .order('created_at', ascending: false);
      final reports = (response as List)
          .map((r) => LostHorseReport.fromJson(r as Map<String, dynamic>))
          .toList();
      final enriched = await _enrichWithMedia(reports);
      return Result.ok(enriched);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_FAILED',
          message: 'Мэдээлэл авч чадсангүй: $e',
        ),
      );
    }
  }

  // ── Media enrichment ───────────────────────────────────────────────

  /// Fetches photo/video URLs from [lost_horse_media] for each report
  /// and returns reports with populated [photoUrls] and [videoUrls].
  Future<List<LostHorseReport>> _enrichWithMedia(
    List<LostHorseReport> reports,
  ) async {
    if (reports.isEmpty) return reports;

    try {
      final reportIds = reports.map((r) => r.id).toList();
      final mediaResponse = await _client
          .from('lost_horse_media')
          .select()
          .inFilter('report_id', reportIds)
          .order('sort_order', ascending: true);

      final photoMap = <String, List<String>>{};
      final videoMap = <String, List<String>>{};

      for (final m in (mediaResponse as List)) {
        final row = m as Map<String, dynamic>;
        final reportId = row['report_id'] as String;
        final url = row['url'] as String;
        final mediaType = row['media_type'] as String;
        if (mediaType == 'photo') {
          photoMap.putIfAbsent(reportId, () => []).add(url);
        } else if (mediaType == 'video') {
          videoMap.putIfAbsent(reportId, () => []).add(url);
        }
      }

      return reports.map((r) {
        final photos = photoMap[r.id] ?? [];
        final videos = videoMap[r.id] ?? [];
        if (photos.isEmpty && videos.isEmpty) return r;
        return r.copyWith(photoUrls: photos, videoUrls: videos);
      }).toList();
    } catch (_) {
      // If media fetch fails, return reports without media URLs
      // rather than failing the entire request.
      return reports;
    }
  }

  // ── Search Areas ──────────────────────────────────────────────────

  @override
  Future<Result<SearchArea>> saveSearchArea(SearchArea area) async {
    try {
      final data = area.toJson()..remove('id');
      final response = await _client
          .from('search_areas')
          .insert(data)
          .select()
          .single();
      return Result.ok(SearchArea.fromJson(response));
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'SAVE_FAILED',
          message: 'Хайх талбай хадгалсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<SearchArea>>> getSearchAreas(String userId) async {
    try {
      final response = await _client
          .from('search_areas')
          .select()
          .eq('created_by', userId)
          .order('created_at', ascending: false);
      final areas = (response as List)
          .map((r) => SearchArea.fromJson(r as Map<String, dynamic>))
          .toList();
      return Result.ok(areas);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_FAILED',
          message: 'Хайх талбай авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> deleteSearchArea(String id) async {
    try {
      await _client.from('search_areas').delete().eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'DELETE_FAILED',
          message: 'Хайх талбай устгасангүй: $e',
        ),
      );
    }
  }

  // ── Horse Locations ───────────────────────────────────────────────

  @override
  Future<Result<void>> updateHorseLocation(HorseLocation location) async {
    try {
      await _client.from('horse_locations').upsert(location.toJson());
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'LOCATION_UPDATE_FAILED',
          message: 'Байршил шинэчилсэнгүй: $e',
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
      // Fetch visible locations and filter by distance in Dart
      // (PostGIS would be more efficient for large datasets)
      final response = await _client
          .from('horse_locations')
          .select()
          .eq('is_visible', true);

      final horses = (response as List)
          .map((r) => HorseLocation.fromJson(r as Map<String, dynamic>))
          .where((h) {
            final distance = _haversine(lat, lng, h.lat, h.lng);
            return distance <= radiusKm * 1000;
          })
          .toList();

      // Sort by distance
      horses.sort((a, b) {
        final distA = _haversine(lat, lng, a.lat, a.lng);
        final distB = _haversine(lat, lng, b.lat, b.lng);
        return distA.compareTo(distB);
      });

      return Result.ok(horses);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_FAILED',
          message: 'Ойрхон морь авч чадсангүй: $e',
        ),
      );
    }
  }

  /// Haversine distance in meters between two coordinates.
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

  // ── Geofence Alerts ───────────────────────────────────────────────

  @override
  Future<Result<void>> saveGeofenceAlert(GeofenceAlert alert) async {
    try {
      final data = alert.toJson()..remove('id');
      await _client.from('geofence_alerts').insert(data);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'SAVE_ALERT_FAILED',
          message: 'Анхааруулга хадгалсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<GeofenceAlert>>> getGeofenceAlerts(String userId) async {
    try {
      final response = await _client
          .from('geofence_alerts')
          .select()
          .order('triggered_at', ascending: false)
          .limit(100);
      final alerts = (response as List)
          .map((r) => GeofenceAlert.fromJson(r as Map<String, dynamic>))
          .toList();
      return Result.ok(alerts);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_FAILED',
          message: 'Анхааруулга авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> acknowledgeAlert(String alertId) async {
    try {
      await _client
          .from('geofence_alerts')
          .update({'acknowledged': true})
          .eq('id', alertId);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'ACK_FAILED',
          message: 'Анхааруулга баталсангүй: $e',
        ),
      );
    }
  }

  // ── Real-time Streams ─────────────────────────────────────────────

  final _lostHorsesController =
      StreamController<List<LostHorseReport>>.broadcast();
  final _nearbyHorsesController =
      StreamController<List<HorseLocation>>.broadcast();
  RealtimeChannel? _lostHorsesChannel;
  RealtimeChannel? _nearbyHorsesChannel;

  @override
  Stream<List<LostHorseReport>> watchActiveLostHorses() {
    // Subscribe to Supabase realtime changes on lost_horse_reports
    _lostHorsesChannel?.unsubscribe();
    _lostHorsesChannel = _client
        .channel('lost_horses_live')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'lost_horse_reports',
          callback: (_) => _fetchAndEmitLostHorses(),
        )
        .subscribe();

    // Initial fetch
    _fetchAndEmitLostHorses();

    return _lostHorsesController.stream;
  }

  Future<void> _fetchAndEmitLostHorses() async {
    final result = await getActiveLostHorses();
    result.when(
      onSuccess: (v) {
        if (!_lostHorsesController.isClosed) _lostHorsesController.add(v);
      },
      onFailure: (_) {},
    );
  }

  @override
  Stream<List<HorseLocation>> watchNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  ) {
    // Subscribe to Supabase realtime changes on horse_locations
    _nearbyHorsesChannel?.unsubscribe();
    _nearbyHorsesChannel = _client
        .channel('nearby_horses_live')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'horse_locations',
          callback: (_) => _fetchAndEmitNearbyHorses(lat, lng, radiusKm),
        )
        .subscribe();

    // Initial fetch
    _fetchAndEmitNearbyHorses(lat, lng, radiusKm);

    return _nearbyHorsesController.stream;
  }

  Future<void> _fetchAndEmitNearbyHorses(
    double lat,
    double lng,
    double radiusKm,
  ) async {
    final result = await getNearbyHorses(lat, lng, radiusKm);
    result.when(
      onSuccess: (v) {
        if (!_nearbyHorsesController.isClosed) _nearbyHorsesController.add(v);
      },
      onFailure: (_) {},
    );
  }

  /// Dispose realtime subscriptions.
  void dispose() {
    _lostHorsesChannel?.unsubscribe();
    _nearbyHorsesChannel?.unsubscribe();
    _lostHorsesController.close();
    _nearbyHorsesController.close();
  }
}
