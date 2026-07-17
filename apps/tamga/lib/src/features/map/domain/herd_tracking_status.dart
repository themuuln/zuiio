/// Мал сүрэгийн GPS мөрдөх төлөв — хяналтын нэгж бүрийн шинэчлэлтийн горим.
enum TrackingMode {
  moving('Хөдөлж байна'),
  stationary('Зогссон'),
  inGeofence('Хашаанд байна'),
  lowBattery('Батарей бага'),
  stopped('Мөрдөхгүй');

  const TrackingMode(this.label);
  final String label;
}

/// Мал сүрэгийн GPS мөрдөх нийт төлөв.
///
/// Хяналтын нэгж бүр энэ мөрийг stream-ээр дамжуулж
/// хэрэглэгчийн дэлгэц шинэчилнэ.
class HerdTrackingStatus {
  const HerdTrackingStatus({
    required this.isTracking,
    required this.trackedHorseCount,
    required this.queuedLocations,
    required this.batteryLevel,
    required this.mode,
    required this.lastUpdate,
    this.trackedHorseIds = const [],
  });

  final bool isTracking;
  final int trackedHorseCount;
  final int queuedLocations;
  final int batteryLevel;
  final TrackingMode mode;
  final DateTime lastUpdate;
  final List<String> trackedHorseIds;

  HerdTrackingStatus copyWith({
    bool? isTracking,
    int? trackedHorseCount,
    int? queuedLocations,
    int? batteryLevel,
    TrackingMode? mode,
    DateTime? lastUpdate,
    List<String>? trackedHorseIds,
  }) {
    return HerdTrackingStatus(
      isTracking: isTracking ?? this.isTracking,
      trackedHorseCount: trackedHorseCount ?? this.trackedHorseCount,
      queuedLocations: queuedLocations ?? this.queuedLocations,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      mode: mode ?? this.mode,
      lastUpdate: lastUpdate ?? this.lastUpdate,
      trackedHorseIds: trackedHorseIds ?? this.trackedHorseIds,
    );
  }

  /// Эхлэх төлөв.
  factory HerdTrackingStatus.initial() => HerdTrackingStatus(
    isTracking: false,
    trackedHorseCount: 0,
    queuedLocations: 0,
    batteryLevel: 100,
    mode: TrackingMode.stopped,
    lastUpdate: DateTime(2000),
  );

  Map<String, dynamic> toJson() => {
    'is_tracking': isTracking,
    'tracked_horse_count': trackedHorseCount,
    'queued_locations': queuedLocations,
    'battery_level': batteryLevel,
    'mode': mode.name,
    'last_update': lastUpdate.toIso8601String(),
    'tracked_horse_ids': trackedHorseIds,
  };

  factory HerdTrackingStatus.fromJson(Map<String, dynamic> json) {
    return HerdTrackingStatus(
      isTracking: json['is_tracking'] as bool? ?? false,
      trackedHorseCount: json['tracked_horse_count'] as int? ?? 0,
      queuedLocations: json['queued_locations'] as int? ?? 0,
      batteryLevel: json['battery_level'] as int? ?? 100,
      mode: TrackingMode.values.firstWhere(
        (e) => e.name == json['mode'],
        orElse: () => TrackingMode.stopped,
      ),
      lastUpdate: DateTime.parse(json['last_update'] as String),
      trackedHorseIds:
          (json['tracked_horse_ids'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );
  }
}
