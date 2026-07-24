import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../domain/api_key.dart';
import 'api_key_repository.dart';

/// Supabase implementation of [ApiKeyRepository].
///
/// Uses SHA-256 hashing for API keys. The raw key is only ever returned
/// once at creation time; subsequent reads return the key prefix only.
class SupabaseApiKeyRepository
    with SupabaseRepositoryMixin
    implements ApiKeyRepository {
  SupabaseApiKeyRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  @override
  Future<Result<List<ApiKey>>> getApiKeys(String userId) async {
    try {
      final sb = safeClient;
      if (sb == null) return Result.fail(noClientError());

      final response = await sb
          .from('organizer_api_keys')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final keys = (response as List<dynamic>)
          .map((r) => ApiKey.fromSupabaseJson(r as Map<String, dynamic>))
          .toList();

      return Result.ok(keys);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ApiKeyCreated>> createApiKey(
    String userId,
    CreateApiKeyRequest request,
  ) async {
    try {
      final sb = safeClient;
      if (sb == null) return Result.fail(noClientError());

      // Generate a random API key: "tg_" + 40 random hex chars
      final rawKey = _generateApiKey();
      final keyHash = _hashKey(rawKey);
      final keyPrefix = rawKey.substring(0, min(8, rawKey.length));

      // Compute expiry if requested
      DateTime? expiresAt;
      if (request.expiresInDays != null) {
        expiresAt = DateTime.now().add(Duration(days: request.expiresInDays!));
      }

      final permissions = request.tier.defaultPermissions;

      final response = await sb
          .from('organizer_api_keys')
          .insert({
            'user_id': userId,
            'name': request.name,
            'key_hash': keyHash,
            'key_prefix': keyPrefix,
            'tier': request.tier.name,
            'permissions': permissions,
            'rate_limit_per_minute': request.tier == ApiKeyTier.stable
                ? 60
                : 30,
            'is_active': true,
            'expires_at': expiresAt?.toIso8601String(),
          })
          .select()
          .single();

      final apiKey = ApiKey.fromSupabaseJson(response);

      return Result.ok(ApiKeyCreated(key: apiKey, fullKey: rawKey));
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> revokeApiKey(String keyId) async {
    try {
      final sb = safeClient;
      if (sb == null) return Result.fail(noClientError());

      await sb
          .from('organizer_api_keys')
          .update({'is_active': false})
          .eq('id', keyId);

      return Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<ApiKeyUsageStats>> getUsageStats(String keyId) async {
    try {
      final sb = safeClient;
      if (sb == null) return Result.fail(noClientError());

      // Fetch the key to get rate limit
      final keyRow = await sb
          .from('organizer_api_keys')
          .select('rate_limit_per_minute')
          .eq('id', keyId)
          .single();

      final rateLimit = keyRow['rate_limit_per_minute'] as int? ?? 30;

      // Total requests — use a simple count query
      final totalResponse = await sb
          .from('api_usage_log')
          .select('id')
          .eq('api_key_id', keyId);

      final total = (totalResponse as List<dynamic>).length;

      // Requests today
      final todayStart = DateTime.now()
          .copyWith(hour: 0, minute: 0, second: 0, millisecond: 0)
          .toIso8601String();
      final todayResponse = await sb
          .from('api_usage_log')
          .select('id')
          .eq('api_key_id', keyId)
          .gte('created_at', todayStart);

      final todayCount = (todayResponse as List<dynamic>).length;

      // Requests in the last minute
      final oneMinAgo = DateTime.now()
          .subtract(const Duration(minutes: 1))
          .toIso8601String();
      final recentResponse = await sb
          .from('api_usage_log')
          .select('endpoint, response_time_ms, status_code')
          .eq('api_key_id', keyId)
          .gte('created_at', oneMinAgo);

      final recentList = (recentResponse as List<dynamic>? ?? []);

      // Average response time
      double? avgResponseTime;
      final times = recentList
          .whereType<Map<String, dynamic>>()
          .map((r) => r['response_time_ms'] as int?)
          .whereType<int>()
          .toList();
      if (times.isNotEmpty) {
        avgResponseTime = times.reduce((a, b) => a + b) / times.length;
      }

      // Error rate
      double? errorRate;
      if (recentList.isNotEmpty) {
        final errors = recentList
            .whereType<Map<String, dynamic>>()
            .where((r) => (r['status_code'] as int? ?? 200) >= 400)
            .length;
        errorRate = errors / recentList.length;
      }

      // Last endpoints
      final endpointCounts = <String, int>{};
      for (final row in recentList.whereType<Map<String, dynamic>>()) {
        final ep = row['endpoint'] as String? ?? '';
        endpointCounts[ep] = (endpointCounts[ep] ?? 0) + 1;
      }

      return Result.ok(
        ApiKeyUsageStats(
          keyId: keyId,
          totalRequests: total,
          requestsToday: todayCount,
          requestsThisMinute: recentList.length,
          rateLimit: rateLimit,
          avgResponseTimeMs: avgResponseTime,
          errorRate: errorRate,
          lastEndpoints: endpointCounts.isNotEmpty ? endpointCounts : null,
        ),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /// Generates a random API key: "tg_" + 40 hex chars.
  String _generateApiKey() {
    final rng = Random.secure();
    final bytes = List<int>.generate(20, (_) => rng.nextInt(256));
    return 'tg_${bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }

  /// SHA-256 hash of the raw key.
  String _hashKey(String rawKey) {
    final bytes = utf8.encode(rawKey);
    return sha256.convert(bytes).toString();
  }
}
