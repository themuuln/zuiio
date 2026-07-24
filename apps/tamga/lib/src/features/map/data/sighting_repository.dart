import 'package:tamga/src/core/error/result.dart';

import '../domain/sighting_report.dart';

/// Abstract interface for sighting operations.
abstract class SightingRepository {
  /// Report a new sighting for a lost horse report.
  Future<Result<SightingReport>> reportSighting(SightingReport sighting);

  /// Get all sightings for a specific lost horse report.
  Future<Result<List<SightingReport>>> getSightingsForReport(String reportId);

  /// Get sightings reported by the current user.
  Future<Result<List<SightingReport>>> getMySightings(String reporterId);

  /// Update sighting status (confirmed/dismissed) — report owner only.
  Future<Result<void>> updateSightingStatus(String id, String status);

  /// Delete a sighting — reporter only.
  Future<Result<void>> deleteSighting(String id);

  /// Real-time stream of sightings for a report.
  Stream<List<SightingReport>> watchSightingsForReport(String reportId);
}
