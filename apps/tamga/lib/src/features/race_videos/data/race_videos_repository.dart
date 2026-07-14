import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/result.dart';
import '../domain/race_video.dart';

/// Repository for race video CRUD and view tracking.
class RaceVideosRepository {
  RaceVideosRepository({SupabaseClient? client})
    : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  /// Fetch published race videos, optionally filtered by category.
  Future<Result<List<RaceVideo>>> fetchPublished({String? category}) async {
    return Result.tryFuture(() async {
      var query = _client.from('race_videos').select().eq('published', true);

      if (category != null && category != 'Бүгд') {
        query = query.eq('category', category);
      }

      final data = await query.order('created_at', ascending: false);
      return (data as List<dynamic>)
          .map(
            (json) => RaceVideo.fromSupabaseJson(json as Map<String, dynamic>),
          )
          .toList();
    });
  }

  /// Increment the view count for a video.
  Future<Result<void>> incrementViewCount(String videoId) async {
    return Result.tryFuture(() async {
      await _client.rpc(
        'increment_race_video_view_count',
        params: {'video_id': videoId},
      );
    });
  }
}
