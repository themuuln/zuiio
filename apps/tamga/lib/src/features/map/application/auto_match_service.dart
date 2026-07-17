import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/lost_horse_report.dart';
import '../domain/map_enums.dart';
import '../domain/sighting_report.dart';
import 'map_providers.dart';

/// Auto-match service: cross-references sightings against lost reports.
///
/// When a new sighting is reported, this service checks if it matches
/// any active lost horse reports based on location proximity, timeframe,
/// and animal description.
class AutoMatchService {
  AutoMatchService({required this.repository});

  final dynamic repository; // MapRepository

  /// Check if a sighting matches any active lost horse reports.
  ///
  /// Returns a list of matched reports sorted by relevance (proximity + time).
  List<LostHorseReport> findMatches({
    required SightingReport sighting,
    required List<LostHorseReport> activeReports,
    double maxDistanceKm = 20.0,
    int maxDaysOld = 7,
  }) {
    final now = DateTime.now();
    final matches = <(LostHorseReport, double)>[];

    for (final report in activeReports) {
      // Skip expired or non-active reports
      if (report.status != LostHorseStatus.active) continue;

      // Check timeframe
      final daysSinceLost = now.difference(report.lastSeenAt).inDays;
      if (daysSinceLost > maxDaysOld) continue;

      // Calculate distance
      final distance = report.distanceTo(sighting.lat, sighting.lng);
      final distanceKm = distance / 1000;
      if (distanceKm > maxDistanceKm) continue;

      // Check animal description similarity
      double relevanceScore = 0;

      // Proximity score (closer = higher)
      relevanceScore += max(0, 1.0 - (distanceKm / maxDistanceKm));

      // Timeframe score (more recent = higher)
      relevanceScore += max(0, 1.0 - (daysSinceLost / maxDaysOld));

      // Description match bonus
      if (sighting.description != null &&
          report.description != null &&
          sighting.description!.toLowerCase().contains(
            report.description!.toLowerCase(),
          )) {
        relevanceScore += 0.5;
      }

      matches.add((report, relevanceScore));
    }

    // Sort by relevance (highest first)
    matches.sort((a, b) => b.$2.compareTo(a.$2));

    return matches.map((m) => m.$1).toList();
  }
}

/// Provider for AutoMatchService.
final autoMatchServiceProvider = Provider<AutoMatchService>((ref) {
  return AutoMatchService(repository: ref.watch(mapRepositoryProvider));
});
