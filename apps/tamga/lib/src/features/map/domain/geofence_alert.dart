import 'map_enums.dart';

/// An alert triggered when a horse enters or exits a geofence boundary.
class GeofenceAlert {
  const GeofenceAlert({
    required this.id,
    required this.horseId,
    required this.horseName,
    required this.geofenceId,
    required this.geofenceName,
    required this.alertType,
    required this.triggeredAt,
    required this.horseLat,
    required this.horseLng,
    this.acknowledged = false,
  });

  final String id;
  final String horseId;
  final String horseName;
  final String geofenceId;
  final String geofenceName;
  final GeofenceAlertType alertType;
  final DateTime triggeredAt;
  final double horseLat;
  final double horseLng;
  final bool acknowledged;

  GeofenceAlert copyWith({
    String? id,
    String? horseId,
    String? horseName,
    String? geofenceId,
    String? geofenceName,
    GeofenceAlertType? alertType,
    DateTime? triggeredAt,
    double? horseLat,
    double? horseLng,
    bool? acknowledged,
  }) {
    return GeofenceAlert(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      horseName: horseName ?? this.horseName,
      geofenceId: geofenceId ?? this.geofenceId,
      geofenceName: geofenceName ?? this.geofenceName,
      alertType: alertType ?? this.alertType,
      triggeredAt: triggeredAt ?? this.triggeredAt,
      horseLat: horseLat ?? this.horseLat,
      horseLng: horseLng ?? this.horseLng,
      acknowledged: acknowledged ?? this.acknowledged,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'horse_id': horseId,
    'horse_name': horseName,
    'geofence_id': geofenceId,
    'geofence_name': geofenceName,
    'alert_type': alertType.name,
    'triggered_at': triggeredAt.toIso8601String(),
    'horse_lat': horseLat,
    'horse_lng': horseLng,
    'acknowledged': acknowledged,
  };

  factory GeofenceAlert.fromJson(Map<String, dynamic> json) {
    return GeofenceAlert(
      id: json['id'] as String,
      horseId: json['horse_id'] as String,
      horseName: json['horse_name'] as String,
      geofenceId: json['geofence_id'] as String,
      geofenceName: json['geofence_name'] as String,
      alertType: GeofenceAlertType.values.firstWhere(
        (e) => e.name == json['alert_type'],
      ),
      triggeredAt: DateTime.parse(json['triggered_at'] as String),
      horseLat: (json['horse_lat'] as num).toDouble(),
      horseLng: (json['horse_lng'] as num).toDouble(),
      acknowledged: json['acknowledged'] as bool? ?? false,
    );
  }
}
