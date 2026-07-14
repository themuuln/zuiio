import 'package:isar/isar.dart';

import '../../../map/domain/geofence_alert.dart';
import '../../../map/domain/map_enums.dart';

part 'isar_geofence_alert.g.dart';

/// Isar collection for offline persistence of [GeofenceAlert].
@collection
class IsarGeofenceAlert {
  IsarGeofenceAlert();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID.
  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String horseId;
  late String horseName;
  late String geofenceId;
  late String geofenceName;
  late String alertType; // stored as string from GeofenceAlertType.name
  late DateTime triggeredAt;
  late double horseLat;
  late double horseLng;
  late bool acknowledged;

  factory IsarGeofenceAlert.fromDomain(GeofenceAlert alert) {
    return IsarGeofenceAlert()
      ..domainId = alert.id
      ..horseId = alert.horseId
      ..horseName = alert.horseName
      ..geofenceId = alert.geofenceId
      ..geofenceName = alert.geofenceName
      ..alertType = alert.alertType.name
      ..triggeredAt = alert.triggeredAt
      ..horseLat = alert.horseLat
      ..horseLng = alert.horseLng
      ..acknowledged = alert.acknowledged;
  }

  GeofenceAlert toDomain() {
    return GeofenceAlert(
      id: domainId,
      horseId: horseId,
      horseName: horseName,
      geofenceId: geofenceId,
      geofenceName: geofenceName,
      alertType: GeofenceAlertType.values.firstWhere(
        (e) => e.name == alertType,
      ),
      triggeredAt: triggeredAt,
      horseLat: horseLat,
      horseLng: horseLng,
      acknowledged: acknowledged,
    );
  }
}
