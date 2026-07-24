import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/horse_record.dart';
import 'horses_repository.dart';

/// Supabase cloud implementation of [HorsesRepository].
///
/// Performs CRUD against the `horses` table. All methods return
/// [Result] to keep the data layer free of raw throws.
class SupabaseHorsesRepository with SupabaseRepositoryMixin implements HorsesRepository {
  SupabaseHorsesRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── HorsesRepository ─────────────────────────────────────────────

  @override
  Future<Result<List<HorseRecord>>> fetchHorses() async {
    try {
      final client = safeClient;
      if (client == null) {
        return const Result.ok([]);
      }

      final userId = await currentUserId;
      if (userId == null) {
        return const Result.ok([]);
      }

      final response = await client
          .from('horses')
          .select()
          .eq('owner_id', userId)
          .order('birth_year');

      final horses = (response as List<dynamic>)
          .map(
            (item) =>
                HorseRecord.fromSupabaseJson(item as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(horses);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<HorseRecord>>> syncHorses() => fetchHorses();

  @override
  Future<Result<PaginatedResult<HorseRecord>>> fetchHorsesPaginated({
    required int page,
    required int limit,
  }) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.ok(PaginatedResult(items: [], totalCount: 0));
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.ok(PaginatedResult(items: [], totalCount: 0));
      }

      final from = (page - 1) * limit;
      final to = from + limit - 1;

      final response = await client
          .from('horses')
          .select()
          .eq('owner_id', userId)
          .order('birth_year')
          .range(from, to);

      final horses = (response as List<dynamic>)
          .map(
            (item) =>
                HorseRecord.fromSupabaseJson(item as Map<String, dynamic>),
          )
          .toList();

      // Get total count
      final countResponse = await client
          .from('horses')
          .select('id')
          .eq('owner_id', userId)
          .count();

      final totalCount = countResponse.count;

      return Result.ok(PaginatedResult(items: horses, totalCount: totalCount));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<HorseRecord>> saveHorse(HorseRecord horse) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      final data = horse.toSupabaseJson(ownerId: userId);

      // Upsert: insert or update on id conflict
      await client.from('horses').upsert(data);

      return Result.ok(horse);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> deleteHorse(String id) async {
    try {
      final client = safeClient;
      if (client == null) {
        return Result.fail(noClientError());
      }

      final userId = await currentUserId;
      if (userId == null) {
        return Result.fail(noClientError());
      }

      await client.from('horses').delete().eq('id', id).eq('owner_id', userId);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

}
