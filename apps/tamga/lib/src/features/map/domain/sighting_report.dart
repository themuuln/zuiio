/// A community sighting report — "I saw this horse."
///
/// Linked to a [LostHorseReport] via [reportId].
/// Multiple sightings per report build community depth,
/// which research shows correlates with 3.2× higher recovery rates.
class SightingReport {
  const SightingReport({
    required this.id,
    required this.reportId,
    required this.reporterId,
    required this.lat,
    required this.lng,
    this.locationName,
    this.description,
    this.photoUrl,
    this.isAnonymous = false,
    this.status = SightingStatus.pending,
    required this.createdAt,
  });

  final String id;
  final String reportId;
  final String reporterId;
  final double lat;
  final double lng;
  final String? locationName;
  final String? description;
  final String? photoUrl;
  final bool isAnonymous;
  final SightingStatus status;
  final DateTime createdAt;

  SightingReport copyWith({
    String? id,
    String? reportId,
    String? reporterId,
    double? lat,
    double? lng,
    String? locationName,
    String? description,
    String? photoUrl,
    bool? isAnonymous,
    SightingStatus? status,
    DateTime? createdAt,
  }) {
    return SightingReport(
      id: id ?? this.id,
      reportId: reportId ?? this.reportId,
      reporterId: reporterId ?? this.reporterId,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      locationName: locationName ?? this.locationName,
      description: description ?? this.description,
      photoUrl: photoUrl ?? this.photoUrl,
      isAnonymous: isAnonymous ?? this.isAnonymous,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'report_id': reportId,
    'reporter_id': reporterId,
    'lat': lat,
    'lng': lng,
    'location_name': locationName,
    'description': description,
    'photo_url': photoUrl,
    'is_anonymous': isAnonymous,
    'status': status.name,
    'created_at': createdAt.toIso8601String(),
  };

  factory SightingReport.fromJson(Map<String, dynamic> json) {
    return SightingReport(
      id: json['id'] as String,
      reportId: json['report_id'] as String,
      reporterId: json['reporter_id'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      locationName: json['location_name'] as String?,
      description: json['description'] as String?,
      photoUrl: json['photo_url'] as String?,
      isAnonymous: json['is_anonymous'] as bool? ?? false,
      status: SightingStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => SightingStatus.pending,
      ),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

enum SightingStatus {
  pending('Хүлээгдэж буй'),
  confirmed('Баталгаажсан'),
  dismissed('Үгүйсгэсэн');

  const SightingStatus(this.label);
  final String label;
}
