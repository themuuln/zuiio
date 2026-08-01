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

/// Owner-selected closure reason for a recovery report.
enum LostHorseResolutionType {
  reunited('Эзэндээ буцсан'),
  withdrawn('Хайхаа больсон'),
  duplicate('Давхардсан зар'),
  expired('Хугацаа дууссан');

  const LostHorseResolutionType(this.label);
  final String label;
}

enum GeofenceAlertType { entered, exited }
