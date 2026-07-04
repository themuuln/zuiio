/// A horse's current GPS location, shared with nearby owners.
class HorseLocation {
  const HorseLocation({
    required this.horseId,
    required this.horseName,
    required this.ownerId,
    required this.ownerName,
    required this.lat,
    required this.lng,
    required this.lastUpdated,
    this.isVisible = false,
    this.coatColor,
  });

  final String horseId;
  final String horseName;
  final String ownerId;
  final String ownerName;
  final double lat;
  final double lng;
  final DateTime lastUpdated;
  final bool isVisible;
  final String? coatColor;

  HorseLocation copyWith({
    String? horseId,
    String? horseName,
    String? ownerId,
    String? ownerName,
    double? lat,
    double? lng,
    DateTime? lastUpdated,
    bool? isVisible,
    String? coatColor,
  }) {
    return HorseLocation(
      horseId: horseId ?? this.horseId,
      horseName: horseName ?? this.horseName,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      isVisible: isVisible ?? this.isVisible,
      coatColor: coatColor ?? this.coatColor,
    );
  }

  Map<String, dynamic> toJson() => {
    'horse_id': horseId,
    'horse_name': horseName,
    'owner_id': ownerId,
    'owner_name': ownerName,
    'lat': lat,
    'lng': lng,
    'last_updated': lastUpdated.toIso8601String(),
    'is_visible': isVisible,
    'coat_color': coatColor,
  };

  factory HorseLocation.fromJson(Map<String, dynamic> json) {
    return HorseLocation(
      horseId: json['horse_id'] as String,
      horseName: json['horse_name'] as String,
      ownerId: json['owner_id'] as String,
      ownerName: json['owner_name'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      lastUpdated: DateTime.parse(json['last_updated'] as String),
      isVisible: json['is_visible'] as bool? ?? false,
      coatColor: json['coat_color'] as String?,
    );
  }
}
