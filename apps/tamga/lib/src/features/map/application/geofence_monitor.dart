import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../app/supabase_bootstrap.dart';
import '../data/geofence_service.dart';
import '../data/location_service.dart';
import '../data/map_repository.dart';
import '../domain/geofence_alert.dart';
import '../domain/map_enums.dart';
import '../domain/search_area.dart';
import 'geofence_providers.dart';
import 'map_providers.dart';

/// Background geofence monitor that watches GPS position updates and fires
/// [GeofenceAlert] records when a horse enters or exits a [SearchArea] boundary.
///
/// This service is intentionally decoupled from the presentation layer —
/// it works fully offline for containment calculations and only hits
/// Supabase when persisting alerts.
class GeofenceMonitor {
  GeofenceMonitor({
    required this.locationService,
    required this.geofenceService,
    required this.mapRepository,
  });

  final LocationService locationService;
  final GeofenceService geofenceService;
  final MapRepository mapRepository;

  StreamSubscription<Position>? _subscription;

  /// The last known containment state per geofence area ID.
  /// `true` = inside, `false` = outside.
  final Map<String, bool> _containmentState = {};

  /// Whether the monitor is currently running.
  bool get isRunning => _subscription != null;

  /// Start listening to GPS position updates and monitoring geofence boundaries.
  ///
  /// [distanceFilter] is in meters — only fires when the device moves
  /// at least this far. Default 50m is a good balance between battery
  /// usage and boundary-crossing accuracy.
  Future<void> start({int distanceFilter = 50}) async {
    if (_subscription != null) return;

    _subscription = locationService
        .getPositionStream(distanceFilter: distanceFilter)
        .listen(_onPositionUpdate);
  }

  /// Stop monitoring.
  void stop() {
    _subscription?.cancel();
    _subscription = null;
  }

  /// Process a position update: check containment against all active areas.
  Future<void> _onPositionUpdate(Position position) async {
    final userId = currentSupabaseUserId();
    if (userId == null) return;

    // Fetch active areas — uses the provider's cached data when possible.
    // We read directly from the repo to avoid coupling to Riverpod in tests.
    final areas = await _fetchActiveAreas(userId);
    if (areas.isEmpty) return;

    final pointLat = position.latitude;
    final pointLng = position.longitude;

    // Determine which areas currently contain this point.
    final currentlyInside = geofenceService.findContainingAreas(
      pointLat,
      pointLng,
      areas,
    );

    final currentlyInsideIds = currentlyInside.map((a) => a.id).toSet();

    // ── Detect boundary crossings ──────────────────────────────

    for (final area in areas) {
      final wasInside = _containmentState[area.id] ?? false;
      final isInside = currentlyInsideIds.contains(area.id);

      if (wasInside && !isInside) {
        // ── Exited geofence ──
        await _fireAlert(
          area: area,
          alertType: GeofenceAlertType.exited,
          lat: pointLat,
          lng: pointLng,
          userId: userId,
        );
      } else if (!wasInside && isInside) {
        // ── Entered geofence ──
        await _fireAlert(
          area: area,
          alertType: GeofenceAlertType.entered,
          lat: pointLat,
          lng: pointLng,
          userId: userId,
        );
      }

      // Update state
      _containmentState[area.id] = isInside;
    }
  }

  /// Persist a geofence alert to the repository.
  Future<void> _fireAlert({
    required SearchArea area,
    required GeofenceAlertType alertType,
    required double lat,
    required double lng,
    required String userId,
  }) async {
    final alert = GeofenceAlert(
      id: '', // Server-generated
      horseId: '', // System-level alert, not horse-specific
      horseName: '',
      geofenceId: area.id,
      geofenceName: area.name,
      alertType: alertType,
      triggeredAt: DateTime.now(),
      horseLat: lat,
      horseLng: lng,
    );

    // Fire-and-forget: if offline, this will be queued by the sync layer.
    await mapRepository.saveGeofenceAlert(alert);
  }

  /// Fetch active search areas for the user.
  Future<List<SearchArea>> _fetchActiveAreas(String userId) async {
    final result = await mapRepository.getSearchAreas(userId);
    if (result.isFailure) return <SearchArea>[];
    return result.value.where((a) => a.isActive).toList();
  }

  /// Reset containment state (e.g., when areas are updated).
  void resetState() {
    _containmentState.clear();
  }

  /// Clean up resources.
  void dispose() {
    stop();
    _containmentState.clear();
  }
}

// ── Riverpod Providers ──────────────────────────────────────────────

/// Provider for the [GeofenceMonitor] singleton.
///
/// The monitor starts automatically when first read and stops when the
/// provider is disposed (app shutdown).
final geofenceMonitorProvider = Provider<GeofenceMonitor>((ref) {
  final monitor = GeofenceMonitor(
    locationService: ref.watch(locationServiceProvider),
    geofenceService: ref.watch(geofenceServiceProvider),
    mapRepository: ref.watch(mapRepositoryProvider),
  );

  // Start monitoring on provider creation.
  monitor.start();

  // Clean up on disposal.
  ref.onDispose(() {
    monitor.dispose();
  });

  return monitor;
});
