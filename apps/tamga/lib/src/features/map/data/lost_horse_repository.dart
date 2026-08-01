import 'package:tamga/src/core/error/result.dart';

import '../domain/map_enums.dart';
import '../domain/lost_horse_report.dart';
import '../domain/sighting_report.dart';

/// Data access contract dedicated to horse/livestock recovery.
abstract interface class LostHorseRepository {
  Future<Result<LostHorseReport>> createReport(
    LostHorseReport report, {
    List<String> localMediaPaths = const [],
    List<String> mediaIds = const [],
  });

  Future<Result<LostHorseReport>> getReport(String reportId);
  Future<Result<List<LostHorseReport>>> getMyReports(String ownerId);
  Future<Result<List<LostHorseReport>>> browseActiveReports();
  Future<Result<LostHorseReport>> publishReport(
    String reportId, {
    List<String> expectedMediaIds = const [],
  });
  Future<Result<LostHorseReport>> resolveReport({
    required String reportId,
    required LostHorseResolutionType resolutionType,
    String? note,
    String? verifiedSightingId,
  });
  Future<Result<SightingReport>> createSighting(SightingReport sighting);
  Future<Result<List<SightingReport>>> getSightings(String reportId);
  Future<Result<SightingReport>> reviewSighting({
    required String sightingId,
    required SightingStatus status,
  });
}
