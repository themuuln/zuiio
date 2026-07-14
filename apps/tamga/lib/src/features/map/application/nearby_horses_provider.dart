import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/horse_location.dart';
import 'map_providers.dart';

/// Nearby horses within a given radius.
final nearbyHorsesProvider = FutureProvider.family<List<HorseLocation>, double>(
  (ref, radiusKm) async {
    final pos = await ref.watch(currentPositionProvider.future);
    if (pos == null) return <HorseLocation>[];

    final repo = ref.watch(mapRepositoryProvider);
    final result = await repo.getNearbyHorses(
      pos.latitude,
      pos.longitude,
      radiusKm,
    );
    final horses = <HorseLocation>[];
    result.when(onSuccess: (v) => horses.addAll(v), onFailure: (e) => throw e);
    return horses;
  },
);

/// Real-time stream of nearby horses.
final nearbyHorsesStreamProvider = StreamProvider<List<HorseLocation>>((
  ref,
) async* {
  final pos = await ref.watch(currentPositionProvider.future);
  if (pos == null) {
    yield <HorseLocation>[];
    return;
  }

  final repo = ref.watch(mapRepositoryProvider);
  yield* repo.watchNearbyHorses(
    pos.latitude,
    pos.longitude,
    20.0, // default 20km radius for stream
  );
});

/// Whether the current user's horse location is visible to others.
final horseVisibilityProvider = StateProvider<bool>((ref) => false);
