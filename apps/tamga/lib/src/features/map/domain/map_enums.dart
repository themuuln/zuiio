/// Map feature enums — marker types, geofence types, layers, alert priorities.
library;

enum HorseMarkerType { normal, lost, located }

enum GeofenceType { searchArea, customBoundary, alertZone }

enum MapLayer { standard, terrain }

enum AlertPriority { low, medium, urgent }

enum LostHorseStatus {
  active('Идэвхтэй'),
  found('Олсон'),
  cancelled('Цуцалсан'),
  expired('Хугацаа дууссан');

  const LostHorseStatus(this.label);
  final String label;
}

enum GeofenceAlertType { entered, exited }
