import 'package:isar/isar.dart';

import '../../../map/domain/sighting_report.dart';

part 'isar_sighting_report.g.dart';

/// Isar collection for offline persistence of [SightingReport].
@collection
class IsarSightingReport {
  IsarSightingReport();

  Id id = Isar.autoIncrement;

  /// Domain model's String ID.
  @Index(unique: true, replace: true)
  late String domainId;

  /// Links to the lost horse report this sighting is about.
  @Index()
  late String reportId;

  /// Who reported the sighting.
  @Index()
  late String reporterId;

  late double lat;
  late double lng;
  String? locationName;
  String? description;
  String? photoUrl;
  late bool isAnonymous;
  late String status; // stored as string from SightingStatus.name
  late DateTime createdAt;

  factory IsarSightingReport.fromDomain(SightingReport report) {
    return IsarSightingReport()
      ..domainId = report.id
      ..reportId = report.reportId
      ..reporterId = report.reporterId
      ..lat = report.lat
      ..lng = report.lng
      ..locationName = report.locationName
      ..description = report.description
      ..photoUrl = report.photoUrl
      ..isAnonymous = report.isAnonymous
      ..status = report.status.name
      ..createdAt = report.createdAt;
  }

  SightingReport toDomain() {
    return SightingReport(
      id: domainId,
      reportId: reportId,
      reporterId: reporterId,
      lat: lat,
      lng: lng,
      locationName: locationName,
      description: description,
      photoUrl: photoUrl,
      isAnonymous: isAnonymous,
      status: SightingStatus.values.firstWhere(
        (e) => e.name == status,
        orElse: () => SightingStatus.pending,
      ),
      createdAt: createdAt,
    );
  }
}
