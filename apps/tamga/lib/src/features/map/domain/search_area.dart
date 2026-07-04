import 'package:latlong2/latlong.dart' as ll;

/// A circular geofence area defined by center point and radius.
class SearchArea {
  const SearchArea({
    required this.id,
    required this.name,
    required this.centerLat,
    required this.centerLng,
    required this.radiusKm,
    this.color = 0xFFF06A2E,
    this.isActive = true,
    required this.createdBy,
    required this.createdAt,
  });

  final String id;
  final String name;
  final double centerLat;
  final double centerLng;
  final double radiusKm;
  final int color;
  final bool isActive;
  final String createdBy;
  final DateTime createdAt;

  /// Whether [lat]/[lng] falls inside this geofence circle.
  bool containsPoint(double lat, double lng) {
    final distance = ll.Distance();
    final meters = distance(
      ll.LatLng(centerLat, centerLng),
      ll.LatLng(lat, lng),
    );
    return meters <= radiusKm * 1000;
  }

  /// Distance in meters from the edge of this geofence to [lat]/[lng].
  /// Negative if inside.
  double distanceToEdge(double lat, double lng) {
    final distance = ll.Distance();
    final meters = distance(
      ll.LatLng(centerLat, centerLng),
      ll.LatLng(lat, lng),
    );
    return meters - radiusKm * 1000;
  }

  SearchArea copyWith({
    String? id,
    String? name,
    double? centerLat,
    double? centerLng,
    double? radiusKm,
    int? color,
    bool? isActive,
    String? createdBy,
    DateTime? createdAt,
  }) {
    return SearchArea(
      id: id ?? this.id,
      name: name ?? this.name,
      centerLat: centerLat ?? this.centerLat,
      centerLng: centerLng ?? this.centerLng,
      radiusKm: radiusKm ?? this.radiusKm,
      color: color ?? this.color,
      isActive: isActive ?? this.isActive,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'center_lat': centerLat,
    'center_lng': centerLng,
    'radius_km': radiusKm,
    'color': color,
    'is_active': isActive,
    'created_by': createdBy,
    'created_at': createdAt.toIso8601String(),
  };

  factory SearchArea.fromJson(Map<String, dynamic> json) {
    return SearchArea(
      id: json['id'] as String,
      name: json['name'] as String,
      centerLat: (json['center_lat'] as num).toDouble(),
      centerLng: (json['center_lng'] as num).toDouble(),
      radiusKm: (json['radius_km'] as num).toDouble(),
      color: json['color'] as int? ?? 0xFFF06A2E,
      isActive: json['is_active'] as bool? ?? true,
      createdBy: json['created_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
