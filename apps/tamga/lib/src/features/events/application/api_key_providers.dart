/// API түлхүүрийн providers.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_providers.dart';
import '../data/api_key_repository.dart';
import '../data/supabase_api_key_repository.dart';
import '../domain/api_key.dart';

// ── Repository provider ─────────────────────────────────────────

/// API түлхүүрийн repository provider.
final apiKeyRepositoryProvider = Provider<ApiKeyRepository>((ref) {
  return SupabaseApiKeyRepository();
});

// ── API key list ───────────────────────────────────────────────

/// Одоогийн хэрэглэгчийн API түлхүүрүүдийн жагсаалт.
final userApiKeysProvider = FutureProvider<List<ApiKey>>((ref) async {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userId = authState?.userId;
  if (userId == null || userId.isEmpty) return [];

  final repo = ref.read(apiKeyRepositoryProvider);
  final result = await repo.getApiKeys(userId);
  return result.getOrThrow();
});

// ── Usage stats (per key) ──────────────────────────────────────

/// API түлхүүрийн хэрэглээний статистик.
final apiKeyUsageProvider = FutureProvider.family<ApiKeyUsageStats, String>((
  ref,
  keyId,
) async {
  final repo = ref.read(apiKeyRepositoryProvider);
  final result = await repo.getUsageStats(keyId);
  return result.getOrThrow();
});
