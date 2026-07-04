import 'package:latlong2/latlong.dart' as ll;

import '../domain/search_area.dart';

/// Pure Dart geofencing calculations.
/// No network dependency — works fully offline.
class GeofenceService {
  final _distance = ll.Distance();

  /// Whether [pointLat]/[pointLng] falls inside the geofence circle.
  bool isInsideCircle(
    double pointLat,
    double pointLng,
    double centerLat,
    double centerLng,
    double radiusKm,
  ) {
    final meters = _distance(
      ll.LatLng(centerLat, centerLng),
      ll.LatLng(pointLat, pointLng),
    );
    return meters <= radiusKm * 1000;
  }

  /// Distance in meters from the geofence edge to the point.
  /// Negative if the point is inside the circle.
  double distanceToEdge(
    double pointLat,
    double pointLng,
    double centerLat,
    double centerLng,
    double radiusKm,
  ) {
    final meters = _distance(
      ll.LatLng(centerLat, centerLng),
      ll.LatLng(pointLat, pointLng),
    );
    return meters - radiusKm * 1000;
  }

  /// Find all geofence areas that contain the given point.
  List<SearchArea> findContainingAreas(
    double pointLat,
    double pointLng,
    List<SearchArea> areas,
  ) {
    return areas.where((area) {
      if (!area.isActive) return false;
      return isInsideCircle(
        pointLat,
        pointLng,
        area.centerLat,
        area.centerLng,
        area.radiusKm,
      );
    }).toList();
  }

  /// Find geofence areas that do NOT contain the point (point is outside).
  List<SearchArea> findExcludedAreas(
    double pointLat,
    double pointLng,
    List<SearchArea> areas,
  ) {
    return areas.where((area) {
      if (!area.isActive) return false;
      return !isInsideCircle(
        pointLat,
        pointLng,
        area.centerLat,
        area.centerLng,
        area.radiusKm,
      );
    }).toList();
  }
}
