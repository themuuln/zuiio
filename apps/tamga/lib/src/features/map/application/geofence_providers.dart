import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../domain/search_area.dart';
import '../domain/geofence_alert.dart';
import '../data/geofence_service.dart';
import 'map_providers.dart';

/// All active search areas for the current user.
final activeGeofencesProvider = FutureProvider<List<SearchArea>>((ref) async {
  final repo = ref.watch(mapRepositoryProvider);
  final userId = currentSupabaseUserId();
  if (userId == null) return <SearchArea>[];
  final result = await repo.getSearchAreas(userId);
  final areas = <SearchArea>[];
  result.when(
    onSuccess: (v) => areas.addAll(v.where((a) => a.isActive)),
    onFailure: (e) => throw e,
  );
  return areas;
});

/// Geofence alerts for the current user.
final geofenceAlertsProvider = FutureProvider<List<GeofenceAlert>>((ref) async {
  final repo = ref.watch(mapRepositoryProvider);
  final userId = currentSupabaseUserId();
  if (userId == null) return <GeofenceAlert>[];
  final result = await repo.getGeofenceAlerts(userId);
  final alerts = <GeofenceAlert>[];
  result.when(onSuccess: (v) => alerts.addAll(v), onFailure: (e) => throw e);
  return alerts;
});

/// Count of unacknowledged alerts.
final unacknowledgedAlertCountProvider = Provider<int>((ref) {
  final alerts = ref.watch(geofenceAlertsProvider);
  return alerts.when(
    data: (list) => list.where((a) => !a.acknowledged).length,
    loading: () => 0,
    error: (_, _) => 0,
  );
});

/// Create a new search area.
final createSearchAreaProvider = FutureProvider.family<SearchArea, SearchArea>((
  ref,
  area,
) async {
  final repo = ref.read(mapRepositoryProvider);
  final result = await repo.saveSearchArea(area);
  SearchArea? saved;
  result.when(
    onSuccess: (v) {
      saved = v;
      ref.invalidate(activeGeofencesProvider);
    },
    onFailure: (e) => throw e,
  );
  return saved!;
});

/// Geofence service provider.
final geofenceServiceProvider = Provider<GeofenceService>((ref) {
  return GeofenceService();
});
