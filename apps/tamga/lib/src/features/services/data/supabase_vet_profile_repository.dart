import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../domain/vet_profile.dart';
import 'services_repository.dart';

/// Supabase cloud implementation for the vet_profiles table.
class SupabaseVetProfileRepository
    with SupabaseRepositoryMixin
    implements VetProfileRepository {
  SupabaseVetProfileRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  @override
  Future<Result<List<VetProfile>>> fetchAll() async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('vet_profiles')
          .select('*, service_providers!inner(location_aimag)');

      final profiles = (response as List<dynamic>)
          .map(
            (row) => VetProfile.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(profiles);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<List<VetProfile>>> fetchByAimag(String aimag) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok([]);

      final response = await client
          .from('vet_profiles')
          .select('*, service_providers!inner(location_aimag)')
          .eq('service_providers.location_aimag', aimag);

      final profiles = (response as List<dynamic>)
          .map(
            (row) => VetProfile.fromSupabaseJson(row as Map<String, dynamic>),
          )
          .toList();

      return Result.ok(profiles);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<VetProfile?>> fetchById(String id) async {
    try {
      final client = safeClient;
      if (client == null) return const Result.ok(null);

      final response = await client
          .from('vet_profiles')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return const Result.ok(null);

      return Result.ok(VetProfile.fromSupabaseJson(response));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}
