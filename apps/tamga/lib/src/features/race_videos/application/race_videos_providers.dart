import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/race_videos_repository.dart';
import '../domain/race_video.dart';

/// Provider for the race videos repository.
final raceVideosRepositoryProvider = Provider<RaceVideosRepository>((ref) {
  return RaceVideosRepository();
});

/// FutureProvider.family that fetches published race videos by category.
///
/// Pass `null` or `'Бүгд'` for all categories.
final raceVideosProvider = FutureProvider.family<List<RaceVideo>, String?>((
  ref,
  category,
) async {
  final repo = ref.watch(raceVideosRepositoryProvider);
  final result = await repo.fetchPublished(category: category);
  return result.getOrThrow();
});
